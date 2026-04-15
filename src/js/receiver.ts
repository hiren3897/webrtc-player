/*
 * Copyright (C) 2026 Hiren Rathod
 */

import { PlaybackStateController } from './controllers/playbackStateController';
import { ErrorEvent, LogEvent } from './types/event';
import { ISignalingAdapter } from './types/iSignalingAdapter';
import { RetryParameters, PlaybackState } from './types/player';
import { convertMsToSeconds } from './utils/shared';
import { Timer } from './utils/timer';
import WebRTCPlayer from './webRTCPlayer';
import DiagnosticOverlay, { PlayerStats } from './ui/diagnosticOverlay';

export default class Receiver {
  private video: HTMLVideoElement;
  private videoContainer: HTMLElement;
  private pc: RTCPeerConnection | null = null;

  // Retry Logic
  private retryCounts_: number = 0;
  private retryParameters: RetryParameters;
  private isRestartFromClick_: boolean = false;
  private scheduler: Timer;
  private terminated: boolean = false;

  // stats
  private diagnostic: DiagnosticOverlay;
  private statsInterval: number | null = null;

  // Adapter
  private signalingAdapter: ISignalingAdapter;

  constructor(
    video: HTMLVideoElement,
    videoContainer: HTMLElement,
    signalingAdapter: ISignalingAdapter, // Injected dependency
    retryParameters: RetryParameters,
    private playback: PlaybackStateController,
  ) {
    this.video = video;
    this.videoContainer = videoContainer;
    this.signalingAdapter = signalingAdapter;
    this.retryParameters = retryParameters;

    this.diagnostic = new DiagnosticOverlay(this.videoContainer);

    this.scheduler = new Timer(() => {
      this.isRestartFromClick_ = false;
      this.scheduleRestart();
      this.onWebRtcError(
        'WebRTC Error',
        404,
        `Retrying to connect..., attempt: ${this.retryCounts_}`,
      );
    });

    this.start();
  }

  private async startStatsMonitor(): Promise<void> {
    let lastBytes = 0;
    let lastTimestamp = 0;

    this.statsInterval = window.setInterval(async () => {
      if (!this.pc) return;

      const stats = await this.pc.getStats();
      const currentStats: PlayerStats = {} as PlayerStats;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          // Calculate Bitrate
          const bytes = report.bytesReceived;
          const now = report.timestamp;
          const bitrate = (
            (8 * (bytes - lastBytes)) /
            (now - lastTimestamp)
          ).toFixed(0);

          currentStats.resolution = `${report.frameWidth}x${report.frameHeight}`;
          currentStats.fps = report.framesPerSecond || 0;
          currentStats.bitrate = `${bitrate} kbps`;
          currentStats.packetLoss =
            (report.packetsLost / report.packetsReceived) * 100;
          currentStats.jitterBuffer = parseFloat(
            (report.jitterBufferDelay * 1000).toFixed(0),
          );

          lastBytes = bytes;
          lastTimestamp = now;

          // --- THE "BLACK SCREEN" DETECTOR ---
          // If we are receiving bytes but FPS is 0, the browser is stuck.
          if (
            bytes > lastBytes &&
            currentStats.fps === 0 &&
            this.video.paused === false
          ) {
            this.video.currentTime += 0.01; // Tiny nudge to force re-draw
          }
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          currentStats.latency = parseFloat(
            (report.currentRoundTripTime * 1000).toFixed(0),
          );
        }
      });

      this.diagnostic.update(currentStats);
    }, 1000);
  }

  public async start(): Promise<void> {
    try {
      this.playback.setState(PlaybackState.LOADING);

      // 1. Create Peer Connection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // You can make this configurable via options
        bundlePolicy: 'max-bundle',
      });

      // 2. Setup Event Listeners
      this.setupPcListeners();

      // 3. Delegate Negotiation to Adapter
      await this.signalingAdapter.negotiate(this.pc);

      this.pushLogs('WHEP', 'SDP Handshake Successful via Adapter');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.pushLogs('ERROR', `Connection Failed: ${msg}`);
      this.handleRetryLogic();
    }
  }

  private setupPcListeners(): void {
    if (!this.pc) return;

    // Handle Incoming Tracks
    this.pc.ontrack = (evt: RTCTrackEvent) => {
      this.pushLogs('Success', `Track received: ${evt.track.kind}`);

      if (evt.track.kind === 'video') {
        this.video.srcObject = evt.streams[0];

        // --- 2026 PRO FEATURE: Jitter Buffer Control ---
        // Force a small buffer (e.g., 200ms) to smooth out network jitter
        const receiver = evt.receiver;
        if (receiver && 'playoutDelayHint' in receiver) {
          receiver.playoutDelayHint = 0.2;
          this.pushLogs('Optimization', 'Applied 200ms Jitter Buffer');
        }
      }
    };

    // Connection State Logic
    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState || 'closed';
      this.pushLogs('ConnectionState', state);

      switch (state) {
        case 'connected':
          this.retryCounts_ = 0;
          this.video
            .play()
            .then(() => {
              this.playback.setState(PlaybackState.PLAYING);
              // 2. START MONITORING HERE
              // We wait for the 'playing' state to ensure the pipeline is active
              this.startStatsMonitor();
            })
            .catch((e) => console.warn('Autoplay blocked', e));
          break;
        case 'failed':
        case 'disconnected':
          this.stopStatsMonitor(); // Important to clean up!
          this.playback.setState(PlaybackState.BUFFERING);
          this.handleRetryLogic();
          break;
        case 'closed':
          break;
      }
    };
  }

  private stopStatsMonitor(): void {
    if (this.statsInterval !== null) {
      window.clearInterval(this.statsInterval);
      this.statsInterval = null;
      this.pushLogs('System', 'Stats Monitor Stopped');
    }
  }

  private handleRetryLogic(): void {
    if (this.terminated) return;

    if (!this.isRestartFromClick_) {
      if (this.retryCounts_ >= this.retryParameters.maxAttempts) {
        this.pushLogs('Error', 'Max retries reached. Stopping.');
        this.retryCounts_ = 0;
        this.playback.setState(PlaybackState.ERROR);
        return;
      }

      const delay =
        convertMsToSeconds(this.retryParameters.baseDelay) *
        (this.retryCounts_ + 1);
      this.scheduler.tickEvery(delay);
      this.retryCounts_ += 1;
    }
  }

  public scheduleRestart(): void {
    if (this.terminated) return;
    this.cleanUp();
    this.start();
  }

  public getDiagnosticOverlay() {
    this.diagnostic.toggle();
  }

  private cleanUp(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  public destroyReceiver(): void {
    this.terminated = true;
    this.stopStatsMonitor();
    this.scheduler.stop();
    this.signalingAdapter.destroy(); // Clean up adapter
    this.cleanUp();
  }

  private pushLogs(logName: string, logMessage: string): void {
    const event = new Event(WebRTCPlayer.ON_ADD_LOG) as LogEvent;
    event.logName = logName;
    event.logMessage = logMessage;
    this.videoContainer.dispatchEvent(event);
  }

  private onWebRtcError(error: string, code: number, message: string): void {
    const event = new Event(WebRTCPlayer.ON_WEBRTC_PLAYER_ERROR) as ErrorEvent;
    event.error = error;
    event.code = code;
    event.message = message;
    this.video.dispatchEvent(event);
    this.pushLogs(error, message);
  }
}
