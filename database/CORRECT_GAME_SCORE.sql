-- ============================================================================
-- CORRECT GAME SCORE
-- Game ID: 130288f0-0170-41a1-9f87-d99826ca9997
-- UI shows: 96-81
-- Should be: 94-83
-- ============================================================================

-- STEP 1: Check current scores in games table
-- ============================================================================
SELECT 
    id,
    team_a_id,
    team_b_id,
    home_score as current_team_a_score,
    away_score as current_team_b_score
FROM games
WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997';

-- STEP 2: Calculate actual scores from game_stats
-- ============================================================================
-- Team A score calculation
SELECT 
    'Team A' as team,
    g.team_a_id as team_id,
    COUNT(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 2 as fg_points,
    COUNT(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 3 as three_pt_points,
    COUNT(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 1 as ft_points,
    (COUNT(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 2 +
     COUNT(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 3 +
     COUNT(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' AND gs.team_id = g.team_a_id AND gs.is_opponent_stat = false THEN 1 END) * 1) as calculated_score
FROM games g
LEFT JOIN game_stats gs ON g.id = gs.game_id
WHERE g.id = '130288f0-0170-41a1-9f87-d99826ca9997'
GROUP BY g.id, g.team_a_id

UNION ALL

-- Team B score calculation
SELECT 
    'Team B' as team,
    g.team_b_id as team_id,
    COUNT(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 2 as fg_points,
    COUNT(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 3 as three_pt_points,
    COUNT(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 1 as ft_points,
    (COUNT(CASE WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 2 +
     COUNT(CASE WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 3 +
     COUNT(CASE WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' AND gs.team_id = g.team_b_id AND gs.is_opponent_stat = false THEN 1 END) * 1) as calculated_score
FROM games g
LEFT JOIN game_stats gs ON g.id = gs.game_id
WHERE g.id = '130288f0-0170-41a1-9f87-d99826ca9997'
GROUP BY g.id, g.team_b_id;

-- STEP 3: Detailed breakdown by stat type for verification
-- ============================================================================
SELECT 
    gs.team_id,
    t.name as team_name,
    gs.stat_type,
    gs.modifier,
    COUNT(*) as count,
    CASE 
        WHEN gs.stat_type = 'field_goal' AND gs.modifier = 'made' THEN COUNT(*) * 2
        WHEN gs.stat_type = 'three_pointer' AND gs.modifier = 'made' THEN COUNT(*) * 3
        WHEN gs.stat_type = 'free_throw' AND gs.modifier = 'made' THEN COUNT(*) * 1
        ELSE 0
    END as points
FROM game_stats gs
JOIN games g ON gs.game_id = g.id
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '130288f0-0170-41a1-9f87-d99826ca9997'
AND gs.is_opponent_stat = false
AND gs.modifier = 'made'
AND gs.stat_type IN ('field_goal', 'three_pointer', 'free_throw')
GROUP BY gs.team_id, t.name, gs.stat_type, gs.modifier
ORDER BY gs.team_id, gs.stat_type;

-- STEP 4: Find the stat that needs to be moved (2 points from Team A → Team B)
-- ============================================================================
-- The difference: Team A has 2 extra points, Team B needs 2 more points
-- Find a field_goal (2 points) on Team A that should be on Team B
SELECT 
    gs.id as stat_id,
    gs.created_at,
    gs.team_id as current_team_id,
    t.name as current_team_name,
    gs.stat_type,
    gs.modifier,
    CASE 
        WHEN gs.stat_type = 'field_goal' THEN 2
        WHEN gs.stat_type = 'three_pointer' THEN 3
        WHEN gs.stat_type = 'free_throw' THEN 1
        ELSE 0
    END as points_value,
    gs.player_id,
    gs.custom_player_id,
    gs.quarter,
    gs.game_time_minutes,
    gs.game_time_seconds
FROM game_stats gs
JOIN games g ON gs.game_id = g.id
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '130288f0-0170-41a1-9f87-d99826ca9997'
AND gs.team_id = '46db7ead-879a-449d-8dc8-97d43ba11933'  -- Team A
AND gs.is_opponent_stat = false
AND gs.modifier = 'made'
AND gs.stat_type = 'field_goal'  -- Looking for a 2-point field goal to move
ORDER BY gs.created_at DESC
LIMIT 5;

-- STEP 5: Update score to match games table (if stats are already corrected)
-- ============================================================================
-- The games table already shows 94-83, so no UPDATE needed
-- But if you need to sync, uncomment below:
-- UPDATE games
-- SET 
--     home_score = 94,  -- Team A score
--     away_score = 83   -- Team B score
-- WHERE id = '130288f0-0170-41a1-9f87-d99826ca9997';

-- STEP 6: Fix the stat (move 2 points from Team A to Team B)
-- ============================================================================
-- Move the most recent field goal from Team A to Team B
UPDATE game_stats
SET 
    team_id = 'a2f3994c-9d44-4b4b-aa5d-723629696cd6'  -- Team B ID (Wallan Panthers U20)
WHERE id = '15a6defd-4f4a-477e-92ec-81b37c7340de'  -- Most recent field goal on Team A
AND team_id = '46db7ead-879a-449d-8dc8-97d43ba11933'  -- Team A ID (Run It Back 24/7 U20)
AND stat_type = 'field_goal'
AND modifier = 'made';

-- Verify the update worked:
-- SELECT id, team_id, stat_type, modifier, created_at
-- FROM game_stats
-- WHERE id = '15a6defd-4f4a-477e-92ec-81b37c7340de';

-- STEP 7: Verify final scores match
-- ============================================================================
-- After fixing stats, run Step 2 again to verify calculated score = 94-83
