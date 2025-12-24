/**
 * Video Stat Tracking Configuration
 * 
 * Central configuration for video upload, clip generation, and playback settings.
 * 
 * @module videoConfig
 */

// =============================================================================
// CLIP GENERATION
// =============================================================================

export const VIDEO_CONFIG = {
  // Default clip window (±3 seconds, configurable per game)
  defaultClipBeforeMs: 3000,
  defaultClipAfterMs: 3000,
  
  // Clip window limits
  minClipWindowMs: 1000,
  maxClipWindowMs: 10000,
  
  // Auto-advance after marking stat (seconds)
  defaultAutoAdvanceSeconds: 5,
  
  // Frame stepping (approximate - 30fps = ~33ms per frame)
  frameStepMs: 33,
  
  // Playback speeds available
  playbackSpeeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const,
  
  // Quarter lengths available
  quarterLengths: [8, 10, 12] as const,
  
  // Overtime period length (minutes)
  overtimeLengthMinutes: 5,
} as const;

// =============================================================================
// STAT TYPES FOR CLIPS
// =============================================================================

/**
 * Stat types that can generate clips
 */
export const CLIP_STAT_TYPES = [
  'field_goal',
  'three_pointer',
  'free_throw',
  'assist',
  'block',
  'steal',
] as const;

/**
 * Stats that require "made" modifier to generate clips
 */
export const MADE_ONLY_STATS = ['field_goal', 'three_pointer', 'free_throw'] as const;

/**
 * Check if a stat should generate a clip
 */
export function shouldGenerateClip(statType: string, modifier?: string): boolean {
  if (!CLIP_STAT_TYPES.includes(statType as typeof CLIP_STAT_TYPES[number])) {
    return false;
  }
  
  if (MADE_ONLY_STATS.includes(statType as typeof MADE_ONLY_STATS[number])) {
    return modifier === 'made';
  }
  
  return true;
}

// =============================================================================
// UPLOAD CONFIGURATION
// =============================================================================

export const UPLOAD_CONFIG = {
  // Max file size (40GB)
  maxFileSizeBytes: 40 * 1024 * 1024 * 1024,
  maxFileSizeGB: 40,
  
  // Allowed video formats
  allowedMimeTypes: [
    'video/mp4',
    'video/quicktime',  // .mov
    'video/webm',
    'video/x-msvideo',  // .avi
    'video/x-matroska', // .mkv
  ],
  
  // File extensions
  allowedExtensions: ['.mp4', '.mov', '.webm', '.avi', '.mkv'],
  
  // Chunk size for resumable upload (5MB)
  chunkSizeBytes: 5 * 1024 * 1024,
  
  // Parallel upload chunks
  parallelChunks: 3,
} as const;

// =============================================================================
// BUNNY.NET CONFIGURATION
// =============================================================================

export const BUNNY_CONFIG = {
  // API endpoints
  storageApiUrl: 'https://storage.bunnycdn.com',
  streamApiUrl: 'https://video.bunnycdn.com',
  
  // Player embed URL
  playerUrl: 'https://iframe.mediadelivery.net/embed',
  
  // Clip generation
  parallelClipGeneration: 10,
  clipOutputResolutions: ['480p', '720p', '1080p', 'source'] as const,
  defaultOutputResolution: '720p' as const,
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const VIDEO_UI_CONFIG = {
  // Stats timeline
  timelineMaxVisible: 10,
  timelineScrollThreshold: 5,
  
  // Keyboard hints
  showKeyboardHints: true,
  
  // Score validation
  validateScoreOnSubmit: true,
  
  // Auto-save interval (ms)
  autoSaveIntervalMs: 30000,
  
  // Video controls
  seekBarHeight: 8,
  controlsHideDelay: 3000,
} as const;

// =============================================================================
// ENVIRONMENT VARIABLES
// =============================================================================

/**
 * Get Bunny.net configuration from environment
 */
export function getBunnyConfig() {
  return {
    storageZone: process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || '',
    storageApiKey: process.env.BUNNY_STORAGE_API_KEY || '',
    libraryId: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
    streamApiKey: process.env.BUNNY_STREAM_API_KEY || '',
    cdnHostname: process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || '',
  };
}

/**
 * Check if Bunny.net is configured
 */
export function isBunnyConfigured(): boolean {
  const config = getBunnyConfig();
  return !!(config.libraryId && config.cdnHostname);
}

