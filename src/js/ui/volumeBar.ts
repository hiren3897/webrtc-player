import { createHTMLElement } from '../utils/dom';
import { IControls, WebRTCVideoElement } from './interfaces';

export class VolumeBar {
  video: WebRTCVideoElement;
  private webRtcVolumeBar!: HTMLInputElement;

  constructor(private parent: HTMLElement, private controls: IControls) {
    this.parent = parent;

    this.controls = controls;

    this.video = controls.getVideo();

    this.createVolumeBar();

    this.video.addEventListener('volumechange', () => {
      this.onPresentationChangeVolume();
    });

    this.webRtcVolumeBar.addEventListener('input', (e) => {
      this.onChange();
    });

    this.onPresentationChangeVolume();
  }

  createVolumeBar() {
    this.webRtcVolumeBar = createHTMLElement('input') as HTMLInputElement;
    this.webRtcVolumeBar.classList.add('webrtc-volume-bar');
    this.webRtcVolumeBar.type = 'range';
    this.webRtcVolumeBar.step = 'any';
    this.webRtcVolumeBar.min = '0';
    this.webRtcVolumeBar.max = '1';
    this.webRtcVolumeBar.value = '0';
    this.webRtcVolumeBar.ariaLabel = 'WebRTC Volume';

    this.parent.appendChild(this.webRtcVolumeBar);
  }

  onPresentationChangeVolume() {
    if (this.video.muted) {
      this.setVolumeBarValue('0');
    } else {
      this.setVolumeBarValue(this.video.volume.toString());
    }
    // update colors
    this.updateColors();
  }

  setVolumeBarValue(value: string) {
    this.webRtcVolumeBar.value = value;
  }

  getVolumeBarValue() {
    return parseFloat(this.webRtcVolumeBar.value);
  }

  updateColors() {
    const volumeBarColors = {
      base: 'rgba(255, 255, 255, 0.54)',
      level: 'rgb(255, 255, 255)',
    };

    const gradient = ['to right'];
    gradient.push(volumeBarColors.level + this.getVolumeBarValue() * 100 + '%');
    gradient.push(volumeBarColors.base + this.getVolumeBarValue() * 100 + '%');
    gradient.push(volumeBarColors.base + '100%');

    this.webRtcVolumeBar.style.background =
      'linear-gradient(' + gradient.join(',') + ')';
  }

  onChange() {
    this.video.volume = this.getVolumeBarValue();

    this.video.muted = this.video.volume === 0;
  }
}
