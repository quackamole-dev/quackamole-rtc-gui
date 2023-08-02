/* eslint-disable solid/reactivity */
import {Component, For, Show, createEffect, createSignal} from 'solid-js';
import {GenericMediaStream} from './GenericMediaStream';
import { QuackamoleRTCClient } from 'quackamole-rtc-client';
import { Portal } from 'solid-js/web';
import { TbMicrophone, TbMicrophoneOff, TbVideo, TbVideoOff } from 'solid-icons/tb';
import { IUserInfo } from 'quackamole-rtc-client/dist/QuackamoleRTCClient';

export const MediaPreview: Component<{quackamole: QuackamoleRTCClient, userInfo: IUserInfo}> = props => {
  const [open, setOpen] = createSignal(false);
  const [microphones, setMicrophones] = createSignal<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = createSignal<MediaDeviceInfo[]>([]);
  const [activeMicrophone, setActiveMicrophone] = createSignal<MediaDeviceInfo>();
  const [activeCamera, setActiveCamera] = createSignal<MediaDeviceInfo>();

  createEffect(async () => {
    console.log('----effect preview', props.userInfo);
    if (!open()) return;
    if (!props.userInfo.stream && (props.userInfo.camEnabled || props.userInfo.micEnabled)) return await props.quackamole.startLocalStream();
    if (!props.userInfo.stream) return;

    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(device => device.kind === 'audioinput');
    const cams = devices.filter(device => device.kind === 'videoinput'); 

    const audioTrack = props.userInfo.stream?.getAudioTracks()[0];
    if (audioTrack) {
      const audioDevice = mics.find(d => d.label === audioTrack.label);
      if (audioDevice) setActiveMicrophone(audioDevice);
    }

    const videoTrack = props.userInfo.stream?.getVideoTracks()[0];
    if (videoTrack) {
      const videoDevice = cams.find(d => d.label === videoTrack.label);
      if (videoDevice) setActiveCamera(videoDevice);
    }
    
    setMicrophones(mics);
    setCameras(cams);
  });

  return <>
    <button class="q-btn-secondary" onClick={() => setOpen(true)}>Preview Audio & Video Settings</button>
    <Portal>
      <div class={`${open() ? '' : 'hidden'} flex justify-center items-center absolute inset-0 bg-stone-800 bg-opacity-75`} onClick={e => e.target === e.currentTarget && setOpen(false)}>
        <div class='max-w-[100vw] w-[500px] max-h-[100vh] p-6 q-card-lighter'>
          <h2 class="text-xl m-auto mb-8 my-custom-class">Audio & Video Settings</h2>
          <GenericMediaStream userInfo={props.userInfo} mute={false}/>
          <div class='flex justify-center m-auto relative bottom-[55px] mb-[-35px] opacity-70'>
            <button class="q-btn-action" onClick={() => props.quackamole.toggleMicrophoneEnabled()}>{props.userInfo.micEnabled ? <TbMicrophone /> : <TbMicrophoneOff />}</button>
            <button class="q-btn-action" onClick={() => props.quackamole.toggleCameraEnabled()}>{props.userInfo.camEnabled ? <TbVideo /> : <TbVideoOff />}</button>
          </div>

          <h3 class="mt-2">Microphones</h3>
          <Show when={microphones().length !== 0} fallback={'No microphones found'}>
            <For each={microphones()}>
              {(mic, i) => <>
                <div class="flex items-center">
                  <input name='mic-selector' id={`q-mic-${i()}`} type="radio" value={mic.label} checked={mic.label === activeMicrophone()?.label} class="h-4 w-4 border-gray-300 text-indigo-600 focus:outline-none" />
                  <label for={`q-mic-${i()}`} class="ml-3 block text-xs whitespace-nowrap text-ellipsis overflow-hidden leading-6 text-stone-400" style={{'text-shadow':'1px 1px 1px black'}}>{mic.label}</label>
                </div>
              </>}
            </For>
          </Show>

          <h3 class="mt-2">Cameras</h3>
          <Show when={cameras().length !== 0} fallback={'No microphones found'}>
            <For each={cameras()}>
              {(cam, i) => <>
                <div class="flex items-center">
                  <input name="cam-selector" id={`q-cam-${i()}`} type="radio" value={cam.label} checked={cam.label === activeCamera()?.label} class="h-4 w-4 border-gray-300 text-indigo-600 focus:outline-none" />
                  <label for={`q-cam-${i()}`} class="ml-3 block text-xs whitespace-nowrap text-ellipsis max-w-[350px] overflow-hidden leading-6 text-stone-400" style={{'text-shadow':'1px 1px 1px black'}}>{cam.label}</label>
                </div>
              </>}
            </For>
          </Show>

          <button onClick={() => setOpen(false)} class='q-btn-secondary mt-8 mx-auto !w-[initial]'>Close</button>

        </div>
      </div>
    </Portal>
  </>;

};
