import {Component, createEffect, Show} from 'solid-js';
import {setVideoSrc} from '../utils/setVideoSource';

export const MediaStreamCard: Component<{ stream: MediaStream, user: { displayName: string }, muted: boolean }> = props => {
  let videoRef: HTMLVideoElement;

  createEffect(() => {
    setVideoSrc(videoRef, props.stream, props.muted);
  });

  return (
    <div>
      <Show when={props.stream} fallback="loading stream...">
        <video ref={el => videoRef = el}/>
      </Show>
    </div>
  );
};
