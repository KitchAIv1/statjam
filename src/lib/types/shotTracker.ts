/**
 * Shot Tracker Type Definitions
 * 
 * Defines types for the court-based shot tracking component.
 * Used by HalfCourtDiagram, useShotTracker, and shotLocationService.
 * 
 * @module shotTracker
 */

// ============================================================================
// COURT ZONES
// ============================================================================

/**
 * Shot zone identifiers matching NBA standard court areas
 */
export type ShotZone = 
  | 'paint'           // Inside the key (restricted area) - 2PT
  | 'mid_range'       // Between paint and 3PT line - 2PT
  | 'corner_3_left'   // Left corner beyond arc - 3PT
  | 'corner_3_right'  // Right corner beyond arc - 3PT
  | 'wing_3_left'     // Left wing beyond arc - 3PT
  | 'wing_3_right'    // Right wing beyond arc - 3PT
  | 'top_3';          // Top of key beyond arc - 3PT

/**
 * Shot type derived from zone location
 */
export type InferredShotType = 'field_goal' | 'three_pointer';

/**
 * Zone configuration for court rendering and hit detection
 */
export interface ZoneConfig {
  id: ShotZone;
  label: string;
  shotType: InferredShotType;
  points: number;
  /** SVG path or polygon points for rendering */
  path: string;
}

// ============================================================================
// COORDINATES
// ============================================================================

/**
 * Normalized court coordinates (0-100 range)
 * 
 * Based on half-court image orientation:
 * - Basket is at TOP of image (baseline)
 * - Half-court line is at BOTTOM of image
 * 
 * Origin (0,0) is top-left corner (left side of baseline)
 * Basket is approximately at (50, 5)
 */
export interface CourtCoordinates {
  /** X position: 0 = left edge, 100 = right edge */
  x: number;
  /** Y position: 0 = baseline (basket end, top), 100 = half-court line (bottom) */
  y: number;
}

/**
 * Pixel coordinates from tap/click event
 */
export interface PixelCoordinates {
  x: number;
  y: number;
}

// ============================================================================
// SHOT DATA
// ============================================================================

/**
 * Pending shot waiting for made/missed confirmation
 */
export interface PendingShot {
  /** Unique identifier for this pending shot */
  pendingId: string;
  /** Player who took the shot */
  playerId: string | null;
  /** Custom player ID (for coach mode) */
  customPlayerId: string | null;
  /** Team that took the shot */
  teamId: string;
  /** Court location where shot was taken */
  location: CourtCoordinates;
  /** Detected zone from location */
  zone: ShotZone;
  /** Inferred shot type (2PT or 3PT) */
  shotType: InferredShotType;
  /** Point value if made */
  points: number;
  /** Timestamp when shot was registered */
  timestamp: number;
}

/**
 * Shot location data to persist with game_stats
 */
export interface ShotLocationData {
  shotLocationX: number;
  shotLocationY: number;
  shotZone: ShotZone;
}

// ============================================================================
// UI STATE
// ============================================================================

/**
 * Court perspective for visual rendering
 */
export type CourtPerspective = 'team_a_attacks_up' | 'team_b_attacks_up';

/**
 * Tracker input mode toggle
 */
export type TrackerInputMode = 'classic' | 'shot_tracker';

/**
 * Shot marker for visual display on court
 */
export interface ShotMarker {
  id: string;
  location: CourtCoordinates;
  made: boolean;
  shotType: InferredShotType;
  playerId: string | null;
  timestamp: number;
}

// ============================================================================
// HOOK STATE
// ============================================================================

/**
 * useShotTracker hook return type
 */
export interface UseShotTrackerReturn {
  /** Current pending shot awaiting confirmation */
  pendingShot: PendingShot | null;
  /** Current court perspective */
  perspective: CourtPerspective;
  /** Shot markers to display on court */
  shotMarkers: ShotMarker[];
  /** Handle court tap event */
  handleCourtTap: (coordinates: CourtCoordinates) => void;
  /** Confirm shot as made */
  confirmMade: () => Promise<void>;
  /** Confirm shot as missed */
  confirmMissed: () => Promise<void>;
  /** Cancel pending shot */
  cancelPendingShot: () => void;
  /** Toggle court perspective */
  flipPerspective: () => void;
  /** Set perspective based on team */
  setPerspectiveForTeam: (teamId: string) => void;
  /** Clear all shot markers */
  clearMarkers: () => void;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

/**
 * Zone detection result from shotLocationService
 */
export interface ZoneDetectionResult {
  zone: ShotZone;
  shotType: InferredShotType;
  points: number;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Two-point zones
 */
export const TWO_POINT_ZONES: ShotZone[] = ['paint', 'mid_range'];

/**
 * Three-point zones
 */
export const THREE_POINT_ZONES: ShotZone[] = [
  'corner_3_left',
  'corner_3_right', 
  'wing_3_left',
  'wing_3_right',
  'top_3'
];

/**
 * Default zone configurations with labels
 */
export const ZONE_CONFIGS: Record<ShotZone, { label: string; shotType: InferredShotType; points: number }> = {
  paint: { label: 'Paint', shotType: 'field_goal', points: 2 },
  mid_range: { label: 'Mid-Range', shotType: 'field_goal', points: 2 },
  corner_3_left: { label: 'Left Corner 3', shotType: 'three_pointer', points: 3 },
  corner_3_right: { label: 'Right Corner 3', shotType: 'three_pointer', points: 3 },
  wing_3_left: { label: 'Left Wing 3', shotType: 'three_pointer', points: 3 },
  wing_3_right: { label: 'Right Wing 3', shotType: 'three_pointer', points: 3 },
  top_3: { label: 'Top of Key 3', shotType: 'three_pointer', points: 3 }
};

