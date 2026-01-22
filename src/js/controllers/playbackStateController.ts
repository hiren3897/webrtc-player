import { PlaybackState } from '../types';
import { SpinnerController } from './spinnerController';

export class PlaybackStateController {
  private state: PlaybackState = PlaybackState.IDLE;

  constructor(private spinner: SpinnerController) {}

  setState(next: PlaybackState) {
    if (this.state === next) return;
    this.state = next;

    switch (next) {
      case PlaybackState.LOADING:
      case PlaybackState.BUFFERING:
        this.spinner.show();
        break;

      case PlaybackState.PLAYING:
        this.spinner.hide();
        break;

      case PlaybackState.ERROR:
        this.spinner.hide();
        break;
    }
  }

  getState() {
    return this.state;
  }
}
