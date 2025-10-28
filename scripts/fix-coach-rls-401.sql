-- ============================================================================
-- EMERGENCY FIX: Coach 401 Errors in Player Management
-- ============================================================================
-- Issue: Coaches getting 401 errors when accessing team_players, custom_players, users
-- Root Cause: Missing or incorrect RLS policies after our RLS fixes
-- ============================================================================

-- 1. CHECK CURRENT RLS STATUS
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('team_players', 'custom_players', 'users')
  AND schemaname = 'public';

-- 2. CHECK EXISTING POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('team_players', 'custom_players', 'users')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. ENSURE CUSTOM_PLAYERS TABLE EXISTS AND HAS RLS
-- Enable RLS on custom_players if not already enabled
ALTER TABLE custom_players ENABLE ROW LEVEL SECURITY;

-- 4. FIX CUSTOM_PLAYERS POLICIES (if missing)
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "custom_players_coach_access" ON custom_players;
DROP POLICY IF EXISTS "custom_players_public_read" ON custom_players;
DROP POLICY IF EXISTS "custom_players_stat_admin_access" ON custom_players;

-- Create coach access policy for custom_players
CREATE POLICY "custom_players_coach_access" ON custom_players
  FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Create public read policy for custom_players
CREATE POLICY "custom_players_public_read" ON custom_players
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = custom_players.team_id 
      AND t.visibility = 'public'
    )
  );

-- Create stat admin policy for custom_players
CREATE POLICY "custom_players_stat_admin_access" ON custom_players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE (g.team_a_id = custom_players.team_id OR g.team_b_id = custom_players.team_id)
      AND g.stat_admin_id = auth.uid()
    )
  );

-- 5. FIX USERS TABLE POLICIES FOR COACH ACCESS
-- Coaches need to search for players to add to their teams
DROP POLICY IF EXISTS "users_coach_search_players" ON users;

CREATE POLICY "users_coach_search_players" ON users
  FOR SELECT TO authenticated
  USING (
    -- Coaches can search for players to add to their teams
    (auth.jwt() ->> 'role' = 'coach' AND role = 'player') OR
    -- Existing policies still apply
    id = auth.uid() OR
    role IN ('player', 'organizer', 'stat_admin')
  );

-- 6. VERIFY TEAM_PLAYERS POLICIES ARE CORRECT
-- Check if coach policy exists
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'team_players' 
  AND policyname = 'team_players_coach_full_access';

-- 7. TEST QUERIES (run these to verify fix)
-- These should work for a coach user:
-- SELECT * FROM team_players WHERE team_id IN (SELECT id FROM teams WHERE coach_id = auth.uid());
-- SELECT * FROM custom_players WHERE coach_id = auth.uid();
-- SELECT id, name, email FROM users WHERE role = 'player' LIMIT 10;

COMMIT;
