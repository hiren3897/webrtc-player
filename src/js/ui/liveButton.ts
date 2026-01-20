import { ModeSwitchEvent } from '../types';
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

    this.controls.videoContainer.addEventListener('onmodeswitch', (e) => {
      const event = e as ModeSwitchEvent;
      this.updateState(event.mode);
    });
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

  updateState(mode: 'dvr' | 'live') {
    // Logic: If current stream is WebRTC (no finite duration), highlight red
    this.liveButton!.classList.toggle(
      'webrtc-live-button-red',
      mode === 'live',
    );
  }
}
