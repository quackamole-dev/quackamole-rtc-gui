/**
 * Set the src of a html5 <video> element and start playing
 * @param videoRef The reference to the video element
 * @param stream The stream that should be played by the referenced video element
 * @param muted Whether or not the audio of the stream should be muted
 */
export const setVideoSrc = (videoRef: HTMLAudioElement, stream: MediaStream | null | undefined, muted = true) => {
  if (videoRef && stream) {
    videoRef.srcObject = stream;
    videoRef.oncanplay = () => { // FIXME rarely does not get fired for all peers, so remote stream can appear white
      // if (videoRef.currentSrc) {
        videoRef.play();
        videoRef.muted = muted;
      // }
    };
  }
};
