import { Container } from './container';
import type { Container as IContainer } from './container';
import { PlayButton } from './playButton';
import { MuteButton } from './muteButton';
import { FullscreenButton } from './fullscreenButton';
import { Seekbar } from './seekbar';
import { VolumeBar } from './volumeBar';
import { Platform } from '../utils/platform';
import { LiveButton } from './liveButton';
import { ScreenshotButton } from './screenshotButton';
import {
  IControls,
  WebRTCVideoContainer,
  WebRTCVideoElement,
} from './interfaces';
import { IStreamController, PlayerOptions } from '../types';
import { PresentationTime } from './presentation_time';

export class Controls implements IControls {
  video: WebRTCVideoElement;
  videoContainer: WebRTCVideoContainer;
  config: PlayerOptions;
  container: IContainer;
  controller: IStreamController;

  private seekBar: Seekbar | null;
  private controlsButtonPanel: HTMLElement;
  private bottomControlsContainer: HTMLElement;

  private playButton_!: PlayButton;
  private liveButton_!: LiveButton;
  private screenshotButton_!: ScreenshotButton;
  private muteButton_!: MuteButton;
  private volumeBar_!: VolumeBar;
  private fullscreenButton_!: FullscreenButton;

  /**
   * Controls container
   */
  constructor(
    videoContainer: WebRTCVideoContainer,
    video: WebRTCVideoElement,
    config: PlayerOptions,
    controller: IStreamController,
  ) {
    this.config = config;
    this.video = controller.getActiveVideo();
    this.videoContainer = videoContainer;
    this.controller = controller;

    this.seekBar = null;

    this.container = new Container(videoContainer, controller);

    this.controlsButtonPanel = this.container.getControlsButtonPanel();
    this.bottomControlsContainer = this.container.getBottomControlsContainer();

    this.createControls();

    if (Platform.isMobile()) {
      this.getVideo().addEventListener('play', () => {
        this.getVideo().play();
      });
    }
  }

  /**
   *
   */
  createControls() {
    // Configure with config?
    // add play button
    this.playButton_ = new PlayButton(this.controlsButtonPanel, this);
    const _ = new PresentationTime(this.controlsButtonPanel, this);

    // live button
    this.liveButton_ = new LiveButton(this.controlsButtonPanel, this);

    // Spacer Element
    this.addSpacerElement();

    if (this.config.ui?.screenshot) {
      // screenshot button
      this.screenshotButton_ = new ScreenshotButton(
        this.controlsButtonPanel,
        this,
      );
    }

    // mute/unmute button
    this.muteButton_ = new MuteButton(this.controlsButtonPanel, this);

    // volume bar
    this.volumeBar_ = new VolumeBar(this.controlsButtonPanel, this);

    // fullscreen button
    this.fullscreenButton_ = new FullscreenButton(
      this.controlsButtonPanel,
      this,
    );

    //  seekbar
    this.seekBar = new Seekbar(this.bottomControlsContainer, this);
  }

  getDisplayTime() {
    return this.seekBar ? this.seekBar.getValue() : this.getVideo().currentTime;
  }

  addSpacerElement() {
    const webRtcSpacerElement = document.createElement('div');
    webRtcSpacerElement.classList.add('webrtc-spacer');
    this.controlsButtonPanel.appendChild(webRtcSpacerElement);
  }

  getVideo() {
    return this.controller.getActiveVideo();
  }

  getSeekBar() {
    return this.seekBar;
  }

  updatePlayPauseIcon() {
    if (this.presentationIsPaused()) {
      this.playButton_.playButtonIcon.textContent = 'play_arrow';
      return;
    }
    this.playButton_.playButtonIcon.textContent = 'pause';
  }

  updateMuteIcon() {
    if (this.getVideo().muted) {
      this.muteButton_.muteButtonIcon.textContent = 'volume_off';
      return;
    }
    this.muteButton_.muteButtonIcon.textContent = 'volume_up';
  }

  presentationIsPaused(): boolean {
    // The video element is in a paused state while seeking, but we don't count
    // that.
    return this.getVideo().paused;
  }

  /**
   * Play or pause the current presentation.
   */
  playPausePresentation() {
    const video = this.controller.getActiveVideo();

    if (!video.duration) {
      // Can't play yet.  Ignore.
      return;
    }

    if (this.presentationIsPaused()) {
      video.play();
    } else {
      video.pause();
    }
  }

  muteUnmuteVideo() {
    const video = this.controller.getActiveVideo();
    this.controller.setMuted(!video.muted);
  }

  setSeek(min: string, max: string) {
    this.seekBar?.setSeekRange(min, max);
  }

  setPresentationCurrentTime(currentTime: string) {
    this.seekBar?.setValue(currentTime);
  }

  screenshot() {
    const canvas = document.createElement('canvas');
    // Calculate the ratio of the video's width to height
    const ratio = this.getVideo().clientWidth / this.getVideo().clientHeight;
    // Define the required width as 100 pixels smaller than the actual video's width
    const w = this.getVideo().clientWidth - 100;
    // Calculate the height based on the video's width and the ratio
    const h = parseInt(String(w / ratio), 10);
    // Set the canvas width and height to the values just calculated
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(this.getVideo(), 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL();
    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = dataURL;
    link.click();
    link.remove();
    canvas.remove();
    return dataURL;
  }

  isFullScreenEnabled(): boolean {
    if (document.fullscreenEnabled) {
      return !!document.fullscreenElement;
    }
    return false;
  }

  async toggleFullscreen() {
    if (document.fullscreenEnabled) {
      if (document.fullscreenElement) {
        if (screen.orientation) {
          screen.orientation.unlock();
        }
        await document.exitFullscreen();
      } else {
        // If we are in PiP mode, leave PiP mode first.
        try {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
          }
          await this.videoContainer.requestFullscreen({ navigationUI: 'hide' });
        } catch (error) {
          // console.error(error);
        }
      }
    } else {
      await document.exitFullscreen();
    }
  }

  public switchToLive(): void {
    this.controller.switchToLive();
  }

  public switchToDVR(time: number): void {
    this.controller.switchToDVR(time);
  }

  public isDvrEnabled(): boolean {
    return !!this.config.dvrEnabled;
  }
}
