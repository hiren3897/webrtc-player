import { IControls } from '../ui/interfaces';

export class SpinnerController {
  private timeoutId: number | null = null;
  private readonly delay = 200;

  constructor(private controls: IControls) {}

  show() {
    if (this.timeoutId !== null) return;

    this.timeoutId = window.setTimeout(() => {
      this.controls.showSpinner();
      this.timeoutId = null;
    }, this.delay);
  }

  hide() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.controls.hideSpinner();
  }
}
