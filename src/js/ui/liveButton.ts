import { createButton } from '../utils/dom';
import { IControls, WebRTCVideoElement } from './interfaces';

export class LiveButton {
  video: WebRTCVideoElement;

  liveButton!: HTMLButtonElement | null;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo();

    this.liveButton = null;

    this.createLiveButton();

    this.controls.getVideo().addEventListener('play', () => this.updateState());
  }

  createLiveButton() {
    this.liveButton = createButton();
    this.liveButton.classList.add('webrtc-live-button');
    this.liveButton.classList.add('webrtc-live-button-red');
    this.liveButton.textContent = 'Live';
    this.liveButton.addEventListener('click', () => {
      this.controls.switchToLive();
    });
    this.parent.appendChild(this.liveButton);
  }

  updateState() {
    // Logic: If current stream is WebRTC (no finite duration), highlight red
    const isLive = !isFinite(this.controls.getVideo().duration);
    this.liveButton!.classList.toggle('is-active', isLive);
  }
}
