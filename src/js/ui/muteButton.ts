import { IControls, WebRTCVideoElement } from './interfaces';

export class MuteButton {
  video: WebRTCVideoElement;

  webRtcMuteButton!: HTMLButtonElement;
  muteButtonIcon!: HTMLSpanElement;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo();

    this.createMuteButton();

    if (this.video.defaultMuted) {
      this.webRtcMuteButton.firstChild!.textContent = 'volume_off';
    } else {
      this.webRtcMuteButton.firstChild!.textContent = 'volume_up';
    }

    this.webRtcMuteButton.addEventListener('click', () => {
      this.controls.muteUnmuteVideo();
      this.controls.updateMuteIcon();
    });
  }

  createMuteButton() {
    this.webRtcMuteButton = document.createElement('button');
    this.webRtcMuteButton.classList.add('webrtc-mute-btn');
    this.webRtcMuteButton.setAttribute('type', 'button');

    this.muteButtonIcon = document.createElement('span');
    this.muteButtonIcon.classList.add('webrtc-player-icons');
    this.muteButtonIcon.classList.add('md-22');
    this.webRtcMuteButton.appendChild(this.muteButtonIcon);

    this.parent.appendChild(this.webRtcMuteButton);
  }
}
