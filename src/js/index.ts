import { PlayerOptions } from './types';
import WebRTCPlayer from './webRTCPlayer';

const videoContainer = document.querySelector('.webrtc-container');
const options: PlayerOptions = {
  webRtcUrl: 'http://127.0.0.1:8889/live/mystream',
  dvrEnabled: true,
  hlsUrl: 'http://127.0.0.1:8888/live/mystream/index.m3u8',
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
