/**
 * Shot Location Service
 * 
 * Handles zone detection from court coordinates and shot type inference.
 * Used by useShotTracker hook to determine 2PT vs 3PT based on tap location.
 * 
 * @module shotLocationService
 */

import {
  CourtCoordinates,
  ShotZone,
  InferredShotType,
  ZoneDetectionResult,
  ZONE_CONFIGS
} from '@/lib/types/shotTracker';

// ============================================================================
// COURT GEOMETRY CONSTANTS (Based on NBA half-court proportions)
// ============================================================================

/** 
 * 3-point line distance from basket (as percentage of court width/height)
 * NBA 3PT line is 23.75 feet from basket, corners are 22 feet
 */
const THREE_POINT_ARC_RADIUS = 42; // Approximate Y distance where arc crosses

/** Paint boundaries (percentage of court dimensions) */
const PAINT_LEFT = 30;
const PAINT_RIGHT = 70;
const PAINT_BOTTOM = 35; // Y position where paint ends (towards half-court)

/** Corner 3 boundaries */
const CORNER_3_MAX_Y = 18; // Corners extend this far from baseline
const CORNER_3_LEFT_MAX_X = 15;
const CORNER_3_RIGHT_MIN_X = 85;

/** Wing 3 boundaries */
const WING_Y_MIN = 18;
const WING_Y_MAX = 50;

// ============================================================================
// ZONE DETECTION
// ============================================================================

/**
 * Detect which zone a court tap falls into
 * Uses geometric boundaries based on NBA court proportions
 */
export function detectZoneFromCoordinates(coords: CourtCoordinates): ZoneDetectionResult {
  const { x, y } = coords;
  
  // Validate coordinates are in range
  if (x < 0 || x > 100 || y < 0 || y > 100) {
    return createResult('mid_range', 'low'); // Default fallback
  }

  // Check paint first (innermost zone)
  if (isInPaint(x, y)) {
    return createResult('paint', 'high');
  }

  // Check corner 3s
  if (isInCorner3Left(x, y)) {
    return createResult('corner_3_left', 'high');
  }
  if (isInCorner3Right(x, y)) {
    return createResult('corner_3_right', 'high');
  }

  // Check if beyond 3-point arc
  if (isBeyond3PointArc(x, y)) {
    // Determine which 3PT zone
    if (y > WING_Y_MAX) {
      return createResult('top_3', 'high');
    }
    if (x < 50) {
      return createResult('wing_3_left', 'high');
    }
    return createResult('wing_3_right', 'high');
  }

  // Default: mid-range (inside arc but outside paint)
  return createResult('mid_range', 'high');
}

/**
 * Check if coordinates are inside the paint/key area
 */
function isInPaint(x: number, y: number): boolean {
  return x >= PAINT_LEFT && x <= PAINT_RIGHT && y <= PAINT_BOTTOM;
}

/**
 * Check if coordinates are in left corner 3 zone
 */
function isInCorner3Left(x: number, y: number): boolean {
  return x <= CORNER_3_LEFT_MAX_X && y <= CORNER_3_MAX_Y;
}

/**
 * Check if coordinates are in right corner 3 zone
 */
function isInCorner3Right(x: number, y: number): boolean {
  return x >= CORNER_3_RIGHT_MIN_X && y <= CORNER_3_MAX_Y;
}

/**
 * Check if coordinates are beyond the 3-point arc
 * Uses simplified rectangular approximation for the arc
 */
function isBeyond3PointArc(x: number, y: number): boolean {
  // Simple distance-from-basket calculation
  const basketX = 50;
  const basketY = 5;
  
  const dx = Math.abs(x - basketX);
  const dy = y - basketY;
  
  // Approximate arc as ellipse (wider horizontally)
  const normalizedDistance = Math.sqrt((dx / 45) ** 2 + (dy / 40) ** 2);
  
  return normalizedDistance > 1;
}

/**
 * Create a zone detection result with all required fields
 */
function createResult(
  zone: ShotZone, 
  confidence: 'high' | 'medium' | 'low'
): ZoneDetectionResult {
  const config = ZONE_CONFIGS[zone];
  return {
    zone,
    shotType: config.shotType,
    points: config.points,
    confidence
  };
}

// ============================================================================
// SHOT TYPE UTILITIES
// ============================================================================

/**
 * Get shot type (field_goal or three_pointer) from zone
 */
export function getShotTypeFromZone(zone: ShotZone): InferredShotType {
  return ZONE_CONFIGS[zone].shotType;
}

/**
 * Get point value from zone
 */
export function getPointsFromZone(zone: ShotZone): number {
  return ZONE_CONFIGS[zone].points;
}

/**
 * Get human-readable zone label
 */
export function getZoneLabel(zone: ShotZone): string {
  return ZONE_CONFIGS[zone].label;
}

/**
 * Convert pixel coordinates to normalized court coordinates
 */
export function pixelToCourtCoordinates(
  pixelX: number,
  pixelY: number,
  containerWidth: number,
  containerHeight: number
): CourtCoordinates {
  return {
    x: (pixelX / containerWidth) * 100,
    y: (pixelY / containerHeight) * 100
  };
}

/**
 * Convert normalized coordinates to pixel position for rendering
 */
export function courtToPixelCoordinates(
  coords: CourtCoordinates,
  containerWidth: number,
  containerHeight: number
): { pixelX: number; pixelY: number } {
  return {
    pixelX: (coords.x / 100) * containerWidth,
    pixelY: (coords.y / 100) * containerHeight
  };
}
