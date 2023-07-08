import { Component, createEffect, Show } from 'solid-js';
import { setVideoSrc } from '../utils/setVideoSource';
import { IUser } from '../quackamole-rtc/quackamole';
import { TbVideoOff } from 'solid-icons/tb';

export const GenericMediaStream: Component<{ user?: IUser | null, stream?: MediaStream | null, flipX?: boolean }> = props => {
  let videoRef: HTMLVideoElement;

  createEffect(() => {
    setVideoSrc(videoRef, props.stream, true);
  });

  return (
    <div class="relative w-full h-[130px] border border-stone-600 rounded overflow-hidden mb-[5px]">
      <Show when={props.stream} fallback={<TbVideoOff class="text-2xl" />}>
        <video class={"object-cover w-full h-full" + (props.flipX ? " -scale-x-100" : "")}  ref={el => videoRef = el} />
      </Show>
      <div class="absolute left-1 bottom-1 text-white select-none" style="text-shadow: 0 1px 2px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.3)">{props.user?.displayName || '---'}</div>
    </div>
  );
};
