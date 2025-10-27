-- ============================================================================
-- QUICK FIX: RLS Infinite Recursion - Run This NOW
-- ============================================================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it
-- ============================================================================

-- Drop ALL existing policies on users table
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
DROP POLICY IF EXISTS "users_self_manage" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_authenticated_read_all" ON users;
DROP POLICY IF EXISTS "users_anon_read_basic" ON users;
DROP POLICY IF EXISTS "users_allow_all_authenticated" ON users;
DROP POLICY IF EXISTS "users_allow_anon_basic" ON users;
DROP POLICY IF EXISTS "users_organizer_team_players" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players" ON users;
DROP POLICY IF EXISTS "users_public_player_names" ON users;
DROP POLICY IF EXISTS "users_self_access" ON users;
DROP POLICY IF EXISTS "users_insert_new" ON users;
DROP POLICY IF EXISTS "users_authenticated_basic" ON users;
DROP POLICY IF EXISTS "users_signup_insert" ON users;
DROP POLICY IF EXISTS "users_coach_team_players" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create 4 simple, non-recursive policies

-- Policy 1: Self-access (most important for auth)
CREATE POLICY "users_self_access"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Allow authenticated users to see other users (for rosters)
CREATE POLICY "users_authenticated_read"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow anonymous users to see basic player info
CREATE POLICY "users_anon_read"
ON users
FOR SELECT
TO anon
USING (role IN ('player', 'organizer', 'stat_admin', 'coach'));

-- Policy 4: Allow INSERT during signup (handled by trigger)
CREATE POLICY "users_signup_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- DONE! Now try logging in as coach3@gmail.com
-- ============================================================================

