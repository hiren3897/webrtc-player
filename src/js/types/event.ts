export interface LogEvent extends Event {
  logName: string;
  logMessage: string;
}

export interface ModeSwitchEvent extends Event {
  mode: 'dvr' | 'live';
}

export interface ErrorEvent extends Event {
  error: string;
  code: number;
  message: string;
}
