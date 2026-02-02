-- ============================================================================
-- MIGRATION 035: Add stream_ended column to games table
-- ============================================================================
-- Purpose: Track when a live stream has ended (separate from game completion)
-- This allows Media Tab to display replays without requiring game status = 'completed'
-- Date: February 2026
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: Add stream_ended column
-- ----------------------------------------------------------------------------

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS stream_ended BOOLEAN DEFAULT FALSE;

-- Add helpful comment
COMMENT ON COLUMN games.stream_ended IS 'True when live stream has ended. Used by Media Tab to show replays without requiring game completion.';

-- ----------------------------------------------------------------------------
-- STEP 2: Create index for Media Tab queries
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_games_stream_ended 
ON games(stream_ended) 
WHERE stream_ended = true;

-- ----------------------------------------------------------------------------
-- STEP 3: Verify the change
-- ----------------------------------------------------------------------------

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'stream_ended';

COMMIT;

-- ============================================================================
-- EXPECTED RESULT:
-- column_name: stream_ended
-- data_type: boolean
-- column_default: false
-- is_nullable: YES
-- ============================================================================
