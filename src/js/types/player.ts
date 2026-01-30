export interface RetryParameters {
  maxAttempts: number;
  baseDelay: number;
}

export interface PlayerOptions {
  webRtcUrl: string;
  hlsUrl?: string;
  dvrEnabled?: boolean;
  onStatusChange?: ((state: string) => void) | null;
  onDemand?: boolean | null;
  ui?: {
    screenshot: boolean;
  };
  retryParameters?: RetryParameters;
}

export enum PlaybackState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  BUFFERING = 'BUFFERING',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR',
}

export interface PlaybackStateListener {
  onPlaybackStateChange(state: PlaybackState): void;
}
