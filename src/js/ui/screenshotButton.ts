import { IControls } from './interfaces';

export class ScreenshotButton {
  private webRtcScreenshotButton!: HTMLButtonElement;
  private screenshotButtonIcon!: HTMLSpanElement;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;
    this.createScreenshotButton();

    this.webRtcScreenshotButton.addEventListener('click', () => {
      this.controls.screenshot();
    });
  }

  createScreenshotButton() {
    this.webRtcScreenshotButton = document.createElement('button');
    this.webRtcScreenshotButton.classList.add('webrtc-screenshot-btn');
    this.webRtcScreenshotButton.setAttribute('type', 'button');

    this.screenshotButtonIcon = document.createElement('span');
    this.screenshotButtonIcon.classList.add('webrtc-player-icons');
    this.screenshotButtonIcon.classList.add('md-22');
    this.screenshotButtonIcon.textContent = 'photo_camera';
    this.webRtcScreenshotButton.appendChild(this.screenshotButtonIcon);

    this.parent.appendChild(this.webRtcScreenshotButton);
  }
}
