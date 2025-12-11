-- ============================================================================
-- Migration 022: Shot Location Tracking
-- ============================================================================
-- 
-- Purpose: Add shot location data to game_stats for court-based shot tracking
-- Feature: Shot Tracker Component (COACH mode initially)
-- 
-- Columns Added:
--   - shot_location_x: X coordinate (0-100, left to right)
--   - shot_location_y: Y coordinate (0-100, baseline to half-court)
--   - shot_zone: Zone identifier for quick aggregation
--
-- ============================================================================

-- Step 1: Add shot location columns
ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS shot_location_x DECIMAL(5,2) DEFAULT NULL;

ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS shot_location_y DECIMAL(5,2) DEFAULT NULL;

ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS shot_zone VARCHAR(20) DEFAULT NULL;

-- Step 2: Add constraint for valid shot zones
-- Only apply if constraint doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_shot_zone'
  ) THEN
    ALTER TABLE game_stats 
    ADD CONSTRAINT valid_shot_zone 
    CHECK (shot_zone IS NULL OR shot_zone IN (
      'paint', 
      'mid_range', 
      'corner_3_left', 
      'corner_3_right',
      'wing_3_left', 
      'wing_3_right', 
      'top_3'
    ));
  END IF;
END $$;

-- Step 3: Add constraint for coordinate ranges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_shot_coordinates'
  ) THEN
    ALTER TABLE game_stats 
    ADD CONSTRAINT valid_shot_coordinates 
    CHECK (
      (shot_location_x IS NULL AND shot_location_y IS NULL) OR
      (shot_location_x >= 0 AND shot_location_x <= 100 AND 
       shot_location_y >= 0 AND shot_location_y <= 100)
    );
  END IF;
END $$;

-- Step 4: Create index for shot chart queries
CREATE INDEX IF NOT EXISTS idx_game_stats_shot_zone 
ON game_stats(game_id, shot_zone) 
WHERE shot_zone IS NOT NULL;

-- Step 5: Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_game_stats_shot_location 
ON game_stats(game_id, shot_location_x, shot_location_y) 
WHERE shot_location_x IS NOT NULL;

-- ============================================================================
-- Verification Query (run after migration)
-- ============================================================================
-- 
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'game_stats' 
--   AND column_name IN ('shot_location_x', 'shot_location_y', 'shot_zone');
--
-- Expected: 3 rows with DECIMAL/VARCHAR types, all nullable
-- ============================================================================

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
-- 
-- ALTER TABLE game_stats DROP CONSTRAINT IF EXISTS valid_shot_zone;
-- ALTER TABLE game_stats DROP CONSTRAINT IF EXISTS valid_shot_coordinates;
-- DROP INDEX IF EXISTS idx_game_stats_shot_zone;
-- DROP INDEX IF EXISTS idx_game_stats_shot_location;
-- ALTER TABLE game_stats DROP COLUMN IF EXISTS shot_location_x;
-- ALTER TABLE game_stats DROP COLUMN IF EXISTS shot_location_y;
-- ALTER TABLE game_stats DROP COLUMN IF EXISTS shot_zone;
-- ============================================================================
