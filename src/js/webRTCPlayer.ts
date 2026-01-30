/*
 * Copyright (C) 2026 Hiren Rathod
 */
import '../scss/index.scss';
import Receiver from './receiver';
import WHEPAdapter from './adapters/whepAdapter'; // Import your adapter
import './static/adapter-latest';

import {
  IControls,
  IUi,
  WebRTCVideoContainer,
  WebRTCVideoElement,
} from './ui/interfaces';
import Ui from './ui/ui';
import HlsReceiver from './hlsReceiver';
import { createHlsVideoElement } from './utils/dom';
import { PlaybackStateController } from './controllers/playbackStateController';
import { SpinnerController } from './controllers/spinnerController';
import { IStreamController } from './types/controller';
import { LogEvent, ModeSwitchEvent } from './types/event';
import { LogEntry } from './types/log';
import { PlayerOptions } from './types/player';

export default class WebRTCPlayer implements IStreamController {
  static ON_LOAD_ASSET = 'loadasset';
  static ON_ASSET_LOADED = 'loadassetsuccess';
  static ON_ADD_LOG = 'addlog';
  static ON_WEBRTC_PLAYER_ERROR = 'webrtcerror';
  static ON_MODE_SWITCH = 'onmodeswitch';

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
  public webRtcUi: IUi;
  public webRtcControls: IControls;
  public receiver: Receiver | null = null;
  public hlsReceiver: HlsReceiver | null = null;

  private videoContainer: WebRTCVideoContainer;
  private hlsVideo!: HTMLVideoElement | null;
  private activeMode: 'live' | 'dvr' = 'live';
  private spinnerController: SpinnerController;
  private playbackController: PlaybackStateController;

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

    this.webRtcUi = new Ui(this.videoContainer, this, this.video, this.options);
    this.webRtcControls = this.webRtcUi.getWebRTCControls();

    this.spinnerController = new SpinnerController(this.webRtcControls);
    this.playbackController = new PlaybackStateController(
      this.spinnerController,
    );

    if (this.webRtcControls.isDvrEnabled()) {
      this.hlsVideo = createHlsVideoElement(this.video);
    }

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

  public setVolume(value: number): void {
    this.video.volume = value;
    if (this.hlsVideo) this.hlsVideo.volume = value;
  }

  public setMuted(muted: boolean): void {
    this.video.muted = muted;
    if (this.hlsVideo) this.hlsVideo.muted = muted;
  }

  getActiveVideo(): HTMLVideoElement {
    return this.activeMode === 'live'
      ? this.video
      : this.webRtcControls.isDvrEnabled()
        ? this.hlsVideo!
        : this.video;
  }

  public load(): void {
    if (!this.options.webRtcUrl) return;

    // TODO: In the future, you can switch this based on URL (e.g. if url contains 'ws://' use SocketAdapter)
    const adapter = new WHEPAdapter();
    adapter.initialize(this.options.webRtcUrl);

    // 2. Initialize Receiver with the Adapter
    this.receiver = new Receiver(
      this.video,
      this.videoContainer,
      adapter,
      this.options.retryParameters || { maxAttempts: 5, baseDelay: 1000 },
      this.playbackController,
    );

    if (this.options.dvrEnabled && this.options.hlsUrl && this.hlsVideo) {
      this.hlsReceiver = new HlsReceiver(
        this.hlsVideo,
        this.options.hlsUrl,
        this.playbackController,
        this.webRtcControls,
      );
    }

    this.playerLoaded = true;
    this.createLog('Loaded', 'WebRTC player was Loaded');
  }

  // ... [Keep switchToDVR, switchToLive, destroy, logs, listeners exactly as they were] ...

  public switchToDVR(seekTime: number): void {
    if (!this.hlsReceiver) return;

    this.hlsReceiver.start(seekTime);

    const onPlaying = () => {
      this.videoContainer.classList.remove('is-live');
      this.videoContainer.classList.add('is-dvr');
      this.receiver?.destroyReceiver();
      console.log('ModeChange', `Switched to DVR at ${seekTime}s`);
      this.dispatchSwitchMode('dvr');

      this.hlsVideo!.removeEventListener('playing', onPlaying);
    };
    this.hlsVideo!.addEventListener('playing', onPlaying);
    this.createLog('ModeChange', `Switched to DVR at ${seekTime}s`);
  }

  public switchToLive(): void {
    // When switching back to live, Receiver.start() handles the new negotiation via adapter
    this.receiver?.start();

    const onLivePlaying = () => {
      this.videoContainer.classList.remove('is-dvr');
      this.videoContainer.classList.add('is-live');
      this.hlsReceiver?.stop();
      console.log('ModeChange', 'Switched to Live Flux');
      this.dispatchSwitchMode('live');

      this.video.removeEventListener('playing', onLivePlaying);
    };
    this.video.addEventListener('playing', onLivePlaying);
    this.createLog('ModeChange', 'Switched to Live Flux');
  }

  public destroy(): void {
    this.receiver?.destroyReceiver();
    this.hlsReceiver?.stop();
    this.receiver = null;
    this.hlsReceiver = null;
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

  private dispatchSwitchMode(mode: 'dvr' | 'live') {
    const event = new Event(WebRTCPlayer.ON_MODE_SWITCH) as ModeSwitchEvent;
    event.mode = mode;
    this.activeMode = mode;
    this.videoContainer.dispatchEvent(event);
  }
}
