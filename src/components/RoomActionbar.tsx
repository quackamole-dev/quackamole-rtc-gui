
import { TbMicrophone, TbMicrophoneOff, TbVideoOff, TbVideo } from 'solid-icons/tb'
import { Component } from 'solid-js';
import { RoomSidebar } from './RoomSidebar';
import { QuackamoleRTCClient } from '../quackamole-rtc/quackamole';

export const RoomActionbar: Component<{quackamole: QuackamoleRTCClient}> = ({quackamole}) => {

  const setAudioIcon = () => {
    // if (localStreamWrapper) {
    //   const audioTrack = localStreamWrapper.stream.getAudioTracks()[0];
    //   if (audioTrack && audioTrack.enabled) return <TbMicrophone />;
    // }
    return <TbMicrophoneOff />
  };

  const setVideoIcon = () => {
    // if (localStreamWrapper) {
    //   const videoTrack = localStreamWrapper.stream.getVideoTracks()[0];
    //   if (videoTrack && videoTrack.enabled) return <TbVideo />;
    // }
    return <TbVideoOff />;
  };

  return (
    <div class="flex justify-center grid-item actionbar">
      <RoomSidebar quackamole={quackamole} />
      <button onclick={() => quackamole.toggleMicrophoneEnabled()}>{setAudioIcon()}</button>
      <button onclick={() => quackamole.toggleCameraEnabled()}>{setVideoIcon()}</button>
      {/* <RoomSidebarChat /> */}
    </div>
  );
};
