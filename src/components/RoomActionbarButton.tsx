import { ParentComponent } from 'solid-js';

export const RoomActionbarButton: ParentComponent<{ onclick: () => void }> = props => {
  return <>
    <button onclick={props.onclick} class="w-[42px] h-[42px] flex rounded justify-center items-center my-auto mx-2 border border-stone-600 bg-stone-700 hover:bg-stone-600 hover:border-stone-500">
      {props.children}
    </button>
  </>;
};
