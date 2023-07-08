import {Component} from 'solid-js';
import {GenericMediaStream} from './GenericMediaStream';

export const MediaPreview: Component = () => {

  return <>
  <div>
    <button onClick={handleClickOpen}>Preview Audio & Video Settings</button>

    <div>
      <GenericMediaStream stream={localStreamWrapper ? localStreamWrapper.stream : null} muted={false}/>
      <button style={{height: '100%'}} onClick={toggleCameraEnabled}>Toggle Camera</button>
      <button style={{height: '100%'}} onClick={toggleMicrophoneEnabled}>toggle Microphone</button>

    </div>
  </div>
  </div>;

</>

};
