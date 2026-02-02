/**
 * Broadcast Service Types
 * 
 * Types for YouTube/Twitch broadcasting via relay server.
 */

export type BroadcastPlatform = 'youtube' | 'twitch' | 'facebook';

export type QualityPreset = '720p' | '1080p' | '1080p-sports';

export interface QualitySettings {
  label: string;
  description: string;
  videoBitrate: number;      // MediaRecorder (kbps)
  audioBitrate: number;      // MediaRecorder (kbps)
  ffmpegBitrate: number;     // FFmpeg target (kbps)
  ffmpegMaxrate: number;     // FFmpeg peak (kbps)
}

/** Quality presets optimized for YouTube/Twitch streaming */
export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  '720p': {
    label: '720p HD',
    description: 'YouTube optimized (6.5 Mbps)',
    videoBitrate: 6500,
    audioBitrate: 128,
    ffmpegBitrate: 6500,
    ffmpegMaxrate: 7500,
  },
  '1080p': {
    label: '1080p HD',
    description: 'Standard quality (8 Mbps)',
    videoBitrate: 8000,
    audioBitrate: 192,
    ffmpegBitrate: 8000,
    ffmpegMaxrate: 9000,
  },
  '1080p-sports': {
    label: '1080p Sports',
    description: 'High motion quality (12 Mbps) - Requires fast upload',
    videoBitrate: 10000,
    audioBitrate: 192,
    ffmpegBitrate: 12000,
    ffmpegMaxrate: 14000,
  },
};

export interface BroadcastConfig {
  platform: BroadcastPlatform;
  streamKey: string;
  rtmpUrl: string;
  quality?: QualityPreset;
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

