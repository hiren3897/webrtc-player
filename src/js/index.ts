import WebRTCPlayer from './webRTCPlayer';

const videoContainer = document.querySelector('.webrtc-container');
const options = {
  webRtcUrl: 'http://127.0.0.1:8889/live/mystream',
  ui: {
    screenshot: true,
  },
  retryParameters: {
    maxAttempts: 5,
    baseDelay: 1000,
  },
};
const player = new WebRTCPlayer('videoElem', videoContainer, options);
player.load();
