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
  }

  createLiveButton() {
    this.liveButton = createButton();
    this.liveButton.classList.add('webrtc-live-button');
    this.liveButton.classList.add('webrtc-live-button-red');
    this.liveButton.textContent = 'Live';
    this.liveButton.disabled = true;
    this.parent.appendChild(this.liveButton);
  }
}
