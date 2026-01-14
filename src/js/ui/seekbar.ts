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
    // console.log('Seek not available');
  }

  getSeekPosition(e: PointerEvent | TouchEvent) {
    if (e instanceof TouchEvent) {
      return (e.changedTouches[0].target as HTMLInputElement).value;
    } else {
      return (e.target as HTMLInputElement).value;
    }
  }
}
