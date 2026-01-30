export interface IStreamController {
  switchToLive(): void;
  switchToDVR(time: number): void;
  setVolume(value: number): void;
  setMuted(muted: boolean): void;
  getActiveVideo(): HTMLVideoElement;
}
