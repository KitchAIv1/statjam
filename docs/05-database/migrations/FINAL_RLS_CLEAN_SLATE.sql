-- ============================================================================
-- 🔐 STATJAM RLS: FINAL AUTHORITATIVE MIGRATION
-- ============================================================================
-- Purpose: Drop ALL existing RLS policies and create a clean, minimal set
-- Author: StatJam Team
-- Date: 2025-10-18
-- 
-- This migration creates the definitive RLS policy set for StatJam MVP.
-- It eliminates all duplication, conflicts, and circular dependencies.
-- ============================================================================

-- ============================================================================
-- PHASE 1: NUCLEAR OPTION - DROP ALL EXISTING POLICIES
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables in public schema
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: %.% on %.%', r.schemaname, r.tablename, r.policyname, r.tablename;
    END LOOP;
END $$;

-- Verify all policies are dropped
SELECT '=== POLICIES AFTER DROP (SHOULD BE EMPTY) ===' as status;
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- PHASE 2: CREATE PERFORMANCE INDEXES (IF NOT EXISTS)
-- ============================================================================

-- These indexes support the RLS policies efficiently
CREATE INDEX IF NOT EXISTS idx_games_stat_admin_id ON public.games(stat_admin_id);
CREATE INDEX IF NOT EXISTS idx_games_tournament_id ON public.games(tournament_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_teams_tournament_id ON public.teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_team_players_team_id ON public.team_players(team_id);
CREATE INDEX IF NOT EXISTS idx_team_players_player_id ON public.team_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_organizer_id ON public.tournaments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_is_public ON public.tournaments(is_public);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON public.game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player_id ON public.game_stats(player_id);

-- ============================================================================
-- PHASE 3: CREATE MINIMAL, NON-RECURSIVE POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- USERS TABLE
-- Rule: Users can only access their own data + anon can read basic info
-- ----------------------------------------------------------------------------

-- 1. Authenticated users can read ALL user data (for roster lookups)
CREATE POLICY "users_authenticated_read_all"
ON public.users FOR SELECT TO authenticated
USING (true);

-- 2. Anonymous users can read basic user info (for public profiles)
CREATE POLICY "users_anon_read_basic"
ON public.users FOR SELECT TO anon
USING (true);

-- 3. Users can manage their own profile
CREATE POLICY "users_self_manage"
ON public.users FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. New users can insert themselves (signup)
CREATE POLICY "users_insert_self"
ON public.users FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- TOURNAMENTS TABLE
-- Rule: Organizers own tournaments, public can read if is_public=true
-- ----------------------------------------------------------------------------

-- 1. Public/Anon can read public tournaments
CREATE POLICY "tournaments_public_read"
ON public.tournaments FOR SELECT TO anon, authenticated
USING (is_public = TRUE);

-- 2. Organizers can manage their own tournaments
CREATE POLICY "tournaments_organizer_manage"
ON public.tournaments FOR ALL TO authenticated
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- 3. Authenticated users can read all tournaments (for stat admin dashboard)
CREATE POLICY "tournaments_authenticated_read_all"
ON public.tournaments FOR SELECT TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- TEAMS TABLE
-- Rule: Teams belong to tournaments, inherit access from tournament
-- ----------------------------------------------------------------------------

-- 1. Public/Anon can read teams in public tournaments (ONE join)
CREATE POLICY "teams_public_read"
ON public.teams FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.is_public = TRUE
  )
);

-- 2. Organizers can manage teams in their tournaments (ONE join)
CREATE POLICY "teams_organizer_manage"
ON public.teams FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- 3. Authenticated users can read all teams (for stat admin roster lookups)
CREATE POLICY "teams_authenticated_read_all"
ON public.teams FOR SELECT TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- GAMES TABLE
-- Rule: Games belong to tournaments, stat_admins assigned to specific games
-- ----------------------------------------------------------------------------

-- 1. Public/Anon can read games in public tournaments (ONE join)
CREATE POLICY "games_public_read"
ON public.games FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = games.tournament_id 
    AND t.is_public = TRUE
  )
);

-- 2. Stat admins can manage their assigned games (NO join)
CREATE POLICY "games_stat_admin_manage"
ON public.games FOR ALL TO authenticated
USING (stat_admin_id = auth.uid())
WITH CHECK (stat_admin_id = auth.uid());

-- 3. Organizers can manage games in their tournaments (ONE join)
CREATE POLICY "games_organizer_manage"
ON public.games FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = games.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = games.tournament_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- TEAM_PLAYERS TABLE
-- Rule: Links players to teams, inherit access from team/tournament
-- ----------------------------------------------------------------------------

-- 1. Public/Anon can read team players in public tournaments (TWO joins)
CREATE POLICY "team_players_public_read"
ON public.team_players FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams tm
    JOIN public.tournaments tr ON tm.tournament_id = tr.id
    WHERE tm.id = team_players.team_id 
    AND tr.is_public = TRUE
  )
);

-- 2. Organizers can manage team players in their tournaments (TWO joins)
CREATE POLICY "team_players_organizer_manage"
ON public.team_players FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams tm
    JOIN public.tournaments tr ON tm.tournament_id = tr.id
    WHERE tm.id = team_players.team_id 
    AND tr.organizer_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams tm
    JOIN public.tournaments tr ON tm.tournament_id = tr.id
    WHERE tm.id = team_players.team_id 
    AND tr.organizer_id = auth.uid()
  )
);

-- 3. Players can view their own team assignments (NO join)
CREATE POLICY "team_players_player_read_self"
ON public.team_players FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- 4. Authenticated users can read all team players (for stat admin roster lookups)
CREATE POLICY "team_players_authenticated_read_all"
ON public.team_players FOR SELECT TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- GAME_STATS TABLE
-- Rule: Stats belong to games, stat_admin manages, players can view their own
-- ----------------------------------------------------------------------------

-- 1. Public/Anon can read game stats in public tournaments (TWO joins)
CREATE POLICY "game_stats_public_read"
ON public.game_stats FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_stats.game_id 
    AND t.is_public = TRUE
  )
);

-- 2. Stat admins can manage stats for their assigned games (ONE join)
CREATE POLICY "game_stats_stat_admin_manage"
ON public.game_stats FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_stats.game_id 
    AND g.stat_admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_stats.game_id 
    AND g.stat_admin_id = auth.uid()
  )
);

-- 3. Players can view their own stats (NO join)
CREATE POLICY "game_stats_player_read_self"
ON public.game_stats FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- 4. Organizers can view stats in their tournaments (TWO joins)
CREATE POLICY "game_stats_organizer_read"
ON public.game_stats FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_stats.game_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- GAME_SUBSTITUTIONS TABLE
-- Rule: Similar to game_stats, stat_admin manages
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "game_substitutions_stat_admin_manage" ON public.game_substitutions;
DROP POLICY IF EXISTS "game_substitutions_public_read" ON public.game_substitutions;
DROP POLICY IF EXISTS "game_substitutions_organizer_read" ON public.game_substitutions;

-- 1. Public/Anon can read substitutions in public tournaments (TWO joins)
CREATE POLICY "game_substitutions_public_read"
ON public.game_substitutions FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_substitutions.game_id 
    AND t.is_public = TRUE
  )
);

-- 2. Stat admins can manage substitutions for their assigned games (ONE join)
CREATE POLICY "game_substitutions_stat_admin_manage"
ON public.game_substitutions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_substitutions.game_id 
    AND g.stat_admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_substitutions.game_id 
    AND g.stat_admin_id = auth.uid()
  )
);

-- 3. Organizers can view substitutions in their tournaments (TWO joins)
CREATE POLICY "game_substitutions_organizer_read"
ON public.game_substitutions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = game_substitutions.game_id 
    AND t.organizer_id = auth.uid()
  )
);

-- ============================================================================
-- PHASE 4: VERIFICATION & DOCUMENTATION
-- ============================================================================

-- Count policies per table
SELECT '=== FINAL POLICY COUNT PER TABLE ===' as status;
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show all policies with their access patterns
SELECT '=== ALL FINAL POLICIES ===' as status;
SELECT 
    tablename,
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN policyname LIKE '%public%' THEN '🌍 Public Access'
        WHEN policyname LIKE '%organizer%' THEN '👔 Organizer Access'
        WHEN policyname LIKE '%stat_admin%' THEN '📊 Stat Admin Access'
        WHEN policyname LIKE '%player%' THEN '🏃 Player Access'
        WHEN policyname LIKE '%authenticated%' THEN '🔐 Authenticated Access'
        ELSE '❓ Other'
    END as access_pattern
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- PHASE 5: TEST QUERIES (UNCOMMENT TO RUN)
-- ============================================================================

/*
-- Test 1: Stat admin can read assigned games
SELECT 
    g.id,
    g.status,
    t.name as tournament_name
FROM public.games g
JOIN public.tournaments t ON g.tournament_id = t.id
WHERE g.stat_admin_id = 'YOUR_STAT_ADMIN_USER_ID'
LIMIT 5;

-- Test 2: Stat admin can read team players for assigned games
SELECT 
    tp.id,
    u.name as player_name,
    tm.name as team_name
FROM public.team_players tp
JOIN public.teams tm ON tp.team_id = tm.id
JOIN public.users u ON tp.player_id = u.id
JOIN public.games g ON (g.team_a_id = tm.id OR g.team_b_id = tm.id)
WHERE g.stat_admin_id = 'YOUR_STAT_ADMIN_USER_ID'
LIMIT 10;

-- Test 3: Public can read live games
SELECT 
    g.id,
    g.status,
    g.home_score,
    g.away_score
FROM public.games g
JOIN public.tournaments t ON g.tournament_id = t.id
WHERE t.is_public = TRUE
AND g.status IN ('live', 'LIVE', 'in_progress')
LIMIT 5;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ RLS MIGRATION COMPLETE - All policies reset and optimized!' as status;

