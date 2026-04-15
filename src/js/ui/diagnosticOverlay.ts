/*
 * Copyright (C) 2026 Hiren Rathod
 */

export interface PlayerStats {
  resolution: string;
  fps: number;
  bitrate: string;
  packetLoss: number;
  jitterBuffer: number;
  latency: number;
}

export default class DiagnosticOverlay {
  private container: HTMLElement;
  private statsElement: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.container = parent;
    this.statsElement = document.createElement('div');
    this.statsElement.className = 'rtc-diagnostic-overlay';
    this.applyStyles();
    this.container.appendChild(this.statsElement);
  }

  public update(stats: PlayerStats): void {
    this.statsElement.innerHTML = `
      <div><strong>RES:</strong> ${stats.resolution}</div>
      <div><strong>FPS:</strong> ${stats.fps}</div>
      <div><strong>BITRATE:</strong> ${stats.bitrate}</div>
      <div><strong>LOSS:</strong> ${stats.packetLoss}%</div>
      <div><strong>JITTER:</strong> ${stats.jitterBuffer}ms</div>
      <div><strong>LATENCY:</strong> ${stats.latency}ms</div>
    `;
  }

  private applyStyles(): void {
    Object.assign(this.statsElement.style, {
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: '#00ff00',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: '100',
      display: 'none', // Toggle this via a keyboard shortcut (e.g., 'D')
    });
  }

  public toggle(): void {
    const isHidden = this.statsElement.style.display === 'none';
    this.statsElement.style.display = isHidden ? 'block' : 'none';
  }
}
