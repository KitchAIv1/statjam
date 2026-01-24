/**
 * Relay Server Types
 */

export interface StreamConfig {
  rtmpUrl: string;
  streamKey: string;
}

export interface ServerMessage {
  type: 'ready' | 'error';
  error?: string;
}

/** RTMP URL presets for common platforms */
export const RTMP_PRESETS = {
  youtube: 'rtmp://a.rtmp.youtube.com/live2',
  twitch: 'rtmp://live.twitch.tv/app',
} as const;
