-- ============================================================
-- CHECK COACH FINAL SCORE INPUT (Pre-Flight Checklist Score)
-- Game: 70d61fd3-2f21-4b8d-8754-01ce5838094f
-- Coach: wardterence02@gmail.com
-- ============================================================

-- STEP 1: Get the COACH'S INPUT SCORE from games table
-- home_score = Coach's team score
-- away_score = Opponent score (what coach manually inputs)
SELECT 
  g.id,
  g.status,
  g.home_score AS coach_team_score,
  g.away_score AS opponent_score_input,
  g.opponent_name,
  t.name AS coach_team_name,
  g.updated_at
FROM games g
LEFT JOIN teams t ON g.team_a_id = t.id
WHERE g.id = '70d61fd3-2f21-4b8d-8754-01ce5838094f';

-- STEP 2: Compare with calculated score from tracked stats
SELECT 
  'Coach Team' as team,
  SUM(
    CASE 
      WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
      WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
      WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
      ELSE 0
    END
  ) as calculated_from_stats
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND is_opponent_stat = false

UNION ALL

SELECT 
  'Opponent' as team,
  SUM(
    CASE 
      WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
      WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
      WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
      ELSE 0
    END
  ) as calculated_from_stats
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND is_opponent_stat = true;

