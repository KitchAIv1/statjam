/**
 * Relay Server Types
 */

export interface BroadcastConfig {
  platform: 'youtube' | 'twitch';
  streamKey: string;
  rtmpUrl: string;
}

export interface WebSocketMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'config';
  data?: any;
  config?: BroadcastConfig;
}

