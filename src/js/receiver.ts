/*
 * Copyright (C) 2026 Hiren Rathod
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 */

import { PlaybackStateController } from './controllers/playbackStateController';
import { ErrorEvent, LogEvent, PlaybackState, RetryParameters } from './types';
import { convertMsToSeconds } from './utils/shared';
import { Timer } from './utils/timer';
import WebRTCPlayer from './webRTCPlayer';

export default class Receiver {
  private video: HTMLVideoElement;
  private videoContainer: HTMLElement;
  private webRtcUrl: string;
  private pc: RTCPeerConnection | null = null;
  private retryCounts_: number = 0;
  private retryParameters: RetryParameters;
  private isRestartFromClick_: boolean = false;
  private scheduler: Timer;
  private terminated: boolean = false;

  constructor(
    video: HTMLVideoElement,
    videoContainer: HTMLElement,
    webRtcUrl: string,
    retryParameters: RetryParameters,
    private playback: PlaybackStateController,
  ) {
    this.video = video;
    this.videoContainer = videoContainer;
    this.retryParameters = retryParameters;
    this.webRtcUrl = webRtcUrl.endsWith('/whep')
      ? webRtcUrl
      : `${webRtcUrl}/whep`;
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

  public async start(): Promise<void> {
    try {
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      this.pc.ontrack = (evt: RTCTrackEvent) => {
        if (this.video.srcObject !== evt.streams[0]) {
          this.video.srcObject = evt.streams[0];
          this.pushLogs('Success', 'Remote stream track received');
        }
      };

      this.pc.onconnectionstatechange = () => {
        const state = this.pc ? this.pc.connectionState : 'destroyed';
        this.pushLogs('ConnectionState', state);
        if (state === 'new' || state === 'connecting') {
          this.playback.setState(PlaybackState.LOADING);
        }
        if (state === 'connected') {
          this.retryCounts_ = 0;
          this.video
            .play()
            .finally(() => {
              this.playback.setState(PlaybackState.PLAYING);
            })
            .catch(console.error);
        }

        if (state === 'failed' || state === 'disconnected') {
          this.playback.setState(PlaybackState.BUFFERING);
          this.handleRetryLogic();
        }
      };

      this.pc.addTransceiver('video', { direction: 'recvonly' });
      this.pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (this.pc?.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (this.pc?.iceGatheringState === 'complete') {
              this.pc.removeEventListener(
                'icegatheringstatechange',
                checkState,
              );
              resolve();
            }
          };
          this.pc?.addEventListener('icegatheringstatechange', checkState);
        }
      });

      const response = await fetch(this.webRtcUrl, {
        method: 'POST',
        body: this.pc?.localDescription?.sdp,
        headers: { 'Content-Type': 'application/sdp' },
      });

      if (!response.ok)
        throw new Error(`WHEP Server responded with ${response.status}`);

      const answerSdp = await response.text();
      await this.pc.setRemoteDescription(
        new RTCSessionDescription({
          type: 'answer',
          sdp: answerSdp,
        }),
      );

      this.pushLogs('WHEP', 'SDP Handshake Successful');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : (() => {
                try {
                  return JSON.stringify(err);
                } catch {
                  return String(err);
                }
              })() || 'Unknown error';

      this.pushLogs('ERROR', `WHEP Connection Failed: ${msg}`);
      this.handleRetryLogic();
    }
  }

  private handleRetryLogic(): void {
    if (this.terminated) return;
    if (!this.isRestartFromClick_) {
      if (this.retryCounts_ >= this.retryParameters.maxAttempts) {
        this.retryCounts_ = 0;
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

  private cleanUp(): void {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
      this.terminated = false;
    }
  }

  public destroyReceiver(): void {
    this.terminated = true;
    this.scheduler.stop();
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
