import { IControls, WebRTCVideoElement } from './interfaces';

export class Seekbar {
  video: WebRTCVideoElement;

  private webRtcSeekRangeElement!: HTMLInputElement;
  private webRtcTimelineContainer!: HTMLDivElement;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo();
    setTimeout(() => {
      this.createTimelineContainer();

      this.video.addEventListener('timeupdate', () => {
        if (this.video.duration > 0 && this.video.hasAttribute('src')) {
          const pos = this.video.currentTime / this.video.duration;
          this.webRtcSeekRangeElement.value = pos.toString();
        } else {
          this.webRtcSeekRangeElement.value = '1';
        }
      });

      this.webRtcSeekRangeElement.addEventListener('click', (e) => {
        this.onSeekEventHandler(e);
      });

      this.webRtcSeekRangeElement.addEventListener('touchend', (e) => {
        this.onSeekEventHandler(e);
      });
    });
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

  onSeekEventHandler(e: PointerEvent | TouchEvent) {
    if (!this.controls.isDvrEnabled()) {
      console.warn('DVR is not enabled for this stream');
      return;
    }
    const position = parseFloat(this.getSeekPosition(e));
    console.log({ position });
    if (position >= 0.98) {
      this.controls.switchToLive();
    } else {
      /*
       * In 2026, MediaMTX HLS manifests contain the total window.
       * We use hls.js 'liveSyncPosition' or 'duration' ONLY once HLS is loaded.
       * For the initial switch, we pass the PERCENTAGE to the receiver
       * and let the receiver find the time once the manifest is parsed.
       */
      this.controls.switchToDVR(position); // Pass percentage, not calculated time
    }
  }

  getSeekPosition(e: PointerEvent | TouchEvent) {
    if (e instanceof TouchEvent) {
      return (e.changedTouches[0].target as HTMLInputElement).value;
    } else {
      return (e.target as HTMLInputElement).value;
    }
  }
}
