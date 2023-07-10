
import { TbMicrophoneOff, TbVideoOff, TbMenu2 } from 'solid-icons/tb';
import { Component, For, createResource, createSignal } from 'solid-js';
import { QuackamoleRTCClient, QuackamoleHttpClient  } from 'quackamole-rtc-client';
import { Portal } from 'solid-js/web';
import { RoomActionbarButton } from './RoomActionbarButton';
import { QuackamoleGrid } from '../quackamole-grid/QuackamoleGrid';

export const RoomActionbar: Component<{ quackamole: QuackamoleRTCClient }> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [plugins] = createResource(QuackamoleHttpClient.getPlugins);

  const setAudioIcon = () => {
    // if (localStreamWrapper) {
    //   const audioTrack = localStreamWrapper.stream.getAudioTracks()[0];
    //   if (audioTrack && audioTrack.enabled) return <TbMicrophone />;
    // }
    return <TbMicrophoneOff class="text-2xl" />;
  };

  const setVideoIcon = () => {
    // if (localStreamWrapper) {
    //   const videoTrack = localStreamWrapper.stream.getVideoTracks()[0];
    //   if (videoTrack && videoTrack.enabled) return <TbVideo />;
    // }
    return <TbVideoOff class="text-2xl" />;
  };

  return (
    <div class="flex justify-center bg-stone-800 border rounded border-stone-600 select-none" id="actionbar" ref={el => QuackamoleGrid.registerGridItem(el, 1, 10, 14, 11)}>
      <RoomActionbarButton onclick={() => setOpen(!open())}>
        <TbMenu2 class="text-2xl" />
      </RoomActionbarButton>
      <RoomActionbarButton onclick={() => props.quackamole.toggleMicrophoneEnabled()}>
        {setAudioIcon()}
      </RoomActionbarButton>
      <RoomActionbarButton onclick={() => props.quackamole.toggleCameraEnabled()}>
        {setVideoIcon()}
      </RoomActionbarButton>

      <Portal>
        <ul class={(open() ? '' : 'hidden') + ' absolute left-0 top-0 bottom-0 w-300 bg-white border-black border-1 border-solid'}>
          <For each={plugins()} fallback={<div>Plugins loading...</div>}>
            {(item) => <li onClick={() => props.quackamole.setPlugin(item)}>{item.name}</li>}
          </For>
        </ul>
      </Portal>
      {/* <RoomSidebarChat /> */}
    </div>
  );
};
