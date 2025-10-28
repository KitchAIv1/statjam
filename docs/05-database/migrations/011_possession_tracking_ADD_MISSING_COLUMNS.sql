-- ============================================================================
-- FIX: Add missing columns to game_possessions table
-- Run this if your table is missing start_time_minutes, end_time_minutes, or duration_seconds
-- ============================================================================

-- Add missing minutes columns
ALTER TABLE game_possessions 
  ADD COLUMN IF NOT EXISTS start_time_minutes INT NOT NULL DEFAULT 0 CHECK (start_time_minutes >= 0),
  ADD COLUMN IF NOT EXISTS end_time_minutes INT CHECK (end_time_minutes >= 0),
  ADD COLUMN IF NOT EXISTS duration_seconds INT;

-- Update column order (optional - for consistency)
COMMENT ON COLUMN game_possessions.start_time_minutes IS 'Start time - minutes component';
COMMENT ON COLUMN game_possessions.start_time_seconds IS 'Start time - seconds component';
COMMENT ON COLUMN game_possessions.end_time_minutes IS 'End time - minutes component';
COMMENT ON COLUMN game_possessions.end_time_seconds IS 'End time - seconds component';
COMMENT ON COLUMN game_possessions.duration_seconds IS 'Auto-calculated duration via trigger';

-- Verify columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'game_possessions' 
    AND column_name = 'duration_seconds'
  ) THEN
    RAISE NOTICE '✅ All columns added successfully';
  ELSE
    RAISE EXCEPTION '❌ duration_seconds column still missing';
  END IF;
END $$;

