/**
 * Broadcast Service Types
 * 
 * Types for YouTube/Twitch broadcasting via relay server.
 */

export type BroadcastPlatform = 'youtube' | 'twitch';

export interface BroadcastConfig {
  platform: BroadcastPlatform;
  streamKey: string;
  rtmpUrl: string;
}

export interface BroadcastState {
  isBroadcasting: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionStatus: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  relayServerUrl?: string;
}

export interface BroadcastCallbacks {
  onStateChange?: (state: BroadcastState) => void;
  onError?: (error: Error) => void;
}

