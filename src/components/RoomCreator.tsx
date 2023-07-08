import type { Component } from 'solid-js';
import { createMemo, createSignal, Show } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { TextCopyOutput } from './TextCopyOutput';
import { IAdminRoom, IBaseRoom, QuackamoleRTCClient } from '../quackamole-rtc/quackamole';

export const RoomCreator: Component = () => {
  const params = useParams();

  const [room, setRoom] = createSignal<IAdminRoom | null>(null);
  const [error, setError] = createSignal('');

  const roomGuestUrl = createMemo(() => `${location.origin}/${room()?.id}`);
  const roomAdminUrl = createMemo(() => `${location.origin}/${room()?.adminId}`);

  // const [input, setInput] = createSignal('');
  // const { text, copy, copied, isSupported } = useClipboard({ source: roomGuestUrl })

  async function createRoom() {
    const room = await QuackamoleRTCClient.createRoom();
    room instanceof Error ? setError(room.message) : setRoom(room);
  }

  return <>
    <div>
      <Show when={!room()}>
        <button onclick={createRoom}>Create Room</button>
        <Show when={error()}>
          <div>{error()}</div>
        </Show>
      </Show>
      <Show when={room()}>
        <div class="text-2xl">Created</div>
        <div>Share this link with others:</div>
        <TextCopyOutput text={roomGuestUrl} />

        <div>Share this link with other Moderators:</div>
        <TextCopyOutput text={roomAdminUrl} />
        <A href={`/${room()?.adminId}`}>Join as Moderator</A>
      </Show>
    </div>
  </>;
};


// moderated page: https://moderated.jitsi.net/aff23abfac4247f0bcdcdfd34f63e3311001c62a46324bdeb5e6b2ea068c5f23
// guest access:   https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76


// in room as moderator: https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76
// ?jwt=eyJraWQiOiJqaXRzaS1tb2RlcmF0ZWQtcHJvZC0yMDIxLTA2LTA0IiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtb2RlcmF0ZWQiLCJhdWQiOiJqaXRzaSIsImlzcyI6ImppdHNpIiwiY29udGV4dCI6eyJncm91cCI6Im1vZGVyYXRlZCJ9LCJyb29tIjoiNWY3MmI4NTEyMjQ0YzQ3YzkxYjNkNjA5ZGM3MDU1NDUwNzcwYWE4NjQ3YWI0NGVhZmZhYWE3MzlkZTRlYWE3NiJ9.m4Fnx18N3u5lu67vHL_Ah-aAs8JDMdkjwalAY-bgENUxFxRosnRWf_EIHzs_rrb0zJxHv1XGUKqm5kYoeg0teVeL5nvZX6ZRXSXUU_ZMUWJCZhwiwDp5HanRxnQ9_muubhTlWl-ioxBzEO1V-61jIFnGpsSdLYcurqHNJU6mjIxXBQj1jB-T30ONH0n_IyhW72RJOErzr7tWwND3-9g85F_kCqK5yDn0tvlLqpvSbGsqvTbk1nIsfpExoTU49JiAz-uzr7tgBLFekp9ah6yTtQ7weuUUVCQVGUL2M8W5gdaqT4i2tqTUIk5PHXNGdnPxQX_GW2XfJkASys0ZavxIXg

// After clicking guest access (need to set display name):  https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76
// After setting display name and clicking join (same url): https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76

