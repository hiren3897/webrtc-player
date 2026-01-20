import { ModeSwitchEvent } from '../types';
import { IControls, WebRTCVideoElement } from './interfaces';

export class Seekbar {
  video: WebRTCVideoElement;

  private webRtcSeekRangeElement!: HTMLInputElement;
  private webRtcTimelineContainer!: HTMLDivElement;
  private isUserInteracting: boolean = false; // Prevents jumping during drag

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo(); // returns avtive video
    setTimeout(() => {
      this.createTimelineContainer();
      this.setupInteractionListeners();
    });

    this.controls.videoContainer.addEventListener('onmodeswitch', (e) => {
      const event = e as ModeSwitchEvent;
      const video = this.controls.getVideo();

      if (event.mode === 'live') {
        // Reset to default Live state
        this.webRtcSeekRangeElement.min = '0';
        this.webRtcSeekRangeElement.max = '1';
        this.webRtcSeekRangeElement.value = '1';
        video.ontimeupdate = null;
      } else {
        // DVR MODE: Handle growing duration
        video.ontimeupdate = () => {
          if (this.isUserInteracting) return;

          // Update max dynamically because HLS Live duration grows every few seconds
          if (isFinite(video.duration) && video.duration > 0) {
            this.webRtcSeekRangeElement.max = video.duration.toString();
            this.webRtcSeekRangeElement.value = video.currentTime.toString();
          }
        };
      }
    });
  }

  private setupInteractionListeners() {
    // When user starts dragging
    const startSeeking = () => {
      this.isUserInteracting = true;
    };
    this.webRtcSeekRangeElement.addEventListener('mousedown', startSeeking);
    this.webRtcSeekRangeElement.addEventListener('touchstart', startSeeking);

    // When user finishes dragging/clicking
    const endSeeking = (e: Event) => {
      this.isUserInteracting = false;
      this.onSeekEventHandler(e);
    };
    this.webRtcSeekRangeElement.addEventListener('change', endSeeking);
    this.webRtcSeekRangeElement.addEventListener('touchend', endSeeking);
  }

  createTimelineContainer() {
    this.webRtcTimelineContainer = document.createElement('div');
    this.webRtcTimelineContainer.classList.add('webrtc-range-container');
    this.webRtcTimelineContainer.classList.add('webrtc-seek-bar-container');
    this.parent.appendChild(this.webRtcTimelineContainer);
    this.createSeekRangeElement();
  }

  createSeekRangeElement() {
    this.webRtcSeekRangeElement = document.createElement('input');
    this.webRtcSeekRangeElement.classList.add('webrtc-range-element');
    this.webRtcSeekRangeElement.classList.add('webrtc-seek-range');
    this.webRtcSeekRangeElement.type = 'range';
    this.webRtcSeekRangeElement.step = 'any';
    this.webRtcSeekRangeElement.min = '0';
    this.webRtcSeekRangeElement.max = '1';
    this.webRtcSeekRangeElement.value = '1';
    this.webRtcSeekRangeElement.ariaLabel = 'seek';
    this.webRtcTimelineContainer.appendChild(this.webRtcSeekRangeElement);
  }

  onSeekEventHandler(e: Event | TouchEvent) {
    if (!this.controls.isDvrEnabled()) return;

    const val = parseFloat(this.getSeekPosition(e));
    const max = parseFloat(this.webRtcSeekRangeElement.max);
    const position = val / max;

    const video = this.controls.getVideo();
    const isCurrentlyLive = !isFinite(video.duration);

    if (isCurrentlyLive) {
      if (position < 0.98) {
        this.controls.switchToDVR(position);
      }
    } else {
      // Already in DVR (HLS)
      if (position >= 0.98) {
        this.controls.switchToLive();
      } else {
        // Smooth internal seek
        if (isFinite(val)) {
          video.currentTime = val;
        }
      }
    }
  }

  getSeekPosition(e: Event | TouchEvent) {
    if (e instanceof TouchEvent) {
      return (e.changedTouches[0].target as HTMLInputElement).value;
    } else {
      return (e.target as HTMLInputElement).value;
    }
  }
}
