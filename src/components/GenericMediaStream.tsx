import {Component, createEffect, Show} from 'solid-js';
import {setVideoSrc} from '../utils/setVideoSource';
import { IUser } from '../quackamole-rtc/quackamole';

export const GenericMediaStream: Component<{ user?: IUser | null, stream?: MediaStream | null }> = props => {
  let videoRef: HTMLVideoElement;

  createEffect(() => {
    setVideoSrc(videoRef, props.stream, true);
  });

  return (
    <div>
      <Show when={props.stream} fallback="loading stream...">
        <video ref={el => videoRef = el}/>
        {/* <div>{props.user?.displayName || '-'}</div> */}
      </Show>
    </div>
  );
};
