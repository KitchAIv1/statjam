/**
 * Video Stat Tracking Type Definitions
 * 
 * Types for video upload, clock sync, stat tracking, and clip generation.
 * Used by video tracker components and services.
 * 
 * @module video
 */

// =============================================================================
// VIDEO UPLOAD
// =============================================================================

export type VideoUploadStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type VideoAssignmentStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface GameVideo {
  id: string;
  gameId: string;
  bunnyLibraryId: string;
  bunnyVideoId: string;
  
  // Metadata
  originalFilename: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  status: VideoUploadStatus;
  errorMessage: string | null;
  
  // Clock sync calibration
  jumpballTimestampMs: number | null;
  halftimeTimestampMs: number | null;
  quarterLengthMinutes: 8 | 10 | 12;
  
  // Quarter markers
  q2StartTimestampMs: number | null;
  q3StartTimestampMs: number | null;
  q4StartTimestampMs: number | null;
  ot1StartTimestampMs: number | null;
  ot2StartTimestampMs: number | null;
  ot3StartTimestampMs: number | null;
  
  // State
  isCalibrated: boolean;
  statsCount: number;
  
  // Assignment workflow (for admin/stat admin)
  assignedStatAdminId: string | null;
  assignmentStatus: VideoAssignmentStatus;
  assignedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  
  // Audit
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  errorMessage?: string;
}

// =============================================================================
// CLOCK SYNC
// =============================================================================

export interface ClockSyncConfig {
  jumpballTimestampMs: number;
  halftimeTimestampMs: number | null;
  quarterLengthMinutes: 8 | 10 | 12;
  
  // Optional quarter markers for precise sync
  q2StartTimestampMs?: number;
  q3StartTimestampMs?: number;
  q4StartTimestampMs?: number;
  ot1StartTimestampMs?: number;
  ot2StartTimestampMs?: number;
  ot3StartTimestampMs?: number;
}

export interface GameClock {
  quarter: number;           // 1-4 for regulation, 5+ for OT
  minutesRemaining: number;
  secondsRemaining: number;
  isOvertime: boolean;
  overtimePeriod: number;    // 0 for regulation, 1+ for OT
}

export interface QuarterMarker {
  quarter: number;
  videoTimestampMs: number;
  label: string;
}

// =============================================================================
// VIDEO PLAYER
// =============================================================================

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export interface VideoPlayerState {
  videoId: string;
  url: string;
  duration: number;          // Total seconds
  currentTime: number;       // Current position in seconds
  playing: boolean;
  playbackRate: PlaybackSpeed;
  volume: number;
  muted: boolean;
  buffering: boolean;
}

export interface VideoPlayerControls {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (timeSeconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  stepFrame: (direction: 'forward' | 'backward') => void;
  setPlaybackRate: (rate: PlaybackSpeed) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

// =============================================================================
// VIDEO STAT TRACKING
// =============================================================================

export interface VideoStat {
  id: string;
  gameStatId: string;
  videoTimestampMs: number;
  
  // Game clock at time of stat
  quarter: number;
  gameClockSeconds: number;  // Seconds remaining in quarter
  
  // Player info
  playerId: string | null;
  customPlayerId: string | null;
  playerName: string;
  jerseyNumber: string;
  teamId: string;
  
  // Stat details
  statType: string;
  modifier?: string;
  statValue: number;
  
  // Shot data (if applicable)
  shotLocationX?: number;
  shotLocationY?: number;
  shotZone?: string;
  
  // Assist (if applicable)
  assistedById?: string;
  assistedByName?: string;
  
  createdAt: string;
}

export interface VideoTrackerState {
  // Video
  video: VideoPlayerState | null;
  
  // Clock sync
  clockSync: ClockSyncConfig | null;
  isCalibrated: boolean;
  
  // Derived game clock
  gameClock: GameClock;
  
  // Tracking
  selectedPlayerId: string | null;
  selectedCustomPlayerId: string | null;
  selectedTeamId: string | null;
  pendingStatType: string | null;
  
  // Shot tracker
  shotTrackerOpen: boolean;
  pendingShotLocation: { x: number; y: number } | null;
  
  // Stats
  stats: VideoStat[];
  
  // UI settings
  autoAdvanceSeconds: number;
  showKeyboardHints: boolean;
}

// =============================================================================
// CLIP GENERATION
// =============================================================================

export type ClipStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'skipped';

export interface ClipConfig {
  id: string;
  gameId: string;
  clipBeforeMs: number;
  clipAfterMs: number;
  
  // What to generate
  generateMadeFg: boolean;
  generateMade3pt: boolean;
  generateMadeFt: boolean;
  generateAssists: boolean;
  generateBlocks: boolean;
  generateSteals: boolean;
  generateDunks: boolean;
  
  outputResolution: '480p' | '720p' | '1080p' | 'source';
  
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedClip {
  id: string;
  gameStatId: string;
  gameId: string;
  
  // Player info
  playerId: string | null;
  customPlayerId: string | null;
  teamId: string | null;
  statType: string;
  modifier: string | null;
  
  // Bunny.net
  bunnyClipId: string | null;
  bunnyClipUrl: string | null;
  thumbnailUrl: string | null;
  
  // Timing
  startTimestampMs: number;
  endTimestampMs: number;
  durationMs: number;
  
  // Status
  status: ClipStatus;
  errorMessage: string | null;
  isPreviewClip: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export type ClipJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface ClipGenerationJob {
  id: string;
  gameId: string;
  gameVideoId: string | null;
  
  status: ClipJobStatus;
  
  // Progress
  totalClips: number;
  completedClips: number;
  failedClips: number;
  skippedClips: number;
  
  // Timing
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
}

export const VIDEO_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Space', description: 'Play/Pause video', action: 'togglePlayPause' },
  { key: 'K', description: 'Play/Pause video', action: 'togglePlayPause' },
  { key: 'J', description: 'Rewind 10 seconds', action: 'rewind10' },
  { key: 'L', description: 'Forward 10 seconds', action: 'forward10' },
  { key: ',', description: 'Previous frame', action: 'prevFrame' },
  { key: '.', description: 'Next frame', action: 'nextFrame' },
  { key: '1', description: 'Speed 0.5x', action: 'speed05' },
  { key: '2', description: 'Speed 1x', action: 'speed1' },
  { key: '3', description: 'Speed 2x', action: 'speed2' },
  { key: 'P', description: 'Quick: Made shot', action: 'quickShot' },
  { key: 'R', description: 'Quick: Rebound', action: 'quickRebound' },
  { key: 'A', description: 'Quick: Assist', action: 'quickAssist' },
  { key: 'S', description: 'Quick: Steal', action: 'quickSteal' },
  { key: 'B', description: 'Quick: Block', action: 'quickBlock' },
  { key: 'Z', description: 'Undo last stat', action: 'undo', modifiers: ['ctrl'] },
];

