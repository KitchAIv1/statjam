-- ============================================================================
-- MIGRATION 013: Fix Timeout Default from 7 to 5
-- ============================================================================
-- Purpose: Change default timeout value from 7 to 5 to match frontend
-- Date: November 15, 2025
-- Backend Team: Please execute this migration in Supabase
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Fix all existing games with incorrect timeout counts
-- ----------------------------------------------------------------------------
-- Update all games to have correct timeout counts based on actual usage
UPDATE games
SET 
  team_a_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_a_id
    ), 5)  -- Default to 5 if no timeouts used
  )),
  team_b_timeouts_remaining = GREATEST(0, LEAST(5, 
    COALESCE((
      SELECT 5 - COUNT(*)
      FROM game_timeouts
      WHERE game_timeouts.game_id = games.id 
        AND game_timeouts.team_id = games.team_b_id
    ), 5)  -- Default to 5 if no timeouts used
  ))
WHERE status IN ('in_progress', 'completed', 'scheduled', 'overtime');

-- ----------------------------------------------------------------------------
-- STEP 2: Change default value from 7 to 5
-- ----------------------------------------------------------------------------
ALTER TABLE games 
  ALTER COLUMN team_a_timeouts_remaining SET DEFAULT 5,
  ALTER COLUMN team_b_timeouts_remaining SET DEFAULT 5;

-- ----------------------------------------------------------------------------
-- STEP 3: Add constraint to prevent values > 5
-- ----------------------------------------------------------------------------
-- This ensures no future games can have more than 5 timeouts
ALTER TABLE games
  DROP CONSTRAINT IF EXISTS check_timeouts_max_5;

ALTER TABLE games
  ADD CONSTRAINT check_timeouts_max_5 CHECK (
    (team_a_timeouts_remaining IS NULL OR team_a_timeouts_remaining <= 5)
    AND (team_b_timeouts_remaining IS NULL OR team_b_timeouts_remaining <= 5)
    AND (team_a_timeouts_remaining IS NULL OR team_a_timeouts_remaining >= 0)
    AND (team_b_timeouts_remaining IS NULL OR team_b_timeouts_remaining >= 0)
  );

-- ----------------------------------------------------------------------------
-- STEP 4: Verify the changes
-- ----------------------------------------------------------------------------
-- Check default values
SELECT 
  column_name,
  column_default,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN ('team_a_timeouts_remaining', 'team_b_timeouts_remaining');

-- Check constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.games'::regclass
  AND conname = 'check_timeouts_max_5';

-- Verify all games have correct values
SELECT 
  COUNT(*) as total_games,
  COUNT(CASE WHEN team_a_timeouts_remaining > 5 OR team_b_timeouts_remaining > 5 THEN 1 END) as games_with_invalid_timeouts,
  COUNT(CASE WHEN team_a_timeouts_remaining <= 5 AND team_b_timeouts_remaining <= 5 THEN 1 END) as games_with_valid_timeouts
FROM games
WHERE status IN ('in_progress', 'completed', 'scheduled', 'overtime');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

