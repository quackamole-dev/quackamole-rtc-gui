export class SocketService {
  private readonly socket: WebSocket

  constructor() {
    this.socket = new WebSocket('ws://localhost:8080');
    this.socket.onopen = () => { };

    this.socket.onclose = () => {
      if (peerId) {
        delete this.sockets[peerId];
      }
    };

    this.socket.onmessage = (message: string) => {
      const data = JSON.parse(message);
      if (data.type === 'offer') this.handleOffer(data);
      else if (data.type === 'answer') this.handleAnswer(data);
      else if (data.type === 'icecandidate') this.handleIceCandidate(data);
    };
  }

  connectWith(socketId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection();
    this.initPeerConnectionListeners(peerConnection, this.socket);
    return peerConnection;
  }

  private handleOffer(data: IPeerOfferMessage): void {
    const { peerId, offer } = data;
    const peerConnection = new RTCPeerConnection();
    this.initPeerConnectionListeners(peerConnection, this.socket);

    peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) this.socket.send(JSON.stringify({ type: 'icecandidate', candidate: event.candidate }));
    });

    peerConnection.addEventListener('negotiationneeded', async () => {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      this.socket.send(JSON.stringify({ type: 'answer', socketId: this.socket.id, answer }));
    });

    peerConnection.setRemoteDescription(offer);
    this.sockets[peerId].send(JSON.stringify({ type: 'offer', peerId: socket.query.peerId, offer }));
  }

  private handleAnswer(data: any): void {
    const { peerId, answer } = data;
    const peerConnection = this.connectWith(peerId);
    peerConnection.setRemoteDescription(answer);
  }

  private handleIceCandidate(data: any): void {
  }

  private initConnectionListeners(connection: RTCPeerConnection, remoteSocketId: string): void {
    console.log(`Initializing RTCPeerConnection listeners...`);
    const delayMultiplier = 1.5;
    const baseDelay = 450;
    const maxIterations = 9;
    let currentIteration = 0;
    let iceCandidates: RTCIceCandidate[] = [];

    // emits ice-candidates with an increasing delay until the onicecandidate null event
    // Most of the candidates trickle in within the first 0-2seconds but the null event can happen much later
    // The goal is to send ice-candidates out quickly with the least amount of signaling until the null event
    // High likelihood to be changed/simplified as time goes by...
    const timer = () => {
      if (iceCandidates.length) {
        console.log(`Sending ${iceCandidates.length}x ICE CANDIDATES to peer...`);
        this.socket.send('signaling', { receiverSocketId: remoteSocketId, iceCandidates: iceCandidates });
        iceCandidates = [];
      }

      if (currentIteration <= maxIterations) {
        const rawDelay = baseDelay * Math.pow(delayMultiplier, currentIteration);
        const roundedDelay = Math.round(rawDelay / 100 * 2) * 100 / 2;

        setTimeout(timer, Math.round(roundedDelay));
        currentIteration++;
      }
    };
    timer();

    connection.onicecandidate = (evt) => {
      const iceCandidate = evt.candidate;
      if (iceCandidate) {
        iceCandidates.push(iceCandidate);
      } else {
        console.log('no more ICE');
        currentIteration = maxIterations + 1;
        timer();
      }
    };

    connection.ontrack = ({ track, streams }) => {
      if (!streams && streams[0]) {
        console.log(`A remote stream track was received from ${connection.remoteSocketId}...`);
        // dispatch(addStream(connection.remoteSocketId, streams[0]));
      } else {
        console.error('ontrack - this should not happen... streams[0] is empty!');
      }
    };

    connection.onnegotiationneeded = async evt => {
      console.log(`(onnegotiationneeded triggered for connection with "${connection.remoteSocketId}"...)`);
    };

    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === 'failed') {
        console.error('oniceconnectionstatechange - restarting ICE');
        connection.restartIce();
      }
    };

    connection.onsignalingstatechange = evt => {
      if (connection.signalingState === 'stable' && connection.localDescription && connection.remoteDescription) {
        console.log('CONNECTION ESTABLISHED!! signaling state:', connection.signalingState);
      }
    };

    connection.ondatachannel = async evt => {
      console.log('Remote peer opened a data channel with you...', evt.channel);
      // await dispatch(initDataChannelListeners(connection.defaultDataChannel));
      // dispatch(introduceYourself(connection.defaultDataChannel));
    };
  }
}
