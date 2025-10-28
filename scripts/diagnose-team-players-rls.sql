-- Diagnose RLS issues for team_players table
-- Team ID: bbe9dafc-a632-404f-907f-2ee3d082b9d8
-- Coach ID: 960934f6-fae3-4da3-aca8-72ae4b3ca0fc

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'team_players';

-- 2. List all RLS policies on team_players
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
WHERE schemaname = 'public' AND tablename = 'team_players';

-- 3. Try to select as the coach user (simulate)
-- This won't work in SQL editor, but shows the query structure
-- SELECT * FROM team_players WHERE team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

-- 4. Check team ownership
SELECT 
  t.id,
  t.name,
  t.coach_id,
  t.tournament_id,
  u.email as coach_email
FROM teams t
LEFT JOIN users u ON t.coach_id = u.id
WHERE t.id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

-- 5. Disable RLS temporarily to see ALL records (ADMIN ONLY)
SET ROLE postgres;
SELECT 
  tp.id,
  tp.team_id,
  tp.player_id,
  tp.custom_player_id,
  tp.created_at
FROM team_players tp
WHERE tp.team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';
RESET ROLE;

