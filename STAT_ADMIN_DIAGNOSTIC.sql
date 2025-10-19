-- ============================================================================
-- STAT ADMIN DIAGNOSTIC - Find out why players aren't showing
-- ============================================================================
-- Purpose: Debug why stat_admin can see player_ids but not user records
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Identify the stat_admin user
-- ----------------------------------------------------------------------------
SELECT '=== STAT ADMIN INFO ===' as step;
SELECT 
  id as stat_admin_id,
  email,
  role,
  name
FROM users 
WHERE role = 'stat_admin'
LIMIT 5;

-- Save one of these IDs to use in next queries
-- Example: 18358f53-c5af-429b-835d-026f904904a6 (from your logs)

-- ----------------------------------------------------------------------------
-- STEP 2: Find games assigned to this stat_admin
-- ----------------------------------------------------------------------------
SELECT '=== GAMES ASSIGNED TO STAT ADMIN ===' as step;
SELECT 
  g.id as game_id,
  g.status,
  g.team_a_id,
  g.team_b_id,
  g.stat_admin_id,
  t.name as tournament_name
FROM games g
LEFT JOIN tournaments t ON t.id = g.tournament_id
WHERE g.stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'  -- Replace with actual stat_admin_id
LIMIT 10;

-- Note the team_a_id and team_b_id values

-- ----------------------------------------------------------------------------
-- STEP 3: Check team_players for these teams
-- ----------------------------------------------------------------------------
SELECT '=== TEAM PLAYERS (FROM team_players table) ===' as step;
SELECT 
  tp.team_id,
  tp.player_id,
  t.name as team_name
FROM team_players tp
LEFT JOIN teams t ON t.id = tp.team_id
WHERE tp.team_id IN (
  SELECT team_a_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
  UNION
  SELECT team_b_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
)
ORDER BY tp.team_id, tp.player_id
LIMIT 50;

-- This should show player_ids - these are what we're trying to access

-- ----------------------------------------------------------------------------
-- STEP 4: Check if those player_ids exist in users table
-- ----------------------------------------------------------------------------
SELECT '=== CHECKING IF PLAYER IDS EXIST IN USERS TABLE ===' as step;
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.name,
  'EXISTS IN USERS' as status
FROM users u
WHERE u.id IN (
  SELECT tp.player_id 
  FROM team_players tp
  WHERE tp.team_id IN (
    SELECT team_a_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
    UNION
    SELECT team_b_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
  )
)
LIMIT 50;

-- If this returns rows, the users exist
-- If this returns 0 rows, the player_ids in team_players don't match user IDs

-- ----------------------------------------------------------------------------
-- STEP 5: Test the RLS policy directly (run this as the stat_admin user)
-- ----------------------------------------------------------------------------
SELECT '=== TESTING RLS POLICY (RUN AS STAT_ADMIN) ===' as step;

-- This simulates what TeamService.getTeamPlayers() does
-- You need to run this query while authenticated as the stat_admin user
-- Replace the team_id with actual value from STEP 2

/*
SELECT 
  u.id,
  u.email,
  u.name,
  u.role
FROM team_players tp
JOIN users u ON u.id = tp.player_id
WHERE tp.team_id = '0bd4885a-54df-401d-ae89-90b3dd517344'  -- Replace with actual team_id
LIMIT 20;
*/

-- Expected: Should return player records
-- If returns 0: RLS is still blocking OR player_ids don't exist in users

-- ----------------------------------------------------------------------------
-- STEP 6: Check for orphaned team_players records
-- ----------------------------------------------------------------------------
SELECT -'=== ORPHANED TEAM_PLAYERS (player_id not in users) ===' as step;
SELECT 
  tp.team_id,
  tp.player_id,
  'ORPHANED - User does not exist' as issue
FROM team_players tp
WHERE tp.team_id IN (
  SELECT team_a_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
  UNION
  SELECT team_b_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
)
AND NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = tp.player_id
)
LIMIT 50;

- If this returns rows, you have orphaned records (player_ids that don't exist in users)
-- This would explain why team_players returns IDs but users returns 0 records

-- ----------------------------------------------------------------------------
-- STEP 7: Alternative - Check auth.users table
-- ----------------------------------------------------------------------------
SELECT '=== CHECK AUTH.USERS TABLE ===' as step;

-- Sometimes users are in auth.users but not in public.users
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'role' as role_from_metadata,
  'EXISTS IN AUTH.USERS' as status
FROM auth.users au
WHERE au.id IN (
  SELECT tp.player_id 
  FROM team_players tp
  WHERE tp.team_id IN (
    SELECT team_a_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
    UNION
    SELECT team_b_id FROM games WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
  )
)
LIMIT 50;

-- If this returns rows but STEP 4 didn't, then users are in auth.users but missing from public.users
-- This is a common issue when user registration doesn't create the public.users record

-- ============================================================================
-- EXPECTED OUTCOMES:
-- ============================================================================
-- SCENARIO A: Orphaned Records
--   - STEP 3 returns player_ids
--   - STEP 4 returns 0 rows
--   - STEP 6 returns orphaned records
--   - FIX: Clean up orphaned team_players OR create missing users
--
-- SCENARIO B: Missing public.users sync
--   - STEP 4 returns 0 rows
--   - STEP 7 returns rows
--   - FIX: Create trigger to sync auth.users → public.users
--
-- SCENARIO C: RLS still blocking
--   - STEP 4 returns rows
--   - STEP 5 returns 0 rows (when run as stat_admin)
--   - FIX: Review RLS policy logic
-- ============================================================================

