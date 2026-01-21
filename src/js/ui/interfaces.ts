import { PlayerOptions } from '../types';
import type { Container } from './container';

export interface IUi {
  videoContainer: WebRTCVideoContainer;
  video: HTMLVideoElement;
  controls: IControls;
  config: PlayerOptions;
  getWebRTCConfiguration(): PlayerOptions;
  getWebRTCControls(): IControls;
}

// Define what the Controls class looks like
export interface IControls {
  video: WebRTCVideoElement;
  videoContainer: WebRTCVideoContainer;
  config: PlayerOptions;
  container: Container;
  playPausePresentation(): void;
  presentationIsPaused(): boolean;
  updatePlayPauseIcon(): void;
  getVideo(): WebRTCVideoElement;
  toggleFullscreen(): Promise<void>;
  isFullScreenEnabled(): boolean;
  muteUnmuteVideo(): void;
  updateMuteIcon(): void;
  screenshot: () => void;
  switchToLive(): void;
  switchToDVR(time: number): void;
  isDvrEnabled(): boolean;
  getDisplayTime(): string | number;
  setSeek(min: string, max: string): void;
  setPresentationCurrentTime(currentTime: string): void;
}

// Define the augmented DOM elements
export interface WebRTCVideoContainer extends HTMLElement {
  ui?: IUi;
}

export interface WebRTCVideoElement extends HTMLVideoElement {
  ui?: IUi;
}
