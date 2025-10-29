-- ============================================================================
-- PHASE 5: Fix Invalid Data Before Constraint Update
-- ============================================================================
-- 
-- ISSUE: 7 assists have modifier='made' but should have modifier=NULL
-- CAUSE: Old constraint was too permissive
-- SOLUTION: Clean up invalid data before applying new constraint
--
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY INVALID DATA
-- ============================================================================

-- 1.1: Show all assists with modifiers (should be NULL)
SELECT 
    id,
    game_id,
    player_id,
    stat_type,
    modifier,
    quarter,
    created_at,
    'INVALID: Assists should not have modifiers' as issue
FROM public.game_stats
WHERE stat_type = 'assist' 
AND modifier IS NOT NULL
ORDER BY created_at DESC;

-- 1.2: Count invalid rows by type
SELECT 
    stat_type,
    modifier,
    COUNT(*) as count,
    'These will be fixed' as status
FROM public.game_stats
WHERE 
    (stat_type = 'assist' AND modifier IS NOT NULL)
    OR (stat_type = 'steal' AND modifier IS NOT NULL)
    OR (stat_type = 'block' AND modifier IS NOT NULL)
GROUP BY stat_type, modifier;

SELECT '=== INVALID DATA IDENTIFIED ===' as status;

-- ============================================================================
-- STEP 2: BACKUP INVALID DATA (for rollback if needed)
-- ============================================================================

-- Create backup table with invalid data
CREATE TEMP TABLE IF NOT EXISTS invalid_data_backup AS
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
    game_time_minutes,
    game_time_seconds,
    sequence_id,
    is_opponent_stat,
    created_at,
    NOW() as backup_time
FROM public.game_stats
WHERE 
    (stat_type = 'assist' AND modifier IS NOT NULL)
    OR (stat_type = 'steal' AND modifier IS NOT NULL)
    OR (stat_type = 'block' AND modifier IS NOT NULL);

-- Show backup
SELECT 
    COUNT(*) as backed_up_rows,
    'Backup created for rollback' as status
FROM invalid_data_backup;

SELECT * FROM invalid_data_backup ORDER BY created_at DESC;

SELECT '=== BACKUP COMPLETE ===' as status;

-- ============================================================================
-- STEP 3: FIX INVALID DATA
-- ============================================================================

BEGIN;

-- 3.1: Fix assists with modifiers (set to NULL)
UPDATE public.game_stats
SET modifier = NULL
WHERE stat_type = 'assist' 
AND modifier IS NOT NULL;

-- Show what was fixed
SELECT 
    'Assists' as stat_type,
    COUNT(*) as rows_fixed,
    'modifier set to NULL' as fix_applied
FROM invalid_data_backup
WHERE stat_type = 'assist';

-- 3.2: Fix steals with modifiers (if any)
UPDATE public.game_stats
SET modifier = NULL
WHERE stat_type = 'steal' 
AND modifier IS NOT NULL;

-- 3.3: Fix blocks with modifiers (if any)
UPDATE public.game_stats
SET modifier = NULL
WHERE stat_type = 'block' 
AND modifier IS NOT NULL;

COMMIT;

SELECT '=== DATA CLEANUP COMPLETE ===' as status;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- 4.1: Verify no more invalid data
SELECT 
    COUNT(*) as remaining_invalid_rows,
    'Should be 0' as expected
FROM public.game_stats
WHERE 
    (stat_type = 'assist' AND modifier IS NOT NULL)
    OR (stat_type = 'steal' AND modifier IS NOT NULL)
    OR (stat_type = 'block' AND modifier IS NOT NULL);

-- 4.2: Verify the fixes
SELECT 
    stat_type,
    modifier,
    COUNT(*) as count,
    'After cleanup' as status
FROM public.game_stats
WHERE stat_type IN ('assist', 'steal', 'block')
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- 4.3: Re-run the safety check for new constraint
SELECT 
    COUNT(*) as rows_that_would_violate_new_constraint,
    'Should be 0 now' as expected
FROM public.game_stats
WHERE NOT (
    (stat_type IN ('field_goal', 'three_pointer') AND modifier IN ('made', 'missed'))
    OR
    (stat_type = 'free_throw' AND modifier IN ('made', 'missed'))
    OR
    (stat_type = 'rebound' AND modifier IN ('offensive', 'defensive'))
    OR
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', '1-and-1', 'technical', 'flagrant', 'offensive'))
    OR
    (stat_type IN ('assist', 'steal', 'block', 'turnover') AND modifier IS NULL)
    OR
    (stat_type = 'turnover' AND modifier IN ('offensive_foul', 'steal', 'bad_pass', 'travel', 'double_dribble'))
);

SELECT '=== VERIFICATION COMPLETE - Ready for constraint update ===' as status;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- If you need to rollback the data cleanup:

UPDATE public.game_stats g
SET modifier = b.modifier
FROM invalid_data_backup b
WHERE g.id = b.id;

-- This will restore the original modifier values
*/

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

/*
After running this script successfully:

1. Verify "remaining_invalid_rows" = 0
2. Verify "rows_that_would_violate_new_constraint" = 0
3. Then proceed with PHASE5_FIX_FOUL_ISSUES_SAFE.sql

The constraint update will now succeed!
*/

