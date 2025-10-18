-- ============================================================================
-- FIX ALL REMAINING RLS POLICIES TO PREVENT TIMEOUTS
-- This script simplifies ALL remaining policies to avoid cross-table recursion
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: DROP ALL EXISTING POLICIES ON CORE TABLES
-- ----------------------------------------------------------------------------

-- Drop all policies on 'tournaments' table
DROP POLICY IF EXISTS "tournaments_organizer_access" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_stat_admin_view" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_player_view" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_public_view" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_public_read_policy" ON public.tournaments;
DROP POLICY IF EXISTS "Organizers can manage own tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Public can view public tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_organizer_minimal" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_public_read_minimal" ON public.tournaments;

-- Drop all policies on 'games' table
DROP POLICY IF EXISTS "games_organizer_access" ON public.games;
DROP POLICY IF EXISTS "games_stat_admin_access" ON public.games;
DROP POLICY IF EXISTS "games_player_view" ON public.games;
DROP POLICY IF EXISTS "games_public_view" ON public.games;
DROP POLICY IF EXISTS "games_public_read_policy" ON public.games;
DROP POLICY IF EXISTS "Organizers can manage games" ON public.games;
DROP POLICY IF EXISTS "Stat admins can manage assigned games" ON public.games;
DROP POLICY IF EXISTS "Public can view games" ON public.games;
DROP POLICY IF EXISTS "games_public_read_minimal" ON public.games;
DROP POLICY IF EXISTS "games_stat_admin_minimal" ON public.games;
DROP POLICY IF EXISTS "games_organizer_minimal" ON public.games;

-- Drop all policies on 'team_players' table
DROP POLICY IF EXISTS "team_players_organizer_access" ON public.team_players;
DROP POLICY IF EXISTS "team_players_stat_admin_view" ON public.team_players;
DROP POLICY IF EXISTS "team_players_player_view" ON public.team_players;
DROP POLICY IF EXISTS "team_players_public_view" ON public.team_players;
DROP POLICY IF EXISTS "team_players_public_read_policy" ON public.team_players;
DROP POLICY IF EXISTS "Organizers can manage team players" ON public.team_players;
DROP POLICY IF EXISTS "Public can view team players" ON public.team_players;
DROP POLICY IF EXISTS "team_players_public_read_minimal" ON public.team_players;
DROP POLICY IF EXISTS "team_players_organizer_minimal" ON public.team_players;
DROP POLICY IF EXISTS "team_players_player_minimal" ON public.team_players;

-- Drop all policies on 'game_stats' table
DROP POLICY IF EXISTS "game_stats_stat_admin_access" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_player_view" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_public_view" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_public_read_policy" ON public.game_stats;
DROP POLICY IF EXISTS "Stat admins can manage game stats" ON public.game_stats;
DROP POLICY IF EXISTS "Public can view game stats" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_public_read_minimal" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_stat_admin_minimal" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_player_view_minimal" ON public.game_stats;

-- ----------------------------------------------------------------------------
-- PHASE 2: CREATE ULTRA-SIMPLE, NON-RECURSIVE POLICIES
-- These policies allow basic access without complex cross-table checks
-- ----------------------------------------------------------------------------

-- ============================================================================
-- TOURNAMENTS TABLE
-- ============================================================================

-- 1. Public can read public tournaments (simple boolean check)
CREATE POLICY "tournaments_public_read_ultra_simple" ON public.tournaments
FOR SELECT TO anon, authenticated
USING (is_public = TRUE);

-- 2. Organizers can manage their own tournaments (simple auth.uid() check)
CREATE POLICY "tournaments_organizer_ultra_simple" ON public.tournaments
FOR ALL TO authenticated
USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

-- 3. Authenticated users can read all tournaments (for now, to unblock stat admins)
CREATE POLICY "tournaments_authenticated_read" ON public.tournaments
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- GAMES TABLE
-- ============================================================================

-- 1. Public can read games in public tournaments (ONE simple join)
CREATE POLICY "games_public_read_ultra_simple" ON public.games
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = games.tournament_id AND t.is_public = TRUE
  )
);

-- 2. Stat admins can manage their assigned games (simple auth.uid() check)
CREATE POLICY "games_stat_admin_ultra_simple" ON public.games
FOR ALL TO authenticated
USING (stat_admin_id = auth.uid()) WITH CHECK (stat_admin_id = auth.uid());

-- 3. Organizers can manage games in their tournaments (ONE simple join)
CREATE POLICY "games_organizer_ultra_simple" ON public.games
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t 
    WHERE t.id = games.tournament_id AND t.organizer_id = auth.uid()
  )
);

-- ============================================================================
-- TEAM_PLAYERS TABLE
-- ============================================================================

-- 1. Public can read team players in public tournaments (TWO simple joins)
CREATE POLICY "team_players_public_read_ultra_simple" ON public.team_players
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams tm 
    JOIN public.tournaments tr ON tm.tournament_id = tr.id 
    WHERE tm.id = team_players.team_id AND tr.is_public = TRUE
  )
);

-- 2. Organizers can manage team players in their tournaments (TWO simple joins)
CREATE POLICY "team_players_organizer_ultra_simple" ON public.team_players
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams tm 
    JOIN public.tournaments tr ON tm.tournament_id = tr.id 
    WHERE tm.id = team_players.team_id AND tr.organizer_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams tm 
    JOIN public.tournaments tr ON tm.tournament_id = tr.id 
    WHERE tm.id = team_players.team_id AND tr.organizer_id = auth.uid()
  )
);

-- 3. Players can view their own team assignments (simple auth.uid() check)
CREATE POLICY "team_players_player_ultra_simple" ON public.team_players
FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- ============================================================================
-- GAME_STATS TABLE
-- ============================================================================

-- 1. Public can read game stats in public tournaments (TWO simple joins)
CREATE POLICY "game_stats_public_read_ultra_simple" ON public.game_stats
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g 
    JOIN public.tournaments t ON g.tournament_id = t.id 
    WHERE g.id = game_stats.game_id AND t.is_public = TRUE
  )
);

-- 2. Stat admins can manage stats for their assigned games (ONE simple join)
CREATE POLICY "game_stats_stat_admin_ultra_simple" ON public.game_stats
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = game_stats.game_id AND g.stat_admin_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = game_stats.game_id AND g.stat_admin_id = auth.uid()
  )
);

-- 3. Players can view their own stats (simple auth.uid() check)
CREATE POLICY "game_stats_player_view_ultra_simple" ON public.game_stats
FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- ----------------------------------------------------------------------------
-- VERIFICATION: Check all policies
-- ----------------------------------------------------------------------------
SELECT '=== ALL POLICIES (AFTER ULTRA-SIMPLE FIX) ===' as status;
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'teams', 'tournaments', 'games', 'team_players', 'game_stats')
ORDER BY tablename, policyname;

-- ----------------------------------------------------------------------------
-- TEST QUERY: Verify stat_admin can now read assigned games
-- Replace 'YOUR_STAT_ADMIN_ID' with an actual stat_admin user ID
-- ----------------------------------------------------------------------------
/*
SELECT 
  g.id,
  g.status,
  t.name as tournament_name
FROM public.games g
JOIN public.tournaments t ON g.tournament_id = t.id
WHERE g.stat_admin_id = 'YOUR_STAT_ADMIN_ID'
LIMIT 5;
*/

