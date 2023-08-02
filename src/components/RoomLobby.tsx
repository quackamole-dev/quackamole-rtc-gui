import { Component, Show, createSignal } from 'solid-js';
import { useLocalStorage } from 'solidjs-use';
import { IBaseRoom } from 'quackamole-shared-types';
import { QuackamoleRTCClient } from 'quackamole-rtc-client';
import { MediaPreview } from './MediaPreview';
import { IUserInfo } from 'quackamole-rtc-client/dist/QuackamoleRTCClient';

export const RoomLobby: Component<{ quackamole: QuackamoleRTCClient, room: IBaseRoom, userInfo: IUserInfo }> = props => {
  let nameInput: HTMLInputElement;
  const setDisplayName = useLocalStorage('displayName', '')[1];
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
      <div class="flex flex-col max-w-[600px] min-w-[400px] p-10 q-card">
        <Show when={registerUserError()}>
          <div>{registerUserError()}</div>
        </Show>
        <h2 class="text-xl m-auto mb-8 my-custom-class">Join the Meeting</h2>
        <input class="q-input-text" type='text' ref={el => nameInput = el} placeholder={'Enter your display name'} id='name-input' aria-label='Enter your Name' />
        <button class="q-btn-primary" onClick={() => registerUser(nameInput.value)}>Enter</button>
        <MediaPreview quackamole={props.quackamole} userInfo={props.userInfo} />
      </div>
    </div>
  </>;
};
