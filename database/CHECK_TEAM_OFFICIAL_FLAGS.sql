-- ============================================================================
-- CHECK TEAM OFFICIAL FLAGS
-- ============================================================================
-- Purpose: Verify which teams are marked as official vs practice
-- This explains why production shows fewer games (RLS filters practice teams)
-- ============================================================================

-- STEP 1: Check all teams player is on and their official status
-- ============================================================================
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.coach_id,
    t.is_official_team,
    t.tournament_id,
    tr.name as tournament_name,
    CASE 
        WHEN t.is_official_team = TRUE THEN '✅ Official (stats count)'
        WHEN t.is_official_team = FALSE THEN '❌ Practice (stats filtered)'
        WHEN t.is_official_team IS NULL THEN '⚠️ NULL (check default)'
    END as status_explanation
FROM team_players tp
JOIN teams t ON tp.team_id = t.id
LEFT JOIN tournaments tr ON t.tournament_id = tr.id
WHERE tp.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
ORDER BY t.is_official_team DESC, t.name;

-- Expected: Shows which teams are official vs practice
-- Practice teams (is_official_team = FALSE) will have their games filtered by RLS


-- STEP 2: Count games by official status
-- ============================================================================
SELECT 
    CASE 
        WHEN t.is_official_team = TRUE THEN 'Official Team Games'
        WHEN t.is_official_team = FALSE THEN 'Practice Team Games (FILTERED)'
        WHEN t.is_official_team IS NULL THEN 'NULL Status'
        WHEN g.is_coach_game = FALSE THEN 'Tournament Games (Always Official)'
    END as game_category,
    COUNT(DISTINCT g.id) as game_count
FROM game_stats gs
JOIN games g ON gs.game_id = g.id
LEFT JOIN teams t ON (g.team_a_id = t.id OR g.team_b_id = t.id)
WHERE gs.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
GROUP BY 
    CASE 
        WHEN t.is_official_team = TRUE THEN 'Official Team Games'
        WHEN t.is_official_team = FALSE THEN 'Practice Team Games (FILTERED)'
        WHEN t.is_official_team IS NULL THEN 'NULL Status'
        WHEN g.is_coach_game = FALSE THEN 'Tournament Games (Always Official)'
    END;

-- Expected: Shows breakdown of games by official/practice status
-- Production RLS filters out "Practice Team Games"


-- STEP 3: List games that are being filtered (practice teams)
-- ============================================================================
SELECT 
    g.id as game_id,
    g.status,
    g.is_coach_game,
    t.name as team_name,
    t.is_official_team,
    tr.name as tournament_name
FROM game_stats gs
JOIN games g ON gs.game_id = g.id
LEFT JOIN teams t ON (g.team_a_id = t.id OR g.team_b_id = t.id)
LEFT JOIN tournaments tr ON g.tournament_id = tr.id
WHERE gs.player_id = '0e0530d5-ca39-466c-8f66-e3e08c69b4f9'
AND g.is_coach_game = TRUE
AND (t.is_official_team = FALSE OR t.is_official_team IS NULL)
ORDER BY g.created_at DESC;

-- Expected: Shows games that are being filtered out by RLS
-- These are coach games from practice teams


-- STEP 4: Check default value for is_official_team
-- ============================================================================
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'teams'
AND column_name = 'is_official_team';

-- Expected: Should show DEFAULT FALSE
-- This means new teams default to practice (filtered)


-- ============================================================================
-- SOLUTION OPTIONS
-- ============================================================================
--
-- OPTION 1: Mark coach teams as official (if they should count)
-- UPDATE teams 
-- SET is_official_team = TRUE 
-- WHERE coach_id IS NOT NULL 
-- AND is_official_team = FALSE;
--
-- OPTION 2: Keep current behavior (practice games filtered)
-- This is correct if coaches want practice games excluded from player stats
-- Local dev might be bypassing RLS or using different auth context
--
-- OPTION 3: Update RLS to show all games (if you want practice games included)
-- See FIX_PLAYER_STATS_RLS.sql for this option
--
-- ============================================================================

