-- ============================================================================
-- TOURNAMENT LEADERS - TRIGGER & TABLE VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to understand current state
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================================================

-- 1A. View all columns in tournament_leaders table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tournament_leaders'
ORDER BY ordinal_position;

-- 1B. Check if game_phase column exists and its values
SELECT 
    game_phase,
    COUNT(*) as row_count
FROM tournament_leaders
GROUP BY game_phase
ORDER BY game_phase;

-- ============================================================================
-- 2. CHECK CURRENT DATA DISTRIBUTION
-- ============================================================================

-- 2A. See sample of tournament_leaders data (for a specific tournament)
SELECT 
    player_id,
    player_name,
    team_name,
    game_phase,
    games_played,
    total_points,
    profile_photo_url IS NOT NULL as has_photo
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
ORDER BY total_points DESC
LIMIT 20;

-- 2B. Compare: How many rows per player? (Should be 1 per phase if properly configured)
SELECT 
    player_id,
    player_name,
    COUNT(*) as row_count,
    STRING_AGG(DISTINCT game_phase, ', ') as phases
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY player_id, player_name
ORDER BY row_count DESC
LIMIT 20;

-- 2C. Compare with actual games table - what phases exist?
SELECT 
    game_phase,
    COUNT(*) as game_count,
    STRING_AGG(DISTINCT id::text, ', ') as game_ids
FROM games
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND status = 'completed'
GROUP BY game_phase
ORDER BY game_phase;

-- ============================================================================
-- 3. CHECK TRIGGERS ON RELEVANT TABLES
-- ============================================================================

-- 3A. List all triggers on game_stats table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'game_stats';

-- 3B. List all triggers on games table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'games';

-- 3C. List all triggers on tournament_leaders table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tournament_leaders';

-- ============================================================================
-- 4. CHECK FUNCTIONS RELATED TO TOURNAMENT LEADERS
-- ============================================================================

-- 4A. Find all functions with 'leader' in the name
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name ILIKE '%leader%' OR routine_name ILIKE '%tournament_stat%')
ORDER BY routine_name;

-- 4B. Get the FULL source code of functions (replace function_name as needed)
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND (proname ILIKE '%leader%' OR proname ILIKE '%tournament_stat%' OR proname ILIKE '%update_tournament%')
ORDER BY proname;

-- ============================================================================
-- 5. VERIFY DATA INTEGRITY - COMPARE PRE-COMPUTED VS ACTUAL
-- ============================================================================

-- 5A. Calculate actual stats from game_stats for Finals games only
WITH finals_games AS (
    SELECT id FROM games 
    WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
      AND game_phase = 'finals'
      AND status = 'completed'
),
finals_stats AS (
    SELECT 
        COALESCE(gs.player_id, gs.custom_player_id) as player_id,
        gs.game_id,
        gs.stat_type,
        gs.stat_value,
        gs.modifier
    FROM game_stats gs
    INNER JOIN finals_games fg ON gs.game_id = fg.id
    WHERE gs.player_id IS NOT NULL OR gs.custom_player_id IS NOT NULL
),
aggregated AS (
    SELECT 
        player_id,
        COUNT(DISTINCT game_id) as games_played,
        SUM(CASE 
            WHEN stat_type = 'field_goal' AND modifier = 'made' THEN 2
            WHEN stat_type = 'two_pointer' AND modifier = 'made' THEN 2
            WHEN stat_type = 'three_pointer' AND modifier = 'made' THEN 3
            WHEN stat_type = 'free_throw' AND modifier = 'made' THEN 1
            ELSE 0 
        END) as total_points
    FROM finals_stats
    GROUP BY player_id
)
SELECT 
    a.player_id,
    COALESCE(u.name, cp.name, 'Unknown') as player_name,
    a.games_played,
    a.total_points
FROM aggregated a
LEFT JOIN users u ON a.player_id = u.id
LEFT JOIN custom_players cp ON a.player_id = cp.id
ORDER BY a.total_points DESC
LIMIT 10;

-- 5B. Check if tournament_leaders has ANY rows with game_phase = 'finals'
SELECT 
    player_name,
    game_phase,
    games_played,
    total_points
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND game_phase = 'finals'
ORDER BY total_points DESC;

-- ============================================================================
-- 6. QUICK DIAGNOSIS SUMMARY
-- ============================================================================

-- 6A. Summary: What's in tournament_leaders vs what should be there
SELECT 
    'tournament_leaders' as source,
    game_phase,
    COUNT(DISTINCT player_id) as unique_players,
    SUM(games_played) as total_games_tracked
FROM tournament_leaders
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
GROUP BY game_phase

UNION ALL

SELECT 
    'games (actual)' as source,
    game_phase,
    NULL as unique_players,
    COUNT(*) as total_games_tracked
FROM games
WHERE tournament_id = 'c2fa28fa-ec92-40b4-a0db-0a94b68db103'
  AND status = 'completed'
GROUP BY game_phase
ORDER BY source, game_phase;

