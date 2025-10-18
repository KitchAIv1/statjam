-- DIAGNOSE SCORE UPDATE TRIGGERS
-- Check if there are triggers that should update games.home_score and games.away_score

-- 1. Check for triggers on game_stats table
SELECT 
  'TRIGGERS ON game_stats' as source,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'game_stats'
  AND event_object_schema = 'public';

-- 2. Check for triggers on games table
SELECT 
  'TRIGGERS ON games' as source,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'games'
  AND event_object_schema = 'public';

-- 3. Check for functions that might update game scores
SELECT 
  'SCORE UPDATE FUNCTIONS' as source,
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%score%' OR routine_name LIKE '%game%')
  AND routine_type = 'FUNCTION';

-- 4. Manual calculation to verify what the scores SHOULD be
SELECT 
  'MANUAL VERIFICATION' as source,
  'Team A (0bd4885a-54df-401d-ae89-90b3dd517344)' as team,
  SUM(CASE WHEN modifier = 'made' THEN stat_value ELSE 0 END) as should_be_score
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
  AND team_id = '0bd4885a-54df-401d-ae89-90b3dd517344'

UNION ALL

SELECT 
  'MANUAL VERIFICATION' as source,
  'Team B (21caa3e7-6d3b-4f08-acd9-e5564310791d)' as team,
  SUM(CASE WHEN modifier = 'made' THEN stat_value ELSE 0 END) as should_be_score
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
  AND team_id = '21caa3e7-6d3b-4f08-acd9-e5564310791d';

-- 5. Check when the game scores were last updated
SELECT 
  'GAME LAST UPDATED' as source,
  id,
  home_score,
  away_score,
  updated_at,
  created_at
FROM games 
WHERE id = '66744655-4e6e-4c75-a999-06abd5818647';
