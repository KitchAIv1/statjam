-- ============================================================================
-- CHECK PERSONAL FOULS IN DATABASE
-- ============================================================================
-- Purpose: Verify if personal fouls are being saved and displayed correctly
-- Date: 2025-11-15

-- 1. Check database constraint for foul modifiers
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- 2. Check if personal fouls exist in game_stats table
-- Replace GAME_ID with actual game ID
SELECT 
    id,
    game_id,
    player_id,
    custom_player_id,
    team_id,
    stat_type,
    modifier,
    stat_value,
    quarter,
    created_at
FROM game_stats
WHERE stat_type = 'foul'
ORDER BY created_at DESC
LIMIT 20;

-- 3. Count fouls by modifier type
SELECT 
    modifier,
    COUNT(*) as count
FROM game_stats
WHERE stat_type = 'foul'
GROUP BY modifier
ORDER BY count DESC;

-- 4. Check specific game for personal fouls (replace GAME_ID)
-- SELECT 
--     id,
--     stat_type,
--     modifier,
--     player_id,
--     custom_player_id,
--     created_at
-- FROM game_stats
-- WHERE game_id = 'GAME_ID_HERE'
-- AND stat_type = 'foul'
-- ORDER BY created_at DESC;

-- 5. Verify constraint allows 'personal' modifier
-- This should return rows if constraint allows 'personal'
SELECT 
    'personal' as test_modifier,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_constraint 
            WHERE conrelid = 'public.game_stats'::regclass
            AND conname = 'game_stats_modifier_check'
            AND pg_get_constraintdef(oid) LIKE '%personal%'
        ) THEN '✅ Constraint allows personal'
        ELSE '❌ Constraint does NOT allow personal'
    END as constraint_status;

