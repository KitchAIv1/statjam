-- ============================================================
-- AI ANALYSIS AUDIT SCRIPT
-- Game: b7f9757a-4205-4784-ade4-296e2817d55a
-- 
-- PURPOSE: Comprehensive audit of game data for AI analysis
-- Identifies gaps, weaknesses, and data quality issues
--
-- DATE: January 2025
-- ============================================================

-- ============================================================
-- SECTION 1: GAME OVERVIEW
-- ============================================================

-- 1.1 Basic Game Info
SELECT 
  '=== GAME INFO ===' AS section;

SELECT 
  g.id AS game_id,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.status,
  g.quarter AS current_quarter,
  t.name AS team_name,
  g.is_coach_game,
  g.team_a_id,
  g.team_b_id,
  g.created_at,
  CASE 
    WHEN g.home_score > g.away_score THEN 'WIN'
    WHEN g.home_score < g.away_score THEN 'LOSS'
    ELSE 'TIE'
  END AS result,
  ABS(g.home_score - g.away_score) AS margin
FROM games g
LEFT JOIN teams t ON g.team_a_id = t.id
WHERE g.id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- 1.2 AI Analysis Cache Status
SELECT 
  '=== AI ANALYSIS CACHE STATUS ===' AS section;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM ai_analysis WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a')
    THEN '✅ AI Analysis EXISTS in cache'
    ELSE '❌ AI Analysis NOT cached (will generate on demand)'
  END AS cache_status;

SELECT 
  id,
  game_id,
  generated_at,
  version,
  jsonb_pretty(analysis_data) AS analysis_preview
FROM ai_analysis
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
LIMIT 1;

-- ============================================================
-- SECTION 2: DATA QUALITY AUDIT
-- ============================================================

-- 2.1 Total Stats Count
SELECT 
  '=== TOTAL STATS COUNT ===' AS section;

SELECT 
  COUNT(*) AS total_stats,
  COUNT(*) FILTER (WHERE is_opponent_stat = false OR is_opponent_stat IS NULL) AS your_team_stats,
  COUNT(*) FILTER (WHERE is_opponent_stat = true) AS opponent_stats,
  COUNT(DISTINCT custom_player_id) FILTER (WHERE custom_player_id IS NOT NULL AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) AS unique_players,
  COUNT(DISTINCT quarter) AS quarters_with_stats
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- 2.2 Stats Breakdown by Type
SELECT 
  '=== STATS BREAKDOWN BY TYPE ===' AS section;

SELECT 
  stat_type,
  modifier,
  COUNT(*) AS count,
  COUNT(*) FILTER (WHERE is_opponent_stat = true) AS opponent_count,
  COUNT(*) FILTER (WHERE is_opponent_stat = false OR is_opponent_stat IS NULL) AS your_team_count
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- 2.3 Check for Missing Video Timestamps
SELECT 
  '=== VIDEO TIMESTAMP COVERAGE ===' AS section;

SELECT 
  COUNT(*) AS total_stats,
  COUNT(*) FILTER (WHERE video_timestamp_ms IS NOT NULL) AS with_video_timestamp,
  COUNT(*) FILTER (WHERE video_timestamp_ms IS NULL) AS missing_video_timestamp,
  ROUND(100.0 * COUNT(*) FILTER (WHERE video_timestamp_ms IS NOT NULL) / NULLIF(COUNT(*), 0), 1) AS video_coverage_pct
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- 2.4 Check for Missing Player Assignments
SELECT 
  '=== PLAYER ASSIGNMENT COVERAGE ===' AS section;

SELECT 
  COUNT(*) AS total_stats,
  COUNT(*) FILTER (WHERE custom_player_id IS NOT NULL) AS with_custom_player,
  COUNT(*) FILTER (WHERE player_id IS NOT NULL) AS with_player_id,
  COUNT(*) FILTER (WHERE custom_player_id IS NULL AND player_id IS NULL AND is_opponent_stat != true) AS missing_player_assignment,
  CASE 
    WHEN COUNT(*) FILTER (WHERE custom_player_id IS NULL AND player_id IS NULL AND is_opponent_stat != true) = 0
    THEN '✅ All stats have player assignment'
    ELSE '⚠️ Some stats missing player assignment'
  END AS player_coverage_status
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a';

-- ============================================================
-- SECTION 3: YOUR TEAM STATS
-- ============================================================

-- 3.1 Team Scoring Summary
SELECT 
  '=== YOUR TEAM SCORING SUMMARY ===' AS section;

SELECT 
  'Your Team' AS team,
  -- 2PT
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') AS two_pt_made,
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer')) AS two_pt_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer')), 0), 1) AS two_pt_pct,
  -- 3PT
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') AS three_pt_made,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer') AS three_pt_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type = 'three_pointer'), 0), 1) AS three_pt_pct,
  -- FT
  COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw') AS ft_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type = 'free_throw'), 0), 1) AS ft_pct,
  -- Total Points (calculated)
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made')) AS calculated_points
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL);

-- 3.2 Team Other Stats
SELECT 
  '=== YOUR TEAM OTHER STATS ===' AS section;

SELECT 
  'Your Team' AS team,
  COUNT(*) FILTER (WHERE stat_type = 'rebound') AS total_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'offensive') AS offensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'defensive') AS defensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE stat_type IN ('foul', 'personal_foul')) AS fouls
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND (is_opponent_stat = false OR is_opponent_stat IS NULL);

-- ============================================================
-- SECTION 4: OPPONENT STATS
-- ============================================================

-- 4.1 Opponent Scoring Summary
SELECT 
  '=== OPPONENT SCORING SUMMARY ===' AS section;

SELECT 
  'Opponent' AS team,
  -- 2PT
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') AS two_pt_made,
  COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer')) AS two_pt_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer')), 0), 1) AS two_pt_pct,
  -- 3PT
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') AS three_pt_made,
  COUNT(*) FILTER (WHERE stat_type = 'three_pointer') AS three_pt_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type = 'three_pointer'), 0), 1) AS three_pt_pct,
  -- FT
  COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') AS ft_made,
  COUNT(*) FILTER (WHERE stat_type = 'free_throw') AS ft_attempts,
  ROUND(100.0 * COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made') / 
    NULLIF(COUNT(*) FILTER (WHERE stat_type = 'free_throw'), 0), 1) AS ft_pct,
  -- Total Points (calculated)
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made')) AS calculated_points
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND is_opponent_stat = true;

-- 4.2 Opponent Other Stats
SELECT 
  '=== OPPONENT OTHER STATS ===' AS section;

SELECT 
  'Opponent' AS team,
  COUNT(*) FILTER (WHERE stat_type = 'rebound') AS total_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'offensive') AS offensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier = 'defensive') AS defensive_rebounds,
  COUNT(*) FILTER (WHERE stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE stat_type IN ('foul', 'personal_foul')) AS fouls
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND is_opponent_stat = true;

-- ============================================================
-- SECTION 5: SCORE RECONCILIATION
-- ============================================================

-- 5.1 Score Validation
SELECT 
  '=== SCORE RECONCILIATION ===' AS section;

WITH game_info AS (
  SELECT home_score, away_score
  FROM games
  WHERE id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
),
calculated_scores AS (
  SELECT 
    (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 2 +
     COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 3 +
     COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL))) AS calc_home_score,
    (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND is_opponent_stat = true) * 2 +
     COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND is_opponent_stat = true) * 3 +
     COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND is_opponent_stat = true)) AS calc_away_score
  FROM game_stats
  WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
)
SELECT 
  gi.home_score AS recorded_home_score,
  cs.calc_home_score AS calculated_home_score,
  gi.home_score - cs.calc_home_score AS home_score_diff,
  gi.away_score AS recorded_away_score,
  cs.calc_away_score AS calculated_away_score,
  gi.away_score - cs.calc_away_score AS away_score_diff,
  CASE 
    WHEN gi.home_score = cs.calc_home_score AND gi.away_score = cs.calc_away_score
    THEN '✅ Scores MATCH'
    ELSE '⚠️ Score DISCREPANCY detected'
  END AS score_validation
FROM game_info gi, calculated_scores cs;

-- ============================================================
-- SECTION 6: PLAYER STATS
-- ============================================================

-- 6.1 Top Players by Impact Score
SELECT 
  '=== TOP PLAYERS BY IMPACT ===' AS section;

SELECT 
  cp.name AS player_name,
  cp.jersey_number,
  -- Points
  (COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') * 2 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') * 3 +
   COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made')) AS points,
  COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') AS rebounds,
  COUNT(*) FILTER (WHERE gs.stat_type = 'assist') AS assists,
  COUNT(*) FILTER (WHERE gs.stat_type = 'steal') AS steals,
  COUNT(*) FILTER (WHERE gs.stat_type = 'block') AS blocks,
  COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') AS turnovers,
  COUNT(*) FILTER (WHERE gs.stat_type IN ('foul', 'personal_foul')) AS fouls,
  -- Shooting breakdown
  COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') || '/' ||
    COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer')) AS fg,
  COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') || '/' ||
    COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer') AS three_pt,
  COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made') || '/' ||
    COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw') AS ft,
  -- Impact score (weighted)
  ROUND(
    (COUNT(*) FILTER (WHERE gs.stat_type IN ('field_goal', 'two_pointer') AND gs.modifier = 'made') * 2 +
     COUNT(*) FILTER (WHERE gs.stat_type = 'three_pointer' AND gs.modifier = 'made') * 3 +
     COUNT(*) FILTER (WHERE gs.stat_type = 'free_throw' AND gs.modifier = 'made')) * 1.0 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'rebound') * 0.8 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'assist') * 0.7 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'steal') * 1.2 +
    COUNT(*) FILTER (WHERE gs.stat_type = 'block') * 1.1 -
    COUNT(*) FILTER (WHERE gs.stat_type = 'turnover') * 1.0,
    1
  ) AS impact_score
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
  AND (gs.is_opponent_stat = false OR gs.is_opponent_stat IS NULL)
  AND gs.custom_player_id IS NOT NULL
GROUP BY cp.id, cp.name, cp.jersey_number
ORDER BY impact_score DESC
LIMIT 10;

-- ============================================================
-- SECTION 7: QUARTER-BY-QUARTER ANALYSIS
-- ============================================================

-- 7.1 Quarter Scoring Breakdown
SELECT 
  '=== QUARTER BY QUARTER SCORING ===' AS section;

SELECT 
  quarter,
  -- Your team points
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL))) AS your_team_points,
  -- Opponent points
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND is_opponent_stat = true) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND is_opponent_stat = true) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND is_opponent_stat = true)) AS opponent_points,
  -- Margin
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND (is_opponent_stat = false OR is_opponent_stat IS NULL))) -
  (COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer') AND modifier = 'made' AND is_opponent_stat = true) * 2 +
   COUNT(*) FILTER (WHERE stat_type = 'three_pointer' AND modifier = 'made' AND is_opponent_stat = true) * 3 +
   COUNT(*) FILTER (WHERE stat_type = 'free_throw' AND modifier = 'made' AND is_opponent_stat = true)) AS quarter_margin
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
GROUP BY quarter
ORDER BY quarter;

-- 7.2 Quarter Stats Balance
SELECT 
  '=== QUARTER STATS BALANCE ===' AS section;

SELECT 
  quarter,
  COUNT(*) AS total_stats,
  COUNT(*) FILTER (WHERE is_opponent_stat = true) AS opponent_stats,
  COUNT(*) FILTER (WHERE is_opponent_stat = false OR is_opponent_stat IS NULL) AS your_team_stats,
  CASE 
    WHEN COUNT(*) < 10 THEN '⚠️ LOW stat count'
    WHEN COUNT(*) FILTER (WHERE is_opponent_stat = true) = 0 THEN '⚠️ NO opponent stats'
    ELSE '✅ OK'
  END AS quarter_status
FROM game_stats
WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
GROUP BY quarter
ORDER BY quarter;

-- ============================================================
-- SECTION 8: RPC FUNCTION VALIDATION
-- ============================================================

-- 8.1 Test RPC Function Output
SELECT 
  '=== RPC FUNCTION OUTPUT ===' AS section;

SELECT jsonb_pretty(get_ai_analysis_data('b7f9757a-4205-4784-ade4-296e2817d55a'::uuid));

-- ============================================================
-- SECTION 9: GAP ANALYSIS & RECOMMENDATIONS
-- ============================================================

-- 9.1 Data Completeness Check
SELECT 
  '=== GAP ANALYSIS & RECOMMENDATIONS ===' AS section;

WITH analysis AS (
  SELECT 
    -- Basic counts
    COUNT(*) AS total_stats,
    COUNT(*) FILTER (WHERE is_opponent_stat = true) AS opponent_stats,
    COUNT(*) FILTER (WHERE is_opponent_stat = false OR is_opponent_stat IS NULL) AS your_team_stats,
    COUNT(DISTINCT quarter) AS quarters_tracked,
    
    -- Shot tracking
    COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer', 'three_pointer')) AS total_shots,
    COUNT(*) FILTER (WHERE stat_type IN ('field_goal', 'two_pointer', 'three_pointer') AND shot_location_x IS NOT NULL) AS shots_with_location,
    
    -- Modifiers
    COUNT(*) FILTER (WHERE stat_type = 'rebound' AND modifier IS NOT NULL) AS rebounds_with_type,
    COUNT(*) FILTER (WHERE stat_type = 'rebound') AS total_rebounds,
    COUNT(*) FILTER (WHERE stat_type = 'turnover' AND modifier IS NOT NULL) AS turnovers_with_type,
    COUNT(*) FILTER (WHERE stat_type = 'turnover') AS total_turnovers,
    COUNT(*) FILTER (WHERE stat_type IN ('foul', 'personal_foul') AND modifier IS NOT NULL) AS fouls_with_type,
    COUNT(*) FILTER (WHERE stat_type IN ('foul', 'personal_foul')) AS total_fouls
  FROM game_stats
  WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
)
SELECT 
  -- Overall data quality
  CASE WHEN total_stats >= 100 THEN '✅' ELSE '⚠️' END || ' Total Stats: ' || total_stats || 
    CASE WHEN total_stats < 100 THEN ' (LOW - may affect AI accuracy)' ELSE ' (GOOD)' END AS stat_coverage,
  
  -- Opponent tracking
  CASE WHEN opponent_stats >= 30 THEN '✅' ELSE '⚠️' END || ' Opponent Stats: ' || opponent_stats || 
    CASE WHEN opponent_stats < 30 THEN ' (LOW - limited opponent analysis)' ELSE ' (GOOD)' END AS opponent_tracking,
  
  -- Quarter coverage
  CASE WHEN quarters_tracked >= 4 THEN '✅' ELSE '⚠️' END || ' Quarters Tracked: ' || quarters_tracked || 
    CASE WHEN quarters_tracked < 4 THEN ' (INCOMPLETE - missing quarter data)' ELSE ' (COMPLETE)' END AS quarter_coverage,
  
  -- Shot locations
  CASE WHEN shots_with_location::float / NULLIF(total_shots, 0) >= 0.5 THEN '✅' ELSE '⚠️' END || 
    ' Shot Location Coverage: ' || shots_with_location || '/' || total_shots || ' (' || 
    ROUND(100.0 * shots_with_location / NULLIF(total_shots, 0), 1) || '%)' AS shot_location_coverage,
  
  -- Rebound types
  CASE WHEN rebounds_with_type::float / NULLIF(total_rebounds, 0) >= 0.8 THEN '✅' ELSE '⚠️' END || 
    ' Rebound Type Coverage: ' || rebounds_with_type || '/' || total_rebounds || ' (' || 
    ROUND(100.0 * rebounds_with_type / NULLIF(total_rebounds, 0), 1) || '%)' AS rebound_type_coverage,
  
  -- Turnover types
  CASE WHEN turnovers_with_type::float / NULLIF(total_turnovers, 0) >= 0.8 THEN '✅' ELSE '⚠️' END || 
    ' Turnover Type Coverage: ' || turnovers_with_type || '/' || total_turnovers || ' (' || 
    ROUND(100.0 * turnovers_with_type / NULLIF(total_turnovers, 0), 1) || '%)' AS turnover_type_coverage,
  
  -- Foul types
  CASE WHEN fouls_with_type::float / NULLIF(total_fouls, 0) >= 0.8 THEN '✅' ELSE '⚠️' END || 
    ' Foul Type Coverage: ' || fouls_with_type || '/' || total_fouls || ' (' || 
    ROUND(100.0 * fouls_with_type / NULLIF(total_fouls, 0), 1) || '%)' AS foul_type_coverage
FROM analysis;

-- 9.2 Potential AI Analysis Issues
SELECT 
  '=== POTENTIAL AI ANALYSIS ISSUES ===' AS section;

WITH game_info AS (
  SELECT 
    home_score,
    away_score,
    is_coach_game,
    opponent_name,
    status
  FROM games
  WHERE id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
),
stats_info AS (
  SELECT 
    COUNT(*) AS total_stats,
    COUNT(*) FILTER (WHERE is_opponent_stat = true) AS opponent_stats,
    COUNT(DISTINCT quarter) AS quarters_tracked,
    COUNT(DISTINCT custom_player_id) FILTER (WHERE custom_player_id IS NOT NULL AND (is_opponent_stat = false OR is_opponent_stat IS NULL)) AS unique_players
  FROM game_stats
  WHERE game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
)
SELECT 
  -- Game status
  CASE WHEN gi.status != 'completed' 
    THEN '⚠️ ISSUE: Game status is "' || gi.status || '" - should be "completed"'
    ELSE '✅ Game status OK'
  END AS game_status_check,
  
  -- Opponent name
  CASE WHEN gi.is_coach_game AND (gi.opponent_name IS NULL OR gi.opponent_name = '')
    THEN '⚠️ ISSUE: Coach game missing opponent_name'
    ELSE '✅ Opponent name OK'
  END AS opponent_name_check,
  
  -- Score balance
  CASE WHEN gi.home_score = 0 AND gi.away_score = 0
    THEN '❌ CRITICAL: Both scores are 0 - game data incomplete'
    WHEN gi.home_score = gi.away_score
    THEN '⚠️ WARNING: Tie game - less interesting for AI analysis'
    ELSE '✅ Score balance OK'
  END AS score_check,
  
  -- Player coverage
  CASE WHEN si.unique_players < 5
    THEN '⚠️ ISSUE: Only ' || si.unique_players || ' unique players - may need roster check'
    ELSE '✅ Player coverage OK (' || si.unique_players || ' players)'
  END AS player_check,
  
  -- Stat density
  CASE WHEN si.total_stats < 50
    THEN '❌ CRITICAL: Only ' || si.total_stats || ' total stats - insufficient for quality analysis'
    WHEN si.total_stats < 100
    THEN '⚠️ WARNING: ' || si.total_stats || ' stats - AI analysis may be limited'
    ELSE '✅ Stat density OK (' || si.total_stats || ' stats)'
  END AS stat_density_check,
  
  -- Opponent tracking
  CASE WHEN si.opponent_stats = 0
    THEN '❌ CRITICAL: NO opponent stats tracked - AI cannot compare teams'
    WHEN si.opponent_stats < 20
    THEN '⚠️ WARNING: Only ' || si.opponent_stats || ' opponent stats - limited comparison'
    ELSE '✅ Opponent tracking OK (' || si.opponent_stats || ' stats)'
  END AS opponent_tracking_check
FROM game_info gi, stats_info si;

-- ============================================================
-- SECTION 10: RECENT STATS (Last 20)
-- ============================================================

SELECT 
  '=== RECENT STATS (Last 20) ===' AS section;

SELECT 
  gs.id,
  gs.stat_type,
  gs.modifier,
  gs.quarter,
  gs.game_time_minutes || ':' || LPAD(gs.game_time_seconds::text, 2, '0') AS game_time,
  gs.video_timestamp_ms,
  CASE WHEN gs.is_opponent_stat THEN 'Opponent' ELSE cp.name END AS player,
  gs.is_opponent_stat,
  gs.created_at
FROM game_stats gs
LEFT JOIN custom_players cp ON gs.custom_player_id = cp.id
WHERE gs.game_id = 'b7f9757a-4205-4784-ade4-296e2817d55a'
ORDER BY gs.created_at DESC
LIMIT 20;

-- ============================================================
-- END OF AUDIT
-- ============================================================

SELECT '=== AUDIT COMPLETE ===' AS section;
