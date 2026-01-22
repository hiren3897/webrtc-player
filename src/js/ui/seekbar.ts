import { ModeSwitchEvent } from '../types';
import { IControls } from './interfaces';

export class Seekbar {
  private webRtcSeekRangeElement!: HTMLInputElement;
  private webRtcTimelineContainer!: HTMLDivElement;

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

      if (event.mode === 'live') {
        this.resetLive();
      }
    });
  }

  getValue() {
    return this.webRtcSeekRangeElement.value;
  }

  setValue(value: string) {
    this.webRtcSeekRangeElement.value = value;
  }

  setSeekRange(min: string, max: string) {
    this.webRtcSeekRangeElement.min = min;
    this.webRtcSeekRangeElement.max = max;
  }

  private setupInteractionListeners() {
    const startSeeking = () => {};
    this.webRtcSeekRangeElement.addEventListener('mousedown', startSeeking);
    this.webRtcSeekRangeElement.addEventListener('touchstart', startSeeking);

    const endSeeking = (e: Event) => {
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
    this.controls.setSeek(0, 1);
    this.webRtcSeekRangeElement.value = '1';
  }
}
