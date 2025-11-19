-- ============================================================================
-- VERIFY CUSTOM PLAYERS SCHEMA AND QUERY STRUCTURE
-- ============================================================================
-- Purpose: Verify custom_players table structure and test queries
-- Date: 2025-01-XX
-- ============================================================================

-- STEP 1: Verify custom_players table structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
ORDER BY ordinal_position;

-- STEP 2: Verify foreign key relationship to teams
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'custom_players'
  AND kcu.column_name = 'team_id';

-- STEP 3: Check if there are any custom players in the database
SELECT 
  COUNT(*) as total_custom_players,
  COUNT(DISTINCT team_id) as teams_with_custom_players,
  COUNT(DISTINCT coach_id) as coaches_with_custom_players
FROM custom_players;

-- STEP 4: Sample custom player data (if any exist)
SELECT 
  id,
  name,
  jersey_number,
  position,
  team_id,
  coach_id,
  created_at
FROM custom_players
LIMIT 5;

-- STEP 5: Test the query structure we're using in the code
-- This simulates what PlayerDashboardService.getCustomPlayerIdentity() does
SELECT 
  cp.id,
  cp.name,
  cp.jersey_number,
  cp.position,
  cp.team_id,
  t.name as team_name
FROM custom_players cp
LEFT JOIN teams t ON t.id = cp.team_id
LIMIT 1;

-- STEP 6: Test PostgREST nested select syntax (if any custom players exist)
-- This is what Supabase PostgREST uses
SELECT 
  id,
  name,
  jersey_number,
  position,
  team_id,
  teams!custom_players_team_id_fkey(name)
FROM custom_players
LIMIT 1;

-- STEP 7: Alternative - check if foreign key constraint name exists
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conrelid = 'custom_players'::regclass
  AND contype = 'f';

-- STEP 8: Verify RLS policies for custom_players
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
WHERE tablename = 'custom_players';

-- STEP 9: Test RLS access - check current user context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- STEP 10: Check if custom players are accessible with current RLS
-- This will show what custom players the current user can see
SELECT 
  cp.id,
  cp.name,
  cp.team_id,
  t.name as team_name,
  t.coach_id,
  t.visibility
FROM custom_players cp
LEFT JOIN teams t ON t.id = cp.team_id
ORDER BY cp.created_at DESC
LIMIT 10;

-- ============================================================================
-- DIAGNOSTIC QUERIES
-- ============================================================================

-- Check if there's a foreign key constraint with a specific name
SELECT 
  conname,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'custom_players'::regclass
  AND contype = 'f'
  AND confrelid = 'teams'::regclass;

-- Check team_players relationships with custom players
SELECT 
  tp.id as team_player_id,
  tp.team_id,
  tp.custom_player_id,
  cp.name as custom_player_name,
  t.name as team_name
FROM team_players tp
LEFT JOIN custom_players cp ON cp.id = tp.custom_player_id
LEFT JOIN teams t ON t.id = tp.team_id
WHERE tp.custom_player_id IS NOT NULL
LIMIT 10;

