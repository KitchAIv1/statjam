-- ============================================================================
-- INVESTIGATE PLAYER SEARCH ISSUE
-- ============================================================================
-- Purpose: Debug why player "Red Jameson Jr." (0e0530d5-ca39-466c-8f66-e3e08c69b4f9)
--          is not appearing in team roster selection
-- ============================================================================

-- STEP 1: Check if player exists in users table and their role
-- ============================================================================
SELECT 
    id,
    email,
    name,
    role,
    premium_status,
    country,
    created_at,
    profile_photo_url
FROM users
WHERE id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';

-- Expected: Should return 1 row with role = 'player'
-- If no rows: Player doesn't exist in users table (CRITICAL ISSUE)
-- If role != 'player': Player won't appear in search (NEEDS FIX)


-- STEP 2: Check if player is already assigned to any team
-- ============================================================================
SELECT 
    tp.id as team_player_id,
    tp.team_id,
    tp.player_id,
    t.name as team_name,
    t.tournament_id,
    tr.name as tournament_name
FROM team_players tp
LEFT JOIN teams t ON tp.team_id = t.id
LEFT JOIN tournaments tr ON t.tournament_id = tr.id
WHERE tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';

-- Expected: Should return 0 rows (player not on any team)
-- If rows exist: Player is already assigned to a team, which excludes them from search


-- STEP 3: Check all players with role='player' (what search query returns)
-- ============================================================================
SELECT 
    COUNT(*) as total_players_with_role_player
FROM users
WHERE role = 'player';

-- This shows how many players should appear in search


-- STEP 4: Search for player by name/email (simulating the search query)
-- ============================================================================
SELECT 
    id,
    name,
    email,
    role,
    premium_status
FROM users
WHERE role = 'player'
AND (name ILIKE '%Red%' OR name ILIKE '%Jameson%' OR email ILIKE '%red%');

-- Expected: Should return the player if they exist with role='player'
-- If no rows: Player either doesn't exist OR role is not 'player'


-- STEP 5: Check if player exists in auth.users (Supabase Auth)
-- ============================================================================
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';

-- Expected: Should return 1 row (player exists in auth)
-- If no rows: Player doesn't exist in auth system (CRITICAL ISSUE)


-- STEP 6: Check for any custom_player records (if applicable)
-- ============================================================================
SELECT 
    id,
    name,
    team_id,
    tournament_id
FROM custom_players
WHERE id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
OR name ILIKE '%Red%Jameson%';

-- Expected: Should return 0 rows (this is a regular player, not custom)
-- If rows exist: Player might be a custom player (different table)


-- STEP 7: Verify RLS policies allow reading this player
-- ============================================================================
-- Check if RLS is enabled and what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

-- This shows RLS policies that might be blocking access


-- ============================================================================
-- DIAGNOSIS GUIDE
-- ============================================================================
-- 
-- ISSUE 1: Player doesn't exist in users table
--   SOLUTION: Player needs to be created in users table with role='player'
--   SQL FIX:
--   INSERT INTO users (id, email, name, role, country, premium_status)
--   VALUES (
--     '0e0530d5-ca39-466c-8f66-e3e08c69b4f9',
--     'player@example.com',  -- Replace with actual email
--     'Red Jameson Jr.',
--     'player',
--     'CA',
--     false
--   );
--
-- ISSUE 2: Player exists but role != 'player'
--   SOLUTION: Update role to 'player'
--   SQL FIX:
--   UPDATE users
--   SET role = 'player'
--   WHERE id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';
--
-- ISSUE 3: Player is already assigned to a team
--   SOLUTION: Remove from team_players if they shouldn't be on that team
--   SQL FIX (if needed):
--   DELETE FROM team_players
--   WHERE player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9';
--
-- ISSUE 4: RLS policy blocking access
--   SOLUTION: Check RLS policies and ensure organizers can read players
--   Verify policy exists:
--   CREATE POLICY IF NOT EXISTS "Organizers can read all players"
--   ON users FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM users u
--       WHERE u.id = auth.uid()
--       AND u.role = 'organizer'
--     )
--     OR role = 'player'
--   );
--
-- ============================================================================

