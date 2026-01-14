import '../scss/index.scss';
import Receiver from './receiver';
import './static/adapter-latest';
import { LogEntry, LogEvent, PlayerOptions } from './types';
import {
  IControls,
  IUi,
  WebRTCVideoContainer,
  WebRTCVideoElement,
} from './ui/interfaces';
import Ui from './ui/ui';

export default class WebRTCPlayer {
  static ON_LOAD_ASSET = 'loadasset';
  static ON_ASSET_LOADED = 'loadassetsuccess';
  static ON_ADD_LOG = 'addlog';
  static ON_WEBRTC_PLAYER_ERROR = 'webrtcerror';

  public video: WebRTCVideoElement;
  public playerLoaded: boolean = false;
  public logs: LogEntry[] = [];
  public options: PlayerOptions = {
    webRtcUrl: '',
    onStatusChange: null,
    onDemand: null,
    ui: { screenshot: false },
  };

  public webRtcPlayerVersion: string | undefined;
  public webRtcUi: IUi; // Replace 'any' with your Ui class type
  public webRtcControls: IControls;
  public receiver: Receiver | null = null;
  private videoContainer: WebRTCVideoContainer;

  constructor(
    id: string,
    videoContainer: Element | HTMLElement | null,
    options: Partial<PlayerOptions> = {},
  ) {
    const videoElement = document.getElementById(id);
    if (!(videoElement instanceof HTMLVideoElement)) {
      throw new Error(`Element with id ${id} is not a HTMLVideoElement`);
    }

    if (videoContainer === null) {
      throw new Error('videoContainer is not a configured');
    }

    this.video = videoElement as WebRTCVideoElement;
    this.videoContainer = videoContainer as WebRTCVideoContainer;
    this.options = { ...this.options, ...options };

    this.webRtcUi = new Ui(this.videoContainer, this.video, this.options);
    this.webRtcControls = this.webRtcUi.getWebRTCControls();

    // Listen for the custom log event
    this.videoContainer.addEventListener(
      WebRTCPlayer.ON_ADD_LOG,
      (event: Event) => {
        const e = event as LogEvent;
        this.createLog(e.logName, e.logMessage);
      },
    );

    this.webRtcPlayerVersion = process.env.WebRTCVersion;
    this.oniOSExitFullScreenMode();
  }

  public load(): void {
    if (!this.options.webRtcUrl) return;

    this.receiver = new Receiver(
      this.video,
      this.videoContainer,
      this.options.webRtcUrl,
      this.options.retryParameters || { maxAttempts: 5, baseDelay: 1000 },
    );
    this.playerLoaded = true;
    this.createLog('Loaded', 'WebRTC player was Loaded');
  }

  public destroy(): void {
    this.receiver?.destroyReceiver();
    this.receiver = null;
    this.playerLoaded = false;
    this.createLog('Destroy', 'Player was destroyed');
  }

  public createLog(name: string, message: string): void {
    this.logs.push({ name, message });
  }

  public getPlayerLogs(): LogEntry[] {
    return this.logs.length === 0 ? [] : [...this.logs].reverse();
  }

  private oniOSExitFullScreenMode(): void {
    this.video.addEventListener(
      'webkitendfullscreen',
      () => {
        setTimeout(() => {
          if (this.video.paused) {
            this.video.play().catch(() => {});
          }
        }, 460);
      },
      false,
    );
  }
}
