-- ============================================================================
-- SUBSTITUTIONS VIDEO TIMESTAMP MIGRATION
-- ============================================================================
-- Purpose: Add video_timestamp_ms to game_substitutions for video tracking
-- This allows substitutions to be synced with video playback
-- ============================================================================

-- Add video_timestamp_ms column to game_substitutions
ALTER TABLE game_substitutions 
ADD COLUMN IF NOT EXISTS video_timestamp_ms INTEGER DEFAULT NULL;

-- Index for querying substitutions by video timestamp
CREATE INDEX IF NOT EXISTS idx_game_substitutions_video_timestamp 
ON game_substitutions(game_id, video_timestamp_ms) 
WHERE video_timestamp_ms IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN game_substitutions.video_timestamp_ms IS 'Video milliseconds when substitution occurred (for video tracking)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 029 complete: Added video_timestamp_ms to game_substitutions';
END $$;

