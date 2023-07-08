import { Component, For, createSignal } from "solid-js";
import { TiThMenu } from 'solid-icons/ti'
import { IPlugin, QuackamoleRTCClient } from "../quackamole-rtc/quackamole";
import { Portal } from "solid-js/web";

// TODO this data should be fetched from the server
const plugins: IPlugin[] = [
  { id: 'random_number', name: 'Random number', url: 'https://andreas-schoch.github.io/p2p-test-plugin/', description: '', version: '0.0.1' },
  { id: 'paint', name: 'Paint', url: 'https://andreas-schoch.github.io/quackamole-plugin-paint/', description: '', version: '0.0.1' },
  { id: 'gomoku', name: 'Gomoku', url: 'https://quackamole-dev.github.io/quackamole-plugin-gomoku/', description: '', version: '0.0.1' },
  { id: '2d_shooter', name: '2d Shooter (WIP)', url: 'https://andreas-schoch.github.io/quackamole-plugin-2d-topdown-shooter/', description: '', version: '0.0.1' },
  { id: 'breakout_game', name: 'Breakout game', url: 'https://andreas-schoch.github.io/breakout-game/', description: '', version: '0.0.1' },
  { id: 'snowboarding_game', name: 'Snowboarding Game', url: 'https://snowboarding.game', description: '', version: '0.0.1' }

];

export const RoomSidebar: Component<{ quackamole: QuackamoleRTCClient }> = ({ quackamole }) => {
  const [open, setOpen] = createSignal(false);

  return <>
    <button>
      <TiThMenu onclick={() => setOpen(!open())} />

      <Portal>
        <ul class={(open() ? "" : "hidden") + " absolute left-0 top-0 bottom-0 w-300 bg-white border-black border-1 border-solid"}>
          <For each={plugins} fallback={<div>Plugins loading...</div>}>
            {(item) => <li onclick={() => quackamole.setPlugin(item)}>{item.name}</li>}
          </For>
        </ul>
      </Portal>
    </button>
  </>;
};
