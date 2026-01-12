-- ========================================
-- Verify Season Player Stats Accuracy
-- Coach: wardterence02@gmail.com
-- ========================================

-- 1. Find the coach's seasons
SELECT 
  s.id as season_id,
  s.name as season_name,
  s.team_id,
  t.name as team_name,
  s.created_at
FROM seasons s
JOIN teams t ON s.team_id = t.id
WHERE t.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com');

-- 2. Count games per season (after migration games deleted)
SELECT 
  s.id as season_id,
  s.name as season_name,
  COUNT(sg.game_id) as total_games,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_games
FROM seasons s
JOIN teams t ON s.team_id = t.id
LEFT JOIN season_games sg ON s.id = sg.season_id
LEFT JOIN games g ON sg.game_id = g.id
WHERE t.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com')
GROUP BY s.id, s.name;

-- 3. Calculate ACTUAL player stats from game_stats for season games
-- This is the SOURCE OF TRUTH
-- ✅ CORRECTED: Uses COUNT of makes × standard point values (matches UI)
WITH season_info AS (
  SELECT s.id as season_id, s.team_id
  FROM seasons s
  JOIN teams t ON s.team_id = t.id
  WHERE t.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com')
  LIMIT 1
),
season_game_ids AS (
  SELECT sg.game_id
  FROM season_games sg
  JOIN season_info si ON sg.season_id = si.season_id
  JOIN games g ON sg.game_id = g.id
  WHERE g.status = 'completed'
)
SELECT 
  COALESCE(cp.name, u.name) as player_name,
  COUNT(DISTINCT gs.game_id) as games_played,
  -- Points: COUNT makes × standard values (FG=2, 3PT=3, FT=1)
  SUM(CASE WHEN gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made' THEN 2 ELSE 0 END) +
  SUM(CASE WHEN gs.stat_type IN ('three_pointer', '3_pointer') AND gs.modifier = 'made' THEN 3 ELSE 0 END) +
  SUM(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN 1 ELSE 0 END) as total_points,
  -- Rebounds
  SUM(CASE WHEN gs.stat_type = 'rebound' THEN 1 ELSE 0 END) as total_rebounds,
  -- Assists
  SUM(CASE WHEN gs.stat_type = 'assist' THEN 1 ELSE 0 END) as total_assists,
  -- Steals
  SUM(CASE WHEN gs.stat_type = 'steal' THEN 1 ELSE 0 END) as total_steals,
  -- Blocks
  SUM(CASE WHEN gs.stat_type = 'block' THEN 1 ELSE 0 END) as total_blocks,
  -- Turnovers
  SUM(CASE WHEN gs.stat_type = 'turnover' THEN 1 ELSE 0 END) as total_turnovers,
  -- Fouls
  SUM(CASE WHEN gs.stat_type = 'foul' THEN 1 ELSE 0 END) as total_fouls
FROM game_stats gs
JOIN season_game_ids sgi ON gs.game_id = sgi.game_id
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
LEFT JOIN users u ON gs.player_id = u.id
WHERE gs.is_opponent_stat = false
  AND (gs.custom_player_id IS NOT NULL OR gs.player_id IS NOT NULL)
GROUP BY COALESCE(cp.name, u.name)
ORDER BY total_points DESC;

-- 4. Verify: List all games currently in the season
SELECT 
  g.id,
  g.opponent_name,
  g.status,
  g.home_score,
  g.away_score,
  g.created_at
FROM season_games sg
JOIN games g ON sg.game_id = g.id
JOIN seasons s ON sg.season_id = s.id
JOIN teams t ON s.team_id = t.id
WHERE t.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com')
ORDER BY g.created_at ASC;

