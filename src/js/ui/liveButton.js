import { createButton } from '../utils/dom';

export class LiveButton {
  /**
     *
     * @param parent {!HTMLElement}
     * @param controls {Controls}
     */
  constructor(parent, controls) {
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
