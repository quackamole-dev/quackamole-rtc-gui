import { Component, Show, createSignal } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { IBaseRoom, QuackamoleRTCClient } from '../quackamole-rtc/quackamole';

export const RoomLobby: Component<{ quackamole: QuackamoleRTCClient, room: IBaseRoom }> = props => {
  let nameInput: HTMLInputElement;
  const [_, setDisplayName] = useLocalStorage('displayName', '');
  const [registerUserError, setRegisterUserError] = createSignal('');

  const registerUser = async (displayName: string): Promise<void> => {
    const res = await props.quackamole.registerUser(displayName);
    if (res instanceof Error) setRegisterUserError(res.message);
    else setDisplayName(res.displayName);
  };

  return <>
    <div class="flex justify-center items-center flex-col h-full bg-stone-950">
      <div class="flex flex-col max-w-[600px] min-w-[400px] p-10 rounded border-stone-600 border bg-stone-800">
        <Show when={registerUserError()}>
          <div>{registerUserError()}</div>
        </Show>
        <div>Join the Meeting</div>
        <input ref={el => nameInput = el} type="text" placeholder="Enter your display name" />
        <button onclick={() => registerUser(nameInput.value)}>Enter</button>
      </div>
    </div>
  </>;
};


// moderated page: https://moderated.jitsi.net/aff23abfac4247f0bcdcdfd34f63e3311001c62a46324bdeb5e6b2ea068c5f23
// guest access:   https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76


// in room as moderator: https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76
// ?jwt=eyJraWQiOiJqaXRzaS1tb2RlcmF0ZWQtcHJvZC0yMDIxLTA2LTA0IiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtb2RlcmF0ZWQiLCJhdWQiOiJqaXRzaSIsImlzcyI6ImppdHNpIiwiY29udGV4dCI6eyJncm91cCI6Im1vZGVyYXRlZCJ9LCJyb29tIjoiNWY3MmI4NTEyMjQ0YzQ3YzkxYjNkNjA5ZGM3MDU1NDUwNzcwYWE4NjQ3YWI0NGVhZmZhYWE3MzlkZTRlYWE3NiJ9.m4Fnx18N3u5lu67vHL_Ah-aAs8JDMdkjwalAY-bgENUxFxRosnRWf_EIHzs_rrb0zJxHv1XGUKqm5kYoeg0teVeL5nvZX6ZRXSXUU_ZMUWJCZhwiwDp5HanRxnQ9_muubhTlWl-ioxBzEO1V-61jIFnGpsSdLYcurqHNJU6mjIxXBQj1jB-T30ONH0n_IyhW72RJOErzr7tWwND3-9g85F_kCqK5yDn0tvlLqpvSbGsqvTbk1nIsfpExoTU49JiAz-uzr7tgBLFekp9ah6yTtQ7weuUUVCQVGUL2M8W5gdaqT4i2tqTUIk5PHXNGdnPxQX_GW2XfJkASys0ZavxIXg

// After clicking guest access (need to set display name):  https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76
// After setting display name and clicking join (same url): https://meet.jit.si/moderated/5f72b8512244c47c91b3d609dc7055450770aa8647ab44eaffaaa739de4eaa76

