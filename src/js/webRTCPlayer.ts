/*
 * Copyright (C) 2026 Hiren Rathod
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 */
import '../scss/index.scss';
import Receiver from './receiver';
import './static/adapter-latest';
import { IStreamController, LogEntry, LogEvent, PlayerOptions } from './types';
import {
  IControls,
  IUi,
  WebRTCVideoContainer,
  WebRTCVideoElement,
} from './ui/interfaces';
import Ui from './ui/ui';
import HlsReceiver from './hlsReceiver';

export default class WebRTCPlayer implements IStreamController {
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
  public hlsReceiver: HlsReceiver | null = null;

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

    this.webRtcUi = new Ui(this.videoContainer, this, this.video, this.options);
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

    // Initialize WHEP Receiver
    this.receiver = new Receiver(
      this.video,
      this.videoContainer,
      this.options.webRtcUrl,
      this.options.retryParameters || { maxAttempts: 5, baseDelay: 1000 },
    );

    // Initialize HLS Receiver if DVR is enabled
    if (this.options.dvrEnabled && this.options.hlsUrl) {
      this.hlsReceiver = new HlsReceiver(this.video, this.options.hlsUrl);
    }

    this.playerLoaded = true;
    this.createLog('Loaded', 'WebRTC player was Loaded');
  }

  /**
   * Orchestration: Switch to DVR Mode
   */
  public switchToDVR(seekTime: number): void {
    if (!this.hlsReceiver) return;

    this.receiver?.destroyReceiver(); // Kill WebRTC connection to save resources
    this.hlsReceiver.start(1); // Start HLS playback at specific time
    this.createLog('ModeChange', `Switched to DVR at ${seekTime}s`);
  }

  /**
   * Orchestration: Switch to Live Mode
   */
  public switchToLive(): void {
    this.hlsReceiver?.stop(); // Kill HLS
    this.receiver?.scheduleRestart(); // Re-establish WebRTC WHEP connection
    this.createLog('ModeChange', 'Switched to Live Flux');
  }

  // Update destroy to clean up both
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
}
