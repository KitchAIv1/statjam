-- ============================================================================
-- ADD OFFICIAL TEAM FLAG MIGRATION
-- ============================================================================
-- Purpose: Add team-level flag to distinguish official games from practice
-- Date: January 5, 2025
-- Impact: Player statistics will only include games from official teams
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: Add is_official_team column to teams table
-- ----------------------------------------------------------------------------

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS is_official_team BOOLEAN DEFAULT FALSE;

-- Add helpful comment explaining the column's purpose
COMMENT ON COLUMN teams.is_official_team IS 
  'If true, games for this team count toward player statistics. 
   If false, games are practice/scrimmages visible only to coach.';

-- ----------------------------------------------------------------------------
-- STEP 2: Set existing coach teams to practice mode (safe default)
-- ----------------------------------------------------------------------------

-- Mark all existing coach teams as practice to maintain statistical integrity
UPDATE teams 
SET is_official_team = FALSE 
WHERE coach_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 3: Create index for efficient filtering
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_teams_official_status 
ON teams(is_official_team) 
WHERE coach_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 4: Update RLS function to filter by official status
-- ----------------------------------------------------------------------------

-- Create new function that checks both game_stats AND team official status
CREATE OR REPLACE FUNCTION player_has_game_stats_official(
  p_player_id uuid, 
  p_game_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM game_stats gs
    INNER JOIN games g ON g.id = gs.game_id
    LEFT JOIN teams t ON (g.team_a_id = t.id OR g.team_b_id = t.id)
    WHERE gs.player_id = p_player_id 
    AND gs.game_id = p_game_id
    AND (
      -- Tournament games (always official)
      g.is_coach_game = FALSE
      OR
      -- Coach games from official teams only
      (g.is_coach_game = TRUE AND t.is_official_team = TRUE)
    )
  );
$$;

-- ----------------------------------------------------------------------------
-- STEP 5: Update games RLS policy to use new function
-- ----------------------------------------------------------------------------

-- Drop old policy
DROP POLICY IF EXISTS "games_player_view_no_recursion" ON games;

-- Create new policy that filters by official status
CREATE POLICY "games_player_view_official_only" ON games
  FOR SELECT
  TO authenticated
  USING (
    player_has_game_stats_official(auth.uid(), id)
  );

-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------

-- Verify column was added
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'teams' 
AND column_name = 'is_official_team';

-- Verify existing teams are set to practice
SELECT 
  COUNT(*) as coach_teams_count,
  SUM(CASE WHEN is_official_team = TRUE THEN 1 ELSE 0 END) as official_count,
  SUM(CASE WHEN is_official_team = FALSE THEN 1 ELSE 0 END) as practice_count
FROM teams
WHERE coach_id IS NOT NULL;

-- Verify index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'teams'
AND indexname = 'idx_teams_official_status';

-- Verify function was created
SELECT 
  proname,
  prosecdef,
  provolatile
FROM pg_proc
WHERE proname = 'player_has_game_stats_official';

-- Verify policy was updated
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'games'
AND policyname = 'games_player_view_official_only';

SELECT '✅ Migration 006_add_official_team_flag completed successfully' as status;

COMMIT;

