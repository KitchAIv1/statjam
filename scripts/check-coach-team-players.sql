-- Check if coach team players exist in team_players table
-- Team ID: bbe9dafc-a632-404f-907f-2ee3d082b9d8

-- 1. Check team_players table for this team
SELECT 
  tp.id,
  tp.team_id,
  tp.player_id,
  tp.custom_player_id,
  u.name as player_name,
  cp.name as custom_player_name
FROM team_players tp
LEFT JOIN users u ON tp.player_id = u.id
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

-- 2. Check if the team exists
SELECT id, name, coach_id, tournament_id
FROM teams
WHERE id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

-- 3. Check if custom_players exist for this team
SELECT id, name, team_id, coach_id, jersey_number, position
FROM custom_players
WHERE team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

-- 4. Count records
SELECT 
  'team_players' as table_name,
  COUNT(*) as count
FROM team_players
WHERE team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8'
UNION ALL
SELECT 
  'custom_players' as table_name,
  COUNT(*) as count
FROM custom_players
WHERE team_id = 'bbe9dafc-a632-404f-907f-2ee3d082b9d8';

