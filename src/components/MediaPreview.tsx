import {Component} from 'solid-js';
import {MediaStreamCard} from './GenericMediaCard';

export const MediaPreview: Component = () => {

  return <>
  <div>
    <button onClick={handleClickOpen}>Preview Audio & Video Settings</button>

    <div>
      <MediaStreamCard stream={localStreamWrapper ? localStreamWrapper.stream : null} muted={false}/>
      <button style={{height: '100%'}} onClick={toggleCameraEnabled}>Toggle Camera</button>
      <button style={{height: '100%'}} onClick={toggleMicrophoneEnabled}>toggle Microphone</button>

    </div>
  </div>
  </div>;

</>

};
