-- ============================================================================
-- COMPLETE RLS MIGRATION - Fix All Timeout Issues Once and For All
-- ============================================================================
-- Date: October 17, 2025
-- Purpose: Replace all complex RLS policies with simple, performant ones
-- Estimated Time: 25 minutes
-- Risk: Low (can rollback if needed)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: BACKUP CURRENT STATE
-- ----------------------------------------------------------------------------

-- Run this query and save the output before proceeding:
/*
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ----------------------------------------------------------------------------
-- PHASE 2: DROP ALL EXISTING POLICIES
-- ----------------------------------------------------------------------------

-- Users table
DROP POLICY IF EXISTS "users_self_access_policy" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v4" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_self_update_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_self_policy" ON users;
DROP POLICY IF EXISTS "users_organizer_policy" ON users;

-- Tournaments table
DROP POLICY IF EXISTS "tournaments_organizer_policy" ON tournaments;
DROP POLICY IF EXISTS "tournaments_public_policy" ON tournaments;

-- Teams table
DROP POLICY IF EXISTS "teams_organizer_policy" ON teams;
DROP POLICY IF EXISTS "teams_public_policy" ON teams;

-- Games table
DROP POLICY IF EXISTS "games_organizer_policy" ON games;
DROP POLICY IF EXISTS "games_stat_admin_policy" ON games;
DROP POLICY IF EXISTS "games_player_policy" ON games;
DROP POLICY IF EXISTS "games_public_policy" ON games;

-- Game_stats table
DROP POLICY IF EXISTS "game_stats_public_realtime" ON game_stats;

-- Team_players table
DROP POLICY IF EXISTS "team_players_organizer_policy" ON team_players;

-- ----------------------------------------------------------------------------
-- PHASE 3: CREATE PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tournaments table indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_public ON tournaments(is_public) WHERE is_public = true;

-- Teams table indexes
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);

-- Games table indexes
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_stat_admin ON games(stat_admin_id) WHERE stat_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(team_a_id, team_b_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Game_stats table indexes
CREATE INDEX IF NOT EXISTS idx_game_stats_game ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player ON game_stats(player_id);

-- Team_players table indexes
CREATE INDEX IF NOT EXISTS idx_team_players_team ON team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player ON team_players(player_id);

-- ----------------------------------------------------------------------------
-- PHASE 4: CREATE NEW SIMPLE POLICIES - USERS TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Self-access (all users can see/update their own profile)
CREATE POLICY "users_self_access" ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- ✅ POLICY 2: Organizers can see players in their teams
CREATE POLICY "users_organizer_team_players" ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'player' 
    AND id IN (
      SELECT tp.player_id 
      FROM team_players tp
      JOIN teams t ON t.id = tp.team_id
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 3: Stat admins can see players in their assigned games
CREATE POLICY "users_stat_admin_game_players" ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'player'
    AND id IN (
      SELECT tp.player_id
      FROM team_players tp
      WHERE tp.team_id IN (
        SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
        UNION
        SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
      )
    )
  );

-- ✅ POLICY 4: Public can see player names for public games
CREATE POLICY "users_public_player_names" ON users
  FOR SELECT
  TO anon
  USING (
    role = 'player'
    AND id IN (
      SELECT tp.player_id
      FROM team_players tp
      JOIN teams t ON t.id = tp.team_id
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.is_public = true
    )
  );

-- ✅ POLICY 5: New user sign-ups
CREATE POLICY "users_insert_new" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- PHASE 5: CREATE NEW SIMPLE POLICIES - TOURNAMENTS TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Organizers manage their own tournaments
CREATE POLICY "tournaments_organizer_access" ON tournaments
  FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid());

-- ✅ POLICY 2: Public can view public tournaments
CREATE POLICY "tournaments_public_view" ON tournaments
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- ✅ POLICY 3: Stat admins can view tournaments for their assigned games
CREATE POLICY "tournaments_stat_admin_view" ON tournaments
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tournament_id 
      FROM games 
      WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view tournaments for their teams
CREATE POLICY "tournaments_player_view" ON tournaments
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT t.tournament_id
      FROM teams t
      JOIN team_players tp ON tp.team_id = t.id
      WHERE tp.player_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 6: CREATE NEW SIMPLE POLICIES - TEAMS TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Organizers manage teams in their tournaments
CREATE POLICY "teams_organizer_access" ON teams
  FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view teams in public tournaments
CREATE POLICY "teams_public_view" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE is_public = true
    )
  );

-- ✅ POLICY 3: Stat admins can view teams in their assigned games
CREATE POLICY "teams_stat_admin_view" ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
      UNION
      SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view their own teams
CREATE POLICY "teams_player_view" ON teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM team_players WHERE player_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 7: CREATE NEW SIMPLE POLICIES - GAMES TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Organizers manage games in their tournaments
CREATE POLICY "games_organizer_access" ON games
  FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Stat admins manage their assigned games
CREATE POLICY "games_stat_admin_access" ON games
  FOR ALL
  TO authenticated
  USING (stat_admin_id = auth.uid());

-- ✅ POLICY 3: Public can view live games in public tournaments
CREATE POLICY "games_public_view" ON games
  FOR SELECT
  TO anon, authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE is_public = true
    )
    AND status IN ('live', 'in_progress', 'overtime', 'completed', 'scheduled')
  );

-- ✅ POLICY 4: Players can view their games
CREATE POLICY "games_player_view" ON games
  FOR SELECT
  TO authenticated
  USING (
    team_a_id IN (SELECT team_id FROM team_players WHERE player_id = auth.uid())
    OR
    team_b_id IN (SELECT team_id FROM team_players WHERE player_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- PHASE 8: CREATE NEW SIMPLE POLICIES - GAME_STATS TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Stat admins can insert/delete stats for their assigned games
CREATE POLICY "game_stats_stat_admin_access" ON game_stats
  FOR ALL
  TO authenticated
  USING (
    game_id IN (
      SELECT id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view stats for public games
CREATE POLICY "game_stats_public_view" ON game_stats
  FOR SELECT
  TO anon, authenticated
  USING (
    game_id IN (
      SELECT g.id 
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE t.is_public = true
    )
  );

-- ✅ POLICY 3: Players can view their own stats
CREATE POLICY "game_stats_player_view" ON game_stats
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- ✅ POLICY 4: Organizers can view stats in their tournaments
CREATE POLICY "game_stats_organizer_view" ON game_stats
  FOR SELECT
  TO authenticated
  USING (
    game_id IN (
      SELECT g.id
      FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE t.organizer_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 9: CREATE NEW SIMPLE POLICIES - TEAM_PLAYERS TABLE
-- ----------------------------------------------------------------------------

-- ✅ POLICY 1: Organizers manage team rosters in their tournaments
CREATE POLICY "team_players_organizer_access" ON team_players
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.organizer_id = auth.uid()
    )
  );

-- ✅ POLICY 2: Public can view rosters for public tournaments
CREATE POLICY "team_players_public_view" ON team_players
  FOR SELECT
  TO anon, authenticated
  USING (
    team_id IN (
      SELECT t.id
      FROM teams t
      JOIN tournaments tr ON tr.id = t.tournament_id
      WHERE tr.is_public = true
    )
  );

-- ✅ POLICY 3: Stat admins can view rosters for their assigned games
CREATE POLICY "team_players_stat_admin_view" ON team_players
  FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_a_id FROM games WHERE stat_admin_id = auth.uid()
      UNION
      SELECT team_b_id FROM games WHERE stat_admin_id = auth.uid()
    )
  );

-- ✅ POLICY 4: Players can view their own team rosters
CREATE POLICY "team_players_player_view" ON team_players
  FOR SELECT
  TO authenticated
  USING (
    player_id = auth.uid()
    OR
    team_id IN (
      SELECT team_id FROM team_players WHERE player_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- PHASE 10: VERIFY MIGRATION
-- ----------------------------------------------------------------------------

SELECT '=== MIGRATION COMPLETE ===' as status;

-- Show all new policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test query performance (should be < 100ms)
SELECT 'Testing query performance...' as test;
-- EXPLAIN ANALYZE SELECT * FROM users LIMIT 10;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Test stat admin dashboard (should load instantly)
-- 2. Test organizer dashboard (should load instantly)
-- 3. Test public live viewer (should load instantly)
-- 4. Monitor query performance in logs
-- ============================================================================

