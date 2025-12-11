/**
 * Shot Location Service
 * 
 * Handles zone detection from court coordinates and shot type inference.
 * Uses circular arc geometry calibrated to the halfcourt.png image.
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
// COURT GEOMETRY CONSTANTS (Calibrated to halfcourt.png)
// ============================================================================

/**
 * Basket center position (normalized 0-100)
 * Measured from the actual halfcourt.png image
 */
const BASKET_X = 50;
const BASKET_Y = 8;

/**
 * 3-point arc as ELLIPSE (not circle)
 * The arc is wider vertically (top) than horizontally (sides)
 * 
 * X_RADIUS: Controls side boundaries (left/right wings)
 * Y_RADIUS: Controls top boundary (top of key area)
 */
const ARC_X_RADIUS = 42; // Horizontal reach (sides) - smaller
const ARC_Y_RADIUS = 55; // Vertical reach (top) - larger

/**
 * Corner 3 zone boundaries
 * Corners are straight lines, not part of the arc
 */
const CORNER_3_LEFT_MAX_X = 12;  // Left corner boundary
const CORNER_3_RIGHT_MIN_X = 88; // Right corner boundary
const CORNER_3_MAX_Y = 18;       // How far corners extend from baseline

/**
 * Paint/key boundaries (measured from image)
 */
const PAINT_LEFT = 32;
const PAINT_RIGHT = 68;
const PAINT_BOTTOM = 32; // Where paint ends (Y value)

// ============================================================================
// ZONE DETECTION (Arc-based)
// ============================================================================

/**
 * Detect which zone a court tap falls into
 * Uses circular arc geometry for accurate 2PT vs 3PT detection
 */
export function detectZoneFromCoordinates(coords: CourtCoordinates): ZoneDetectionResult {
  const { x, y } = coords;
  
  // Validate coordinates are in range
  if (x < 0 || x > 100 || y < 0 || y > 100) {
    return createResult('mid_range', 'low');
  }

  // Step 1: Check corner 3s first (straight lines, not arc)
  if (isInCorner3Left(x, y)) {
    return createResult('corner_3_left', 'high');
  }
  if (isInCorner3Right(x, y)) {
    return createResult('corner_3_right', 'high');
  }

  // Step 2: Check if beyond 3-point arc (elliptical boundary)
  const isBeyondArc = isOutsideEllipticalArc(x, y);

  if (isBeyondArc) {
    // Determine which 3PT zone based on position
    return classify3PointZone(x, y);
  }

  // Step 3: Inside the arc - check paint vs mid-range
  if (isInPaint(x, y)) {
    return createResult('paint', 'high');
  }

  // Default: mid-range (inside arc but outside paint)
  return createResult('mid_range', 'high');
}

/**
 * Check if point is outside the elliptical 3PT arc
 * Uses ellipse equation: (dx/a)² + (dy/b)² > 1 means outside
 * 
 * This allows different radii for horizontal (sides) and vertical (top)
 */
function isOutsideEllipticalArc(x: number, y: number): boolean {
  const dx = Math.abs(x - BASKET_X);
  const dy = y - BASKET_Y;
  
  // Ellipse equation: if > 1, point is outside the arc
  const normalizedDistance = (dx / ARC_X_RADIUS) ** 2 + (dy / ARC_Y_RADIUS) ** 2;
  
  return normalizedDistance > 1;
}

/**
 * Check if coordinates are in left corner 3 zone
 * Corners are straight vertical lines, not part of the arc
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
 * Check if coordinates are inside the paint/key area
 */
function isInPaint(x: number, y: number): boolean {
  return x >= PAINT_LEFT && x <= PAINT_RIGHT && y <= PAINT_BOTTOM;
}

/**
 * Classify which 3-point zone based on position
 */
function classify3PointZone(x: number, y: number): ZoneDetectionResult {
  // Top of key (center)
  if (x >= 35 && x <= 65) {
    return createResult('top_3', 'high');
  }
  
  // Left wing
  if (x < 35) {
    return createResult('wing_3_left', 'high');
  }
  
  // Right wing
  return createResult('wing_3_right', 'high');
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
