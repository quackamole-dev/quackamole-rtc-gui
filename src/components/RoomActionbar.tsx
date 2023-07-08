
import { TbMicrophone, TbMicrophoneOff, TbVideoOff, TbVideo, TbMenu2 } from 'solid-icons/tb'
import { Component, For, createSignal } from 'solid-js';
import { IPlugin, QuackamoleRTCClient } from '../quackamole-rtc/quackamole';
import { Portal } from 'solid-js/web';
import { TiThMenu } from 'solid-icons/ti';

export const RoomActionbar: Component<{ quackamole: QuackamoleRTCClient }> = ({ quackamole }) => {
  const [open, setOpen] = createSignal(false);


  const setAudioIcon = () => {
    // if (localStreamWrapper) {
    //   const audioTrack = localStreamWrapper.stream.getAudioTracks()[0];
    //   if (audioTrack && audioTrack.enabled) return <TbMicrophone />;
    // }
    return <TbMicrophoneOff class="text-2xl" />
  };

  const setVideoIcon = () => {
    // if (localStreamWrapper) {
    //   const videoTrack = localStreamWrapper.stream.getVideoTracks()[0];
    //   if (videoTrack && videoTrack.enabled) return <TbVideo />;
    // }
    return <TbVideoOff class="text-2xl" />;
  };

  return (
    <div class="flex justify-center bg-stone-800 border rounded border-stone-600" id="actionbar">
      <button class="w-[42px] h-[42px] flex rounded justify-center items-center my-auto mx-2 border border-stone-600 bg-stone-700 hover:bg-stone-600 hover:border-stone-500" onclick={() => setOpen(!open())}><TbMenu2 class="text-2xl" /></button>
      <button class="w-[42px] h-[42px] flex rounded justify-center items-center my-auto mx-2 border border-stone-600 bg-stone-700 hover:bg-stone-600 hover:border-stone-500" onclick={() => quackamole.toggleMicrophoneEnabled()}>{setAudioIcon()}</button>
      <button class="w-[42px] h-[42px] flex rounded justify-center items-center my-auto mx-2 border border-stone-600 bg-stone-700 hover:bg-stone-600 hover:border-stone-500" onclick={() => quackamole.toggleCameraEnabled()}>{setVideoIcon()}</button>

      <Portal>
        <ul class={(open() ? "" : "hidden") + " absolute left-0 top-0 bottom-0 w-300 bg-white border-black border-1 border-solid"}>
          <For each={plugins} fallback={<div>Plugins loading...</div>}>
            {(item) => <li onclick={() => quackamole.setPlugin(item)}>{item.name}</li>}
          </For>
        </ul>
      </Portal>
      {/* <RoomSidebarChat /> */}
    </div>
  );
};

const plugins: IPlugin[] = [
  { id: 'random_number', name: 'Random number', url: 'https://andreas-schoch.github.io/p2p-test-plugin/', description: '', version: '0.0.1' },
  { id: 'paint', name: 'Paint', url: 'https://andreas-schoch.github.io/quackamole-plugin-paint/', description: '', version: '0.0.1' },
  { id: 'gomoku', name: 'Gomoku', url: 'https://quackamole-dev.github.io/quackamole-plugin-gomoku/', description: '', version: '0.0.1' },
  { id: '2d_shooter', name: '2d Shooter (WIP)', url: 'https://andreas-schoch.github.io/quackamole-plugin-2d-topdown-shooter/', description: '', version: '0.0.1' },
  { id: 'breakout_game', name: 'Breakout game', url: 'https://andreas-schoch.github.io/breakout-game/', description: '', version: '0.0.1' },
  { id: 'snowboarding_game', name: 'Snowboarding Game', url: 'https://snowboarding.game', description: '', version: '0.0.1' }
];
