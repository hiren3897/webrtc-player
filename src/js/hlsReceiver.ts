/*
 * Copyright (C) 2026 Hiren Rathod
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 */
import Hls from 'hls.js';
import { WebRTCVideoElement } from './ui/interfaces';

export default class HlsReceiver {
  private hls: Hls | null = null;
  private video: WebRTCVideoElement;
  private hlsUrl: string;

  constructor(video: WebRTCVideoElement, hlsUrl: string) {
    this.video = video;
    this.hlsUrl = hlsUrl;
  }

  isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  public start(seekPercentage: number): void {
    // 1. Show a loading overlay on your UI here

    this.stop(); // Cleanly closes WebRTC

    if (Hls.isSupported() && !this.isIOS()) {
      this.hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 60, // Keeps some buffer for smoother seeking
      });

      this.hls.loadSource(this.hlsUrl);
      this.hls.attachMedia(this.video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const targetTime = this.hls!.media!.duration * seekPercentage;
        if (isFinite(targetTime)) {
          this.video.currentTime = targetTime;
          // 3. Hide loading overlay once video starts
          this.video.play().catch((e) => console.error('Autoplay blocked', e));
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
