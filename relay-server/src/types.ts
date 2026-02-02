/**
 * Relay Server Types
 */

export interface StreamConfig {
  rtmpUrl: string;
  streamKey: string;
}

export interface ServerMessage {
  type: 'ready' | 'error' | 'rtmp_reconnecting' | 'rtmp_reconnected' | 'rtmp_failed';
  error?: string;
  attempt?: number;
  maxRetries?: number;
  retries?: number;
}

/** RTMP URL presets for common platforms */
export const RTMP_PRESETS = {
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  twitch: 'rtmp://live.twitch.tv/app',
} as const;
