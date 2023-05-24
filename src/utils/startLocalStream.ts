const defaultMediaConstraints: MediaStreamConstraints = {
  audio: {},
  video: {
    // frameRate: { ideal: 20, max: 25 }, // FIXME check supported constraints first to prevent errors
    width: {ideal: 128},
    height: {ideal: 72},
  },
};

export const startLocalStream = async (micEnabled: boolean, camEnabled: boolean) => {
  console.log('startLocalStream');


  const actualConstraints = {...defaultMediaConstraints};
  actualConstraints.audio = micEnabled ? actualConstraints.audio : false;
  actualConstraints.video = camEnabled ? actualConstraints.video : false;

  try {
    return await navigator.mediaDevices.getUserMedia(actualConstraints);
  } catch (error) {
    console.error('local stream couldn\'t be started', error);
  }
};
