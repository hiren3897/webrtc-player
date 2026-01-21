import { ModeSwitchEvent } from '../types';
import { getSeekableRange } from '../utils/time';
import { IControls, WebRTCVideoElement } from './interfaces';

export class Seekbar {
  private webRtcSeekRangeElement!: HTMLInputElement;
  private webRtcTimelineContainer!: HTMLDivElement;
  private isUserInteracting: boolean = false; // Prevents jumping during drag
  private currentVideo?: WebRTCVideoElement;
  private isDvrMode = false;

  constructor(
    private parent: HTMLElement,
    private controls: IControls,
  ) {
    this.parent = parent;

    this.controls = controls;

    setTimeout(() => {
      this.createTimelineContainer();
      this.attachControlListeners();
      this.setupInteractionListeners();
    });
  }

  private attachControlListeners() {
    this.controls.videoContainer.addEventListener('onmodeswitch', (e) => {
      const event = e as ModeSwitchEvent;

      this.isDvrMode = event.mode === 'dvr';

      this.bindToActiveVideo();
      this.update();
    });
  }

  private bindToActiveVideo() {
    if (this.currentVideo) {
      this.currentVideo.ontimeupdate = null;
    }
    this.currentVideo = this.controls.getVideo();

    this.currentVideo.ontimeupdate = () => this.update();
  }

  private update() {
    if (!this.controls.isDvrEnabled()) return;

    if (!this.isDvrMode) {
      this.resetLive();
      return;
    }

    const video = this.controls.getVideo();
    const range = getSeekableRange(video);
    if (range) {
      this.webRtcSeekRangeElement.min = range.start.toString();
      this.webRtcSeekRangeElement.max = range.end.toString();
    }
  }

  getValue() {
    return this.webRtcSeekRangeElement.value;
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

  private resetLive() {
    this.webRtcSeekRangeElement.min = '0';
    this.webRtcSeekRangeElement.max = '1';
    this.webRtcSeekRangeElement.value = '1';
  }
}
