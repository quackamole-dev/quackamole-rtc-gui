
export class PeerService {
  private readonly socket: WebSocket

  constructor() {
    this.socket = new WebSocket('ws://localhost:8080');
    this.socket.onopen = () => {};

      this.socket.onclose = () => {
        if (peerId) {
          delete this.sockets[peerId];
        }
      };

      socket.onmessage = (message: string) => {
        const data = JSON.parse(message);
        if (data.type === 'offer') this.handleOffer(socket, data);
        else if (data.type === 'answer') this.handleAnswer(socket, data);
        else if (data.type === 'icecandidate') this.handleIceCandidate(socket, data);     
    });
  }

  connectWith(peerId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection();
    const socket = this.sockets[peerId];

    peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: 'icecandidate', candidate: event.candidate }));
      }
    });

    peerConnection.addEventListener('negotiationneeded', async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.send(JSON.stringify({ type: 'offer', offer }));
    });

    return peerConnection;
  }

  private handleOffer(socket: WebSocket, data: any): void {
    const { peerId, offer } = data;
    const peerConnection = new RTCPeerConnection();

    peerConnection.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: 'icecandidate', candidate: event.candidate }));
      }
    });

    peerConnection.addEventListener('negotiationneeded', async () => {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.send(JSON.stringify({ type: 'answer', peerId: socket.query.peerId, answer }));
    });

    peerConnection.setRemoteDescription(offer);
    this.sockets[peerId].send(JSON.stringify({ type: 'offer', peerId: socket.query.peerId, offer }));
  }

  private handleAnswer(socket: WebSocket, data: any): void {
    const { peerId, answer } = data;
    const peerConnection = this.connectWith(peerId);
    peerConnection.setRemoteDescription(answer);
  }

  private handleIceCandidate(socket: WebSocket, data: any): void {
    const { peerId, candidate } = data;
    const peerConnection = this.connectWith(peerId);
    peerConnection.addIceCandidate(candidate);
  }
}