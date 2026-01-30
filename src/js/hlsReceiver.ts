/*
 * Copyright (C) 2026 Hiren Rathod
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 */
import Hls from 'hls.js';
import { PlaybackStateController } from './controllers/playbackStateController';
import { IControls } from './ui/interfaces';
import { PlaybackState } from './types/player';

export default class HlsReceiver {
  private hls: Hls | null = null;
  private video: HTMLVideoElement;
  private hlsUrl: string;
  updatePresentationTimelineOnce: boolean;

  constructor(
    video: HTMLVideoElement,
    hlsUrl: string,
    private playback: PlaybackStateController,
    private controls: IControls,
  ) {
    this.video = video;
    this.hlsUrl = hlsUrl;
    this.updatePresentationTimelineOnce = false;
    this.controls = controls;
  }

  isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  public start(seekPercentage: number): void {
    this.playback.setState(PlaybackState.LOADING);

    // 1. Show a loading overlay on your UI here
    this.updatePresentationTimelineOnce = false;
    this.stop(); // Cleanly closes WebRTC
    this.attachVideoEvents();

    if (Hls.isSupported() && !this.isIOS()) {
      this.hls = new Hls({
        lowLatencyMode: false, // IMPORTANT
        backBufferLength: 1200, // Keep full 20 min
        maxBufferLength: 1200,
        maxLiveSyncPlaybackRate: 1.0,
        enableWorker: true,
      });

      this.hls.loadSource(this.hlsUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (e) => {
        this.video.play();
      });

      this.hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        const details = data.details;

        if (!details || !details.live) return;

        const dvrStart = details.fragmentStart;
        const dvrDuration = details.totalduration;

        this.controls.setSeek(dvrStart, details.totalduration);
        if (!this.updatePresentationTimelineOnce) {
          const targetTime = dvrStart + dvrDuration * seekPercentage;

          this.controls.setPresentationCurrentTime(targetTime.toString());
          this.updatePresentationTimelineOnce = true;
        }
      });

      this.hls.on(Hls.Events.ERROR, (_, data) => {
        this.playback.setState(PlaybackState.BUFFERING);

        if (data.fatal) {
          this.playback.setState(PlaybackState.ERROR);
          this.stop();
        }
      });
    } else {
      // Safari/iOS Native
      this.video.src = this.hlsUrl;
      this.video.load();
      this.video.addEventListener(
        'loadedmetadata',
        () => {
          this.video.currentTime = this.video.duration * seekPercentage;
          this.video.play();
        },
        { once: true },
      );
    }
  }

  private attachVideoEvents() {
    this.video.addEventListener('waiting', () =>
      this.playback.setState(PlaybackState.BUFFERING),
    );

    this.video.addEventListener('playing', () =>
      this.playback.setState(PlaybackState.PLAYING),
    );

    this.video.addEventListener('stalled', () =>
      this.playback.setState(PlaybackState.BUFFERING),
    );
  }

  public stop(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.video.src = '';
    this.video.pause();
    this.video.srcObject = null;
    this.video.removeAttribute('src');
    this.video.load();
  }
}
