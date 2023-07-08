export class QuackamoleRTCClient {
  private socket: WebSocket;
  private socketId: string | null = null;
  private currentRoom: IBaseRoom | null = null;
  private currentPlugin: IPlugin | null = null;

  private localUser: IUser | null = null;
  private localStream: MediaStream | null = null;
  private localStreamConstraints: MediaStreamConstraints = defaultMediaConstraints;
  private localStreamMicEnabled = true;
  private localStreamCamEnabled = true;

  private readonly awaitedPromises: Record<AwaitId, IAwaitedPromise> = {};
  private readonly connections: Map<IUser['id'], PeerConnection> = new Map();
  private readonly streams: Map<IUser['id'], MediaStream> = new Map();
  private readonly users: Map<IUser['id'], IUser> = new Map();
  private iframe: HTMLIFrameElement | null = null;

  constructor(url: string, iframeContainerLocator: string) {
    console.log('QuackamoleRTCClient constructor', url);
    this.socket = new WebSocket(url);
    this.socket.onmessage = evt => this.handleSocketMessages(evt.data);
    this.socket.onopen = evt => this.onsocketstatus('open', evt);
    this.socket.onclose = evt => this.onsocketstatus('closed', evt);
    this.socket.onerror = evt => this.onsocketstatus('error', evt);

    setTimeout(() => {

      this.iframe = document.createElement('iframe');
      this.iframe.style.cssText = `width: 100%; height: 100%; border: none`;
      document.querySelector(iframeContainerLocator)?.appendChild(this.iframe);
      if (!document.body.contains(this.iframe)) throw new Error(`iframe could not be attached to locator: "${iframeContainerLocator}"`);
    }, 1000);

    console.log('---------iframe', this.iframe);
    window.addEventListener('message', evt => evt.data.type && evt.data.type.startsWith('PLUGIN') && this.handlePluginMessageLegacy(evt.data));
  }

  onconnection = (id: string, connection: PeerConnection | null) => { };
  onremotestream = (id: string, stream: MediaStream | null) => { };
  onremoteuserdata = (id: string, userData: IUser | null) => { };
  onlocalstream = (stream: MediaStream | null) => { };
  onlocaluserdata = (userData: IUser) => { };
  onsocketstatus = (status: 'open' | 'closed' | 'error', evt?: Event) => { };
  onsetplugin = (plugin: IPlugin) => { };

  static async createRoom(): Promise<IAdminRoom | Error> {
    try {
      const res = await fetch(`http://localhost:12000/rooms`, { method: 'post', mode: 'cors' });
      return await res.json();
    } catch (e) {
      return new Error('failed to create room');
    }
  }

  static async getRoom(id: string): Promise<IBaseRoom | Error> {
    try {
      const res = await fetch(`http://localhost:12000/rooms/${id}`, { method: 'get', mode: 'cors' });
      return await res.json();
    } catch (e) {
      return new Error('failed to get room');
    }
  }

  static async getPlugins(): Promise<IPlugin | Error> {
    try {
      const res = await fetch(`http://localhost:12000/plugins`, { method: 'get', mode: 'cors' });
      return await res.json();
    } catch (e) {
      return new Error('failed to fetch plugins');
    }
  }

  async setPlugin(plugin: IPlugin): Promise<void> {
    this.socket.send(JSON.stringify({ action: 'plugin_set', data: { pluginId: plugin.id } }));
    this.currentPlugin = plugin;
    if (this.iframe) this.iframe.src = plugin.url;
    this.onsetplugin(plugin);
  }

  async registerUser(displayName: string): Promise<IUser | Error> {
    console.log('trying to register user');
    if (!this.socket) return new Error('socket undefined');
    if (this.socket.readyState !== WebSocket.OPEN) return new Error('socket not open');

    const [awaitId, promise] = this.registerAwaitIdPromise<IUserRegisterResponseMessage>();
    const message: IUserRegisterMessage = { action: 'user_register', awaitId, data: { displayName } };
    this.socket.send(JSON.stringify(message));
    const response = await promise;

    if (response.errors?.length) return new Error(response.errors?.join(', '));
    if (response.secret.length === 0) return new Error('secret is empty');

    localStorage.setItem('secret', response.secret);
    this.onlocaluserdata(response.user);
    return response.user;
  }

  async loginUser(): Promise<IUser | Error> {
    const secret = localStorage.getItem('secret'); // TODO allow adapters to change behaviour or move login and register completely to a AnonymousLoginAdapter
    console.log('trying to login user with secret', secret);
    if (this.localUser) return new Error('already logged in');
    if (!secret) return new Error('secret not found. Please register first');
    if (!this.socket) return new Error('socket undefined');
    if (this.socket.readyState !== WebSocket.OPEN) return new Error('socket not open');
    const [awaitId, promise] = this.registerAwaitIdPromise<IUserLoginResponseMessage>();
    const message: IUserLoginMessage = { action: 'user_login', awaitId, data: { secret } };
    this.socket.send(JSON.stringify(message));
    const response = await promise;
    if (response.errors?.length) return new Error(response.errors?.join(', '));
    console.log('loginUser success with socketId', response)
    this.socketId = response.user.id;
    this.localUser = response.user;
    this.onlocaluserdata(response.user);
    return response.user;
  }

  async joinRoom(roomId: string): Promise<IBaseRoom | Error> {
    if (!this.socket) return new Error('socket undefined');
    if (this.socket && !this.socketId) return new Error('socket id undefined');
    if (this.socket.readyState !== WebSocket.OPEN) return new Error('socket not open');
    const [awaitId, promise] = this.registerAwaitIdPromise<IRoomJoinResponseMessage>();
    const message: IRoomJoinMessage = { action: 'room_join', awaitId, data: { roomId } };
    this.socket.send(JSON.stringify(message));
    const response = await promise;
    if (response.errors?.length) return new Error(response.errors?.join(', '));
    this.currentRoom = response.room;
    await this.startLocalStream();

    // TODO this better be done with Promise.all()
    const idsToConnect = response.room.joinedUsers.filter(userId => userId !== this.socketId);
    for (const userId of idsToConnect) {
      const connection = await this.createConnection(userId);
      await this.sendSessionDescriptionToConnection(connection);
    }

    return response.room;
  }

  async startLocalStream(): Promise<MediaStream | Error> {
    console.log('startLocalStream');
    if (!this.localStreamMicEnabled && !this.localStreamCamEnabled) return new Error('both mic and cam are disabled');
    const actualConstraints = { ...this.localStreamConstraints };
    actualConstraints.audio = this.localStreamMicEnabled ? actualConstraints.audio : false;
    actualConstraints.video = this.localStreamCamEnabled ? actualConstraints.video : false;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(actualConstraints);
      this.onlocalstream(this.localStream);
      return this.localStream;
    } catch (error) {
      this.onlocalstream(null);
      return new Error('local stream couldn\'t be started');
    }
  };

  private handleSocketMessages(messageRaw: string) {
    const m = JSON.parse(messageRaw);
    console.log('handleSocketMessages', m);

    // messages with an awaitId are handled wherever they are awaited.
    if (m.awaitId) return m.errors?.length ? this.awaitedPromises[m.awaitId].reject(m.errors) : this.awaitedPromises[m.awaitId].resolve(m);

    if (m.type === 'message_relay_delivery') {
      if (m.data?.iceCandidates) return this.handleRTCIceCandidates(m);
      else if (m.data?.description) return this.handleSessionDescription(m);
    }

    if (m.type === 'room_event') {
      if (m.eventType === 'user_joined') return this.handleUserJoined(m.data.user);
      else if (m.eventType === 'user_left') return this.handleUserLeft(m.data.user);
    }
  }

  private async handleUserJoined(user: IUser) {
    this.onremoteuserdata(user.id, user);
    this.users.set(user.id, user);
  }

  private async handleUserLeft(user: IUser) {
    this.removeConnection(user.id);
  }

  private async handleSessionDescription(message: IMessageRelayDeliveryMessage<IRTCSessionDescriptionMessage>) {
    let connection = this.connections.get(message.senderId);
    if (!this.socketId) return console.error('handleSessionDescription - socketId not set');
    if (!this.currentRoom) return console.error('handleSessionDescription - currentRoom not set');

    if (message.data.description.type === 'offer') {
      console.log(`You received an OFFER from "${message.senderId}"...`);
      if (!connection) connection = await this.createConnection(message.senderId);
      await connection.setRemoteDescription(new RTCSessionDescription(message.data.description));
      await this.sendSessionDescriptionToConnection(connection, false);
    } else if (message.data.description.type === 'answer') {
      if (!connection) return console.error('No offer was ever made for the received answer. Investigate!');
      console.log(`You received an ANSWER from "${message.senderId}"...`);
      await connection.setRemoteDescription(new RTCSessionDescription(message.data.description));
    }
  }

  private async handleRTCIceCandidates(message: IMessageRelayDeliveryMessage<IRTCIceCandidatesMessage>) {
    const connection = this.connections.get(message.senderId);
    console.log(`You received ICE CANDIDATES from "${message.senderId}"...`, connection, message);
    if (!connection) return console.error('handleRTCIceCandidates - connection not found');
    for (const candidate of message.data.iceCandidates) await connection.addIceCandidate(candidate);
  }

  private handleDataChannelMessages(messageRaw: string) {
    const message = JSON.parse(messageRaw);
    console.log('handleDataChannelMessages', message);

    if (message.type === 'PLUGIN_DATA') {
      if (!this.iframe) throw new Error('iframe not set');
      this.iframe.contentWindow?.postMessage(message, '*');
      window.postMessage(message, '*'); // TODO remove this why needed?
    }
  }

  private handlePluginMessageLegacy(message: IPluginMessage) {
    if (message.type === 'PLUGIN_SEND_TO_ALL_PEERS') this.sendPluginMessageToAllConnections(message);
    else if (message.type === 'PLUGIN_SEND_TO_PEER') this.sendPluginMessageToConnection(message);
  }
  
  private sendPluginMessageToAllConnections(message: IPluginMessage) {
    const data = { type: 'PLUGIN_DATA', payload: message.payload };
    console.log('-------------LEGACY PLUGIN MESSAGE---', data, this.connections);
    this.connections.forEach(c => this.sendDataToConnection(c.defaultDataChannel, data));
  };

  private sendPluginMessageToConnection(message: IPluginMessage) {
    const connection = this.connections.get(message.socketId);
    if (!connection) return console.error('sendPluginMessageToConnection - connection not found');
    const data = { type: 'PLUGIN_DATA', payload: message.payload };
    this.sendDataToConnection(connection.defaultDataChannel, data);
  }

  sendDataToConnection(dataChannel: RTCDataChannel, data: { type: string; payload: any; }) {
    console.log('---------send to connection', dataChannel, data);
    if (!dataChannel) return;
    const serializedData = JSON.stringify(data);
    dataChannel.send(serializedData);
  }


  private sendSessionDescriptionToConnection = async (connection: PeerConnection, isOffer = true) => {
    if (!this.socketId) throw new Error('socketId not set');
    if (!this.currentRoom) throw new Error('currentRoom not set');
    const description = isOffer ? await connection.createOffer() : await connection.createAnswer();
    await connection.setLocalDescription(description);
    console.log('Sending description to remote peer...', description);
    const data: IRTCSessionDescriptionMessage = { description, senderSocketId: this.socketId };
    const message: IMessageRelayMessage = { action: 'message_relay', receiverIds: [connection.remoteSocketId], roomId: this.currentRoom?.id, data };
    this.socket.send(JSON.stringify(message));
  };

  private async createConnection(remoteSocketId: string): Promise<PeerConnection> {
    if (!this.socketId) throw new Error('socketId not defined');
    if (this.socketId === remoteSocketId) throw new Error('cannot connect with yourself');
    if (this.connections.has(remoteSocketId)) return this.connections.get(remoteSocketId) as PeerConnection;
    console.log(`Creating new RTCPeerConnection with "${remoteSocketId}" ...`);

    const newConnection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], iceCandidatePoolSize: 1 }) as PeerConnection;
    newConnection.remoteSocketId = remoteSocketId;
    newConnection.defaultDataChannel = newConnection.createDataChannel('default');
    this.setupDataChannelListeners(newConnection.defaultDataChannel);
    this.setupConnectionListeners(newConnection);

    this.connections.set(remoteSocketId, newConnection);
    this.onconnection(newConnection.remoteSocketId, newConnection);

    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      console.log(`Adding ${tracks.length}x stream tracks to the new RTCPeerConnection with "${remoteSocketId}"...`);
      for (const track of tracks) newConnection.addTrack(track, this.localStream);
    };


    // this.sendSessionDescriptionToConnection(newConnection, isOffer);
    return newConnection;
  }

  private removeConnection(connectionSocketId: SocketId) {
    const connection = this.connections.get(connectionSocketId);
    if (!connection) return console.error('removeConnection - connection not found');

    // if (connection && connection.remoteSocketId && connection.socketId) return; // TODO why was this returned here ???????
    if (connection.stream) this.clearStreamTracks(connection.stream);
    connection.close();
    this.connections.delete(connection.remoteSocketId);
    this.streams.delete(connection.remoteSocketId);
    this.users.delete(connection.remoteSocketId);
    this.onconnection(connection.remoteSocketId, null);
    this.onremotestream(connection.remoteSocketId, null);
    this.onremoteuserdata(connection.remoteSocketId, null);
  }

  private setupConnectionListeners(connection: PeerConnection) {
    if (!this.socket) return;
    if (!this.socketId) return;
    if (!this.currentRoom) return;

    console.log(`Initializing RTCPeerConnection listeners...`);
    const DELAY_MULTIPLIER = 1.5;
    const BASE_DELAY = 450;
    const MAX_ITERATIONS = 9;
    let currentIteration = 0;
    let iceCandidates: RTCIceCandidate[] = [];
    const senderSocketId = this.socketId;
    const roomId = this.currentRoom.id;

    // The goal is to send ice-candidates out quickly with the least amount of signaling until the null event which can take a long time
    const timer = () => { // TODO pass currentIteration as param
      if (iceCandidates.length) {
        console.log(`Sending ${iceCandidates.length}x ICE CANDIDATES to peer...`);
        const data: IRTCIceCandidatesMessage = { type: 'ice_candidates', iceCandidates, senderSocketId };
        const message: IMessageRelayMessage = { action: 'message_relay', roomId, data, receiverIds: [connection.remoteSocketId] };
        this.socket.send(JSON.stringify(message));
        iceCandidates = [];
      }

      currentIteration <= MAX_ITERATIONS && setTimeout(timer, BASE_DELAY * Math.pow(DELAY_MULTIPLIER, currentIteration++));
    };
    timer();

    connection.onicecandidate = evt => {
      if (evt.candidate) {
        iceCandidates.push(evt.candidate);
      } else {
        console.log('no more ICE');
        currentIteration = MAX_ITERATIONS + 1;
        timer();
      }
    };

    connection.ontrack = ({ track, streams }) => {
      if (!streams || !streams[0]) return console.error('ontrack - this should not happen... streams[0] is empty!');
      console.log(`A remote stream track was received from ${connection.remoteSocketId}...`);
      this.streams.set(connection.remoteSocketId, streams[0])
      this.onremotestream(connection.remoteSocketId, streams[0]);
    };

    connection.onnegotiationneeded = () => console.log(`(negotiationneeded for connection "${connection.remoteSocketId}"...)`);
    connection.oniceconnectionstatechange = () => connection.iceConnectionState === 'failed' && connection.restartIce();
    connection.onsignalingstatechange = evt => connection.signalingState === 'stable' && connection.localDescription && connection.remoteDescription && console.log('CONNECTION ESTABLISHED!! signaling state:', connection.signalingState);
    connection.ondatachannel = async evt => {
      console.log('------------------------------------Remote peer opened a data channel with you...', evt);
      connection.defaultDataChannel = evt.channel;
      this.setupDataChannelListeners(connection.defaultDataChannel);
      // dispatch(introduceYourself(connection.defaultDataChannel));
    };
  }

  private setupDataChannelListeners(dataChannel: RTCDataChannel) {
    if (!dataChannel) return;
    console.log(`Initializing data channel listeners...`);
    dataChannel.onopen = () => console.log('datachannel open...');
    dataChannel.onclose = () => console.log('datachannel close');
    dataChannel.onerror = evt => console.log('datachannel error:', evt);
    dataChannel.onmessage = evt => this.handleDataChannelMessages(evt.data);

    // setTimeout(() => dataChannel.send('hello from datachannel'), 3000);
  };

  private clearStreamTracks = (stream?: MediaStream) => {
    if (!stream) return;
    if (!stream.getTracks) return console.error('something wrong with the stream:', stream);
    stream.getTracks().forEach(track => track.stop());
  }

  /////////////////////////////////////
  private registerAwaitIdPromise<T>(awaitId = crypto.randomUUID()): [AwaitId, Promise<T>] {
    let resolve: IAwaitedPromise['resolve'] = () => { };
    let reject: IAwaitedPromise['resolve'] = () => { };
    const promise: Promise<T> = new Promise((res, rej) => {
      // @ts-ignore
      resolve = res;
      reject = rej;
    });
    this.awaitedPromises[awaitId] = { promise, resolve, reject };
    return [awaitId, promise];
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const defaultMediaConstraints: MediaStreamConstraints = {
  audio: {},
  video: {
    // frameRate: { ideal: 20, max: 25 }, // FIXME check supported constraints first to prevent errors
    width: { ideal: 128 },
    height: { ideal: 72 }
  }
};

export type PeerConnection = RTCPeerConnection & { remoteSocketId: string, defaultDataChannel: RTCDataChannel, stream: MediaStream }; // TODO why stream needed here?

export type Socket = WebSocket & { id: string };

export type AwaitId = string;

export interface IAwaitedPromise {
  promise: Promise<unknown>;
  resolve: (value: unknown | PromiseLike<unknown>) => void
  reject: (reason?: any) => void;
}

/////////////////////////////////////////
// SHARED 

export interface IBaseRoom {
  id: RoomId;
  name: string;
  maxUsers: number;
  joinedUsers: string[]; // TODO make IUser but maybe only when retrieving or on demand?
  adminUsers: string[];
  metadata?: JSON;
  parentRoom?: IBaseRoom;
  childRooms?: IBaseRoom[];
}

export interface IAdminRoom extends IBaseRoom {
  adminId: RoomId; // TODO implement
}

export type RoomJoinErrorCode = 'wrong_password' | 'already_full' | 'does_not_exist' | 'already_joined' | null | undefined;
export type UserLoginErrorCode = 'user_not_found' | 'wrong_secret';

export type RoomId = string;
export type SocketId = string;
export type UserId = string;

export interface IPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  url: string;
}

////////////////////////////////////////
// DATA OR RESPONSE MESSAGES
////////////////////////////////////////

export interface IRTCSessionDescriptionMessage {
  // type: 'offer' | 'answer';
  description: RTCSessionDescriptionInit;
  senderSocketId: SocketId;
}

export interface IRTCIceCandidatesMessage {
  type: 'ice_candidates';
  iceCandidates: RTCIceCandidateInit[];
  senderSocketId: SocketId;
}

// Server needs to know these below too 
export interface IUserRegisterResponseMessage {
  type: 'user_register_response';
  user: IUser;
  secret: string;
  errors: string[];
}

export interface IUserLoginResponseMessage {
  type: 'user_login_response';
  token: string;
  user: IUser;
  errors: UserLoginErrorCode[];
}

export interface IRoomJoinResponseMessage {
  type: 'room_join_response';
  errors: RoomJoinErrorCode[];
  room: IBaseRoom;
}

export interface IRoomCreateResponseMessage {
  type: 'room_create_response';
  errors: string[];
  room: IAdminRoom;
}

export interface IMessageRelayDeliveryMessage<T = unknown> {
  type: 'message_relay_delivery';
  senderId: SocketId; // prevents malicious user from pretending to be someone else as this is set by server
  data: T;
}

////////////////////////////////////////
// CLIENT TO SERVER
////////////////////////////////////////

export type Actions = 'room_create' | 'room_join' | 'room_broadcast' | 'message_relay' | 'user_register' | 'user_login';

export type SocketToServerMessage = IMessageRelayMessage | ICreateRoomMessage | IRoomJoinMessage | IBroadcastMessage;

interface IBaseSocketToServerMessage {
  action: Actions;
  awaitId?: string;
  data?: Record<string, unknown> | string | number | unknown;
}

export interface IBroadcastMessage extends IBaseSocketToServerMessage {
  roomIds: RoomId[];
}

export interface IMessageRelayMessage extends IBaseSocketToServerMessage {
  roomId: RoomId;
  receiverIds?: SocketId[];
}

export interface ICreateRoomMessage extends IBaseSocketToServerMessage {
  data: Partial<IBaseRoom>;
}

export interface IRoomJoinMessage extends IBaseSocketToServerMessage {
  data: { roomId: string };
}

export interface IUserRegisterMessage extends IBaseSocketToServerMessage {
  data: { displayName: string };
}

export interface IUserLoginMessage extends IBaseSocketToServerMessage {
  data: { secret: string };
}

///////////////////////////////////////

export interface IPluginMessage {
  type: 'PLUGIN_SEND_TO_ALL_PEERS' | 'PLUGIN_SEND_TO_PEER';
   payload: unknown;
   socketId: string;
}

// export interface IPluginMessage {
//   data: { type: 'PLUGIN_SEND_TO_ALL_PEERS' | 'PLUGIN_SEND_TO_PEER', payload: unknown, socketId: string };
// }

///////////////////////////////

export interface IUser {
  id: string;
  displayName: string;
  status: string;
  lastSeen: number;
}

export interface IUserSecret {
  userId: string;
  secret: string;
}
