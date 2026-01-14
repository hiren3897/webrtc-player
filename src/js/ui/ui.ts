import { PlayerOptions } from '../types';
import { Controls } from './controls';
import {
  IControls,
  IUi,
  WebRTCVideoContainer,
  WebRTCVideoElement,
} from './interfaces';

export default class Ui implements IUi {
  /**
   * WebRTC Container {!HTMLElement}
   */
  videoContainer: WebRTCVideoContainer;

  /**
   * {HTMLVideoElement}
   */
  video: WebRTCVideoElement;

  /**
   * WebRtc Player Controls
   */
  controls: IControls;

  config: PlayerOptions;
  constructor(
    videoContainer: WebRTCVideoContainer,
    video: WebRTCVideoElement,
    config: PlayerOptions,
  ) {
    this.videoContainer = videoContainer;
    this.video = video;
    this.config = config;
    videoContainer.ui = this;
    video.ui = this;
    this.controls = new Controls(videoContainer, video, config);
  }

  getWebRTCConfiguration() {
    return this.config;
  }

  getWebRTCControls() {
    return this.controls;
  }

  defaultConfig() {
    return {};
  }
}
