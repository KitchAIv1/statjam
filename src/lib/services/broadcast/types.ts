/**
 * Broadcast Service Types
 * 
 * Types for YouTube/Twitch broadcasting via relay server.
 */

export type BroadcastPlatform = 'youtube' | 'twitch';

export type QualityPreset = '720p' | '1080p' | '1080p-sports';

export interface QualitySettings {
  label: string;
  description: string;
  videoBitrate: number;      // MediaRecorder (kbps)
  audioBitrate: number;      // MediaRecorder (kbps)
  ffmpegBitrate: number;     // FFmpeg target (kbps)
  ffmpegMaxrate: number;     // FFmpeg peak (kbps)
}

/** Quality presets optimized for different use cases */
export const QUALITY_PRESETS: Record<QualityPreset, QualitySettings> = {
  '720p': {
    label: '720p HD',
    description: 'Works on most connections (4 Mbps)',
    videoBitrate: 4000,
    audioBitrate: 128,
    ffmpegBitrate: 4000,
    ffmpegMaxrate: 4500,
  },
  '1080p': {
    label: '1080p HD',
    description: 'Standard quality (6 Mbps)',
    videoBitrate: 6000,
    audioBitrate: 192,
    ffmpegBitrate: 6000,
    ffmpegMaxrate: 7000,
  },
  '1080p-sports': {
    label: '1080p Sports',
    description: 'High motion quality (10 Mbps) - Requires fast upload',
    videoBitrate: 8000,
    audioBitrate: 192,
    ffmpegBitrate: 10000,
    ffmpegMaxrate: 12000,
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

