import { createHTMLElement } from '../utils/dom';
import { IControls } from './interfaces';

export class VolumeBar {
  private webRtcVolumeBar!: HTMLInputElement;

  constructor(
    private parent: HTMLElement,
    private controls: IControls,
  ) {
    this.parent = parent;

    this.controls = controls;

    this.createVolumeBar();

    this.controls.getVideo().addEventListener('volumechange', () => {
      this.onPresentationChangeVolume();
    });

    this.webRtcVolumeBar.addEventListener('input', (e) => {
      this.onChange();
    });

    this.controls.videoContainer.addEventListener('onmodeswitch', () => {
      this.onPresentationChangeVolume();
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
    if (this.controls.getVideo().muted) {
      this.setVolumeBarValue('0');
    } else {
      this.setVolumeBarValue(this.controls.getVideo().volume.toString());
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
    this.controls.getVideo().volume = this.getVolumeBarValue();

    this.controls.getVideo().muted = this.controls.getVideo().volume === 0;
    this.controls.updateMuteIcon();
  }
}
