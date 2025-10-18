-- DIAGNOSE SCORE CALCULATION ISSUE
-- Compare database scores vs calculated scores from game_stats

-- 1. Check the actual game record
SELECT 
  'GAME RECORD' as source,
  id,
  team_a_id,
  team_b_id,
  home_score,
  away_score,
  status,
  quarter
FROM games 
WHERE id = '66744655-4e6e-4c75-a999-06abd5818647';

-- 2. Check all game_stats for this game
SELECT 
  'GAME STATS SUMMARY' as source,
  COUNT(*) as total_stats,
  COUNT(CASE WHEN modifier = 'made' THEN 1 END) as made_stats,
  COUNT(CASE WHEN modifier = 'missed' THEN 1 END) as missed_stats,
  COUNT(CASE WHEN modifier IS NULL THEN 1 END) as null_modifier_stats
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647';

-- 3. Calculate scores by team using the EXACT same logic as useTracker
SELECT 
  'CALCULATED SCORES' as source,
  team_id,
  COUNT(*) as total_stats_for_team,
  COUNT(CASE WHEN modifier = 'made' THEN 1 END) as made_stats_for_team,
  SUM(CASE WHEN modifier = 'made' THEN stat_value ELSE 0 END) as calculated_score
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
GROUP BY team_id
ORDER BY team_id;

-- 4. Show recent stats to see what might be missing
SELECT 
  'RECENT STATS' as source,
  created_at,
  stat_type,
  modifier,
  stat_value,
  team_id,
  player_id
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if there are any stats with NULL team_id or other issues
SELECT 
  'PROBLEMATIC STATS' as source,
  COUNT(*) as count,
  'NULL team_id' as issue
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
  AND team_id IS NULL

UNION ALL

SELECT 
  'PROBLEMATIC STATS' as source,
  COUNT(*) as count,
  'NULL stat_value' as issue
FROM game_stats 
WHERE game_id = '66744655-4e6e-4c75-a999-06abd5818647'
  AND stat_value IS NULL
  AND modifier = 'made';
