-- ============================================================================
-- MIGRATION 007: Enhanced Timeout UX
-- ============================================================================
-- Purpose: Add timeout type tracking and active timeout state management
-- Date: October 19, 2025
-- Backend Team: Please execute this migration in Supabase
-- Dependencies: Migration 006 (team_fouls_timeouts) must be completed first
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Enhance game_timeouts table with timeout type and duration
-- ----------------------------------------------------------------------------

ALTER TABLE game_timeouts 
ADD COLUMN IF NOT EXISTS timeout_type TEXT CHECK (timeout_type IN ('full', '30_second')) DEFAULT 'full',
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 60;

COMMENT ON COLUMN game_timeouts.timeout_type IS 'Type of timeout: full (60s) or 30_second (30s)';
COMMENT ON COLUMN game_timeouts.duration_seconds IS 'Duration of timeout in seconds';

-- ----------------------------------------------------------------------------
-- STEP 2: Add active timeout tracking to games table
-- ----------------------------------------------------------------------------

ALTER TABLE games
ADD COLUMN IF NOT EXISTS timeout_in_progress BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timeout_team_id UUID REFERENCES teams(id),
ADD COLUMN IF NOT EXISTS timeout_started_at TIMESTAMPTZ;

COMMENT ON COLUMN games.timeout_in_progress IS 'Flag indicating if a timeout is currently active';
COMMENT ON COLUMN games.timeout_team_id IS 'Team ID that called the active timeout';
COMMENT ON COLUMN games.timeout_started_at IS 'Timestamp when the current timeout started';

-- Create index for faster timeout state queries
CREATE INDEX IF NOT EXISTS idx_games_timeout_in_progress ON games(timeout_in_progress) WHERE timeout_in_progress = true;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Run after migration)
-- ----------------------------------------------------------------------------

-- Check if new columns were added to game_timeouts
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'game_timeouts'
AND column_name IN ('timeout_type', 'duration_seconds');

-- Check if new columns were added to games
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name IN ('timeout_in_progress', 'timeout_team_id', 'timeout_started_at');

-- Check if index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'games'
AND indexname = 'idx_games_timeout_in_progress';

-- ----------------------------------------------------------------------------
-- ROLLBACK (If needed)
-- ----------------------------------------------------------------------------

-- To rollback this migration, run:
/*
DROP INDEX IF EXISTS idx_games_timeout_in_progress;
ALTER TABLE games DROP COLUMN IF EXISTS timeout_in_progress;
ALTER TABLE games DROP COLUMN IF EXISTS timeout_team_id;
ALTER TABLE games DROP COLUMN IF EXISTS timeout_started_at;
ALTER TABLE game_timeouts DROP COLUMN IF EXISTS timeout_type;
ALTER TABLE game_timeouts DROP COLUMN IF EXISTS duration_seconds;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

