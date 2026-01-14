import { appendChildElement, createButton } from '../utils/dom';
import { IControls, WebRTCVideoElement } from './interfaces';

export class PlayButton {
  video: WebRTCVideoElement;

  webRtcPlayButton!: HTMLElement;
  playButtonIcon!: HTMLSpanElement;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo();

    this.createPlayButton();

    if (this.controls.presentationIsPaused()) {
      this.playButtonIcon.textContent = 'play_arrow';
    } else {
      this.playButtonIcon.textContent = 'pause';
    }

    this.video.addEventListener('playing', () => {
      this.controls.updatePlayPauseIcon();
    });

    this.webRtcPlayButton.addEventListener('click', () => {
      this.controls.playPausePresentation();
      this.controls.updatePlayPauseIcon();
    });
  }

  createPlayButton() {
    this.webRtcPlayButton = createButton();
    this.webRtcPlayButton.classList.add('webrtc-play-btn');
    this.webRtcPlayButton.setAttribute('type', 'button');

    this.playButtonIcon = document.createElement('span');
    this.playButtonIcon.classList.add('webrtc-player-icons');
    this.playButtonIcon.classList.add('md-22');

    appendChildElement(this.webRtcPlayButton, this.playButtonIcon);

    this.parent.appendChild(this.webRtcPlayButton);
  }
}
