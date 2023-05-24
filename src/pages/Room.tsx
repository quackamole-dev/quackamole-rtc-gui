import { Component, createEffect, Show, onCleanup } from 'solid-js';
import { useLocalStorage, useWebSocket } from 'solidjs-use';
import { LivingRoom } from '../components/LivingRoom';
import { RoomLobby } from '../components/RoomLobby';
import { awaitedPromises, socket } from '../contexts/awaitedPromises';
import { usePeerConnections } from '../utils/usePeerConnection';

export const Room: Component = () => {
  const { status, data, send, open, close } = useWebSocket('ws://localhost:12000/ws');
  const [displayName, setDisplayName] = useLocalStorage('displayName', '');
  const [peerConnections, addPeerConnection, removePeerConnection] = usePeerConnections();

  createEffect(() => handleSocketMessage(data()));

  onCleanup(() => close());

  const handleSocketMessage = async (dataRaw: string) => {
    if (!dataRaw) return;
    const data = JSON.parse(dataRaw);

    if (data.awaitId) {
      const { resolve, reject } = awaitedPromises[data.awaitId];
      return data.error ? reject(data.error) : resolve(data);
    }

    if (data.topic === 'personal') {
      console.log('personal message', data);
    } else if (data.topic.includes('rooms/')) {
      const senderPeerConnection = peerConnections().find((pc) => pc.remoteDescription?.sdp === data.sender.sdp);
      const receiverPeerConnection = peerConnections().find((pc) => pc.remoteDescription?.sdp === data.receiver.sdp);

      switch (data.type) {
        case 'relay':
          console.log('someone sent a relay message', data);
          break;
        case 'broadcast':
          console.log('someone sent a broadcast message', data);
          break;
        case 'offer':
          console.log('received an offer', data);
          await receiverPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await receiverPeerConnection.createAnswer();
          await receiverPeerConnection.setLocalDescription(answer);
          send({
            type: 'answer',
            answer: answer,
            sender: data.receiver,
            receiver: data.sender,
          });
          break;
        case 'answer':
          console.log('received an answer', data);
          await senderPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          break;
        case 'candidate':
          console.log('received an ice candidate', data);
          if (senderPeerConnection) {
            await senderPeerConnection.addIceCandidate(data.candidate);
          } else if (receiverPeerConnection) {
            await receiverPeerConnection.addIceCandidate(data.candidate);
          }
          break;
        default:
          console.log('unknown message type', data);
          break;
      }
    } else {
      console.log('unknown message', data);
    }
  };

  return (
    <Show when={status() === 'OPEN'} fallback={'Opening Socket...'}>
      <Show when={displayName()} fallback={<RoomLobby setDisplayName={setDisplayName} />}>
        <div>room/</div>
        <LivingRoom />
      </Show>
    </Show>
  );
};
