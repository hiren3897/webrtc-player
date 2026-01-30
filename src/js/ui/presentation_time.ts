import { IControls, WebRTCVideoElement } from './interfaces';
import { buildTimeString, getSeekableRange } from '../utils/time';
import { ModeSwitchEvent } from '../types/event';

export class PresentationTime {
  private container!: HTMLDivElement;
  private timeElement!: HTMLButtonElement;

  private isDvrMode = false;
  private currentVideo?: WebRTCVideoElement;

  constructor(
    private parent: HTMLElement,
    private controls: IControls,
  ) {
    setTimeout(() => {
      this.createUI();
      this.bindToActiveVideo();
      this.attachControlListeners();
    });
  }

  private createUI() {
    this.container = document.createElement('div');
    this.container.classList.add('webrtc-presentation-time');

    this.timeElement = document.createElement('button');
    this.timeElement.classList.add('webrtc-current-time');
    this.timeElement.type = 'button';
    this.timeElement.textContent = 'LIVE';

    this.container.appendChild(this.timeElement);
    this.parent.appendChild(this.container);

    this.timeElement.addEventListener('click', () => {
      if (this.isDvrMode) {
        this.controls.switchToLive();
      }
    });
  }

  private attachControlListeners() {
    this.controls.videoContainer.addEventListener('onmodeswitch', (e) => {
      const event = e as ModeSwitchEvent;

      this.isDvrMode = event.mode === 'dvr';

      this.bindToActiveVideo();
      this.update();
    });
  }

  private bindToActiveVideo() {
    if (this.currentVideo) {
      this.currentVideo.ontimeupdate = null;
    }
    this.currentVideo = this.controls.getVideo();

    this.currentVideo.addEventListener(
      'timeupdate',
      () => {
        this.update();
      },
      true,
    );
  }

  private update() {
    let displayTime = Number(this.controls.getDisplayTime());

    if (!this.isDvrMode) {
      this.setValue('0:00');
      return;
    }

    const range = this.controls.getSeekRange();
    const duration = range.end - range.start;

    const behindLive = Math.floor(range.end - displayTime);
    displayTime = Math.max(0, behindLive);

    // How far back are we from the actual LIVE edge of the buffer?
    const showHour = duration >= 3600;
    const value = `- ${buildTimeString(behindLive, showHour)}`;

    if (displayTime >= 1) {
      this.setValue('- ' + buildTimeString(displayTime, showHour));
      this.timeElement.disabled = false;
    }
    this.setValue(value);
  }

  private setValue(value: string) {
    if (this.timeElement.textContent !== value) {
      this.timeElement.textContent = value;
    }
  }
}
