import { Component, Show, createSignal } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { IBaseRoom } from 'quackamole-shared-types';
import { QuackamoleRTCClient } from 'quackamole-rtc-client';

export const RoomLobby: Component<{ quackamole: QuackamoleRTCClient, room: IBaseRoom }> = props => {
  let nameInput: HTMLInputElement;
  const [_, setDisplayName] = useLocalStorage('displayName', '');
  const [registerUserError, setRegisterUserError] = createSignal('');

  const registerUser = async (displayName: string): Promise<void> => {
    const res = await props.quackamole.registerUser(displayName);
    if (res instanceof Error) setRegisterUserError(res.message);
    else {
      setDisplayName(res.displayName);
      props.quackamole.loginUser();
    }
  };

  return <>
    <div class="flex justify-center items-center flex-col h-full bg-stone-950">
      <div class="flex flex-col max-w-[600px] min-w-[400px] p-10 rounded border-stone-600 border bg-stone-800">
        <Show when={registerUserError()}>
          <div>{registerUserError()}</div>
        </Show>
        <div>Join the Meeting</div>
        <input ref={el => nameInput = el} type="text" placeholder="Enter your display name" />
        <button onClick={() => registerUser(nameInput.value)}>Enter</button>
      </div>
    </div>
  </>;
};
