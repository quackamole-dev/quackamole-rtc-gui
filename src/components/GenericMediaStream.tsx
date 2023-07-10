import { Component, createEffect, Show } from 'solid-js';
import { setVideoSrc } from '../utils/setVideoSource';
import { IUser } from 'quackamole-shared-types';
import { TbVideoOff } from 'solid-icons/tb';


export const GenericMediaStream: Component<{ user: IUser | null, mute?: boolean, flipX?: boolean }> = props => {
  let videoRef: HTMLVideoElement;
  let containerRef: HTMLElement;

  createEffect(() => {
    const s = props.user?.stream;
    if (!s) return;
    if (!s.getAudioTracks()[0]) {
      containerRef.style.boxShadow = 'none';
      return;
    }

    const SNAPSHOT_SIZE = 25;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(s);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    // source.connect(audioContext.destination);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const snapshot: number[] = new Array(SNAPSHOT_SIZE).fill(-100);
    let snapshotIndex = 0;  // to keep track of where to write in the circular buffer

    function measureLevel(): void {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = (dataArray[i] - 128) / 128;
        sum += value * value;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const rmsDb = 20 * Math.log10(rms);
      if (rmsDb !== -Infinity) {
        snapshot[snapshotIndex] = rmsDb;
        snapshotIndex = (snapshotIndex + 1) % SNAPSHOT_SIZE;
        const talking = snapshot.some(s => s >= -30);
        containerRef.style.boxShadow = talking ? '0px 0px 0px 2px #6366F1' : '';
      }
      requestAnimationFrame(measureLevel);
    }

    measureLevel();
  });

  createEffect(() => {
    const s = props.user?.stream;
    if (!s) return;
    setVideoSrc(videoRef, s, props.mute);
  });

  return (
    <div class="relative w-full h-[130px] border border-stone-600 rounded overflow-hidden mb-[5px]" ref={el => containerRef = el}>
      <Show when={props.user?.stream} fallback={<TbVideoOff class="text-2xl" />}>
        <video class={'object-cover w-full h-full' + (props.flipX ? ' -scale-x-100' : '')} ref={el => videoRef = el} />
      </Show>
      <div class="absolute left-1 bottom-1 text-white select-none" style={{'text-shadow':'0 1px 2px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.3)'}}>{props.user?.displayName || '---'}</div>
    </div>
  );
};
