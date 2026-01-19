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

export interface LogEntry {
  name: string;
  message: string;
}

// Custom Event interfaces to handle the properties you attach
export interface LogEvent extends Event {
  logName: string;
  logMessage: string;
}

export interface ErrorEvent extends Event {
  error: string;
  code: number;
  message: string;
}

export interface IStreamController {
  switchToLive(): void;
  switchToDVR(time: number): void;
}
