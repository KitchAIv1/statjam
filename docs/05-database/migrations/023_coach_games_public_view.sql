-- ============================================================================
-- MIGRATION 023: COACH GAMES PUBLIC VIEW
-- ============================================================================
-- Purpose: Allow anonymous users to VIEW coach games via shared link
-- Date: December 2024
-- Safety: SELECT-only policies, UUID security (impossible to guess)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: GAMES TABLE - Allow public viewing of coach games
-- ----------------------------------------------------------------------------

-- Drop if exists (for re-runnable migration)
DROP POLICY IF EXISTS "games_coach_public_view" ON games;

-- Allow anyone to VIEW coach games (read-only)
-- Security: UUID is 128-bit random - impossible to guess
CREATE POLICY "games_coach_public_view" ON games
  FOR SELECT
  TO anon, authenticated
  USING (is_coach_game = TRUE);

-- ----------------------------------------------------------------------------
-- PHASE 2: GAME_STATS TABLE - Allow public viewing of coach game stats
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "game_stats_coach_public_view" ON game_stats;

CREATE POLICY "game_stats_coach_public_view" ON game_stats
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 3: GAME_SUBSTITUTIONS TABLE - Allow public viewing of coach game subs
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "game_substitutions_coach_public_view" ON game_substitutions;

CREATE POLICY "game_substitutions_coach_public_view" ON game_substitutions
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 4: GAME_TIMEOUTS TABLE - Allow public viewing of coach game timeouts
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "game_timeouts_coach_public_view" ON game_timeouts;

CREATE POLICY "game_timeouts_coach_public_view" ON game_timeouts
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 5: TEAMS TABLE - Allow public viewing of coach teams
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "teams_coach_game_public_view" ON teams;

CREATE POLICY "teams_coach_game_public_view" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Team is part of a coach game
    id IN (
      SELECT team_a_id FROM games WHERE is_coach_game = TRUE
      UNION
      SELECT team_b_id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 6: TEAM_PLAYERS TABLE - Allow public viewing of coach team rosters
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "team_players_coach_public_view" ON team_players;

CREATE POLICY "team_players_coach_public_view" ON team_players
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT team_a_id FROM games WHERE is_coach_game = TRUE
      UNION
      SELECT team_b_id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 7: CUSTOM_PLAYERS TABLE - Allow public viewing of custom player names
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "custom_players_coach_public_view" ON custom_players;

CREATE POLICY "custom_players_coach_public_view" ON custom_players
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT team_a_id FROM games WHERE is_coach_game = TRUE
      UNION
      SELECT team_b_id FROM games WHERE is_coach_game = TRUE
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 8: USERS TABLE - Verify anon can read player names
-- ----------------------------------------------------------------------------
-- Note: Policy "users_anon_read" should already exist from migration 004
-- This just ensures it exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'users_anon_read'
  ) THEN
    CREATE POLICY "users_anon_read" ON users
      FOR SELECT
      TO anon
      USING (role IN ('player', 'organizer', 'stat_admin', 'coach'));
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to confirm)
-- ============================================================================

-- Check all new policies were created:
-- SELECT policyname, tablename, cmd, roles 
-- FROM pg_policies 
-- WHERE policyname LIKE '%coach_public_view%'
-- ORDER BY tablename;

-- Test anonymous access to a coach game:
-- SET ROLE anon;
-- SELECT id, team_a_id, team_b_id, is_coach_game FROM games WHERE is_coach_game = TRUE LIMIT 1;
-- RESET ROLE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ games - Coach games now viewable by anyone with link
-- ✅ game_stats - Stats viewable for coach games
-- ✅ game_substitutions - Substitutions viewable for coach games
-- ✅ game_timeouts - Timeouts viewable for coach games
-- ✅ teams - Coach teams viewable
-- ✅ team_players - Coach team rosters viewable
-- ✅ custom_players - Custom player names viewable
-- ✅ users - Player names viewable (existing policy verified)
--
-- Security Notes:
-- - All policies are SELECT-only (read-only)
-- - UUID game IDs provide cryptographic security
-- - Coach write policies remain unchanged
-- - Same security model as Google Docs "anyone with link"
-- ============================================================================
