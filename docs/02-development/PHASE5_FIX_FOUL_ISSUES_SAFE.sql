-- ============================================================================
-- PHASE 5: Fix Foul Flow Issues - SAFE VERSION
-- ============================================================================
-- 
-- PURPOSE: Add 'flagrant' and '1-and-1' modifiers to game_stats constraint
-- SAFETY: This script only ADDS new allowed values, never removes existing ones
-- IMPACT: Zero - Only makes the constraint MORE permissive
--
-- ============================================================================

-- ============================================================================
-- STEP 1: DIAGNOSTIC - Check current state (READ-ONLY)
-- ============================================================================

-- 1.1: Check if constraint exists
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as current_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- 1.2: Check existing modifier values in use
SELECT 
    stat_type,
    modifier,
    COUNT(*) as usage_count
FROM public.game_stats 
GROUP BY stat_type, modifier
HAVING COUNT(*) > 0
ORDER BY stat_type, modifier;

-- 1.3: Check if any existing data would violate the NEW constraint
-- (This should return 0 rows - if it returns rows, DO NOT PROCEED)
SELECT 
    id,
    stat_type,
    modifier,
    'Would be INVALID after migration' as status
FROM public.game_stats
WHERE 
    -- Check if any data doesn't match the NEW constraint
    NOT (
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
    )
LIMIT 10;

SELECT '=== DIAGNOSTIC COMPLETE - Review results before proceeding ===' as status;

-- ============================================================================
-- STEP 2: SAFETY CHECK - Verify no data will be affected
-- ============================================================================

DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Count rows that would violate new constraint
    SELECT COUNT(*) INTO invalid_count
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
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION '❌ SAFETY CHECK FAILED: % rows would violate new constraint. DO NOT PROCEED!', invalid_count;
    ELSE
        RAISE NOTICE '✅ SAFETY CHECK PASSED: All existing data is compatible with new constraint';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: BACKUP - Create backup of constraint definition (READ-ONLY)
-- ============================================================================

-- Save current constraint definition for rollback if needed
CREATE TEMP TABLE IF NOT EXISTS constraint_backup AS
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition,
    NOW() as backup_time
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

SELECT * FROM constraint_backup;

-- ============================================================================
-- STEP 4: MIGRATION - Update constraint (WRITE OPERATION)
-- ============================================================================

BEGIN;

-- 4.1: Drop old constraint
ALTER TABLE public.game_stats 
DROP CONSTRAINT IF EXISTS game_stats_modifier_check;

RAISE NOTICE '✅ Old constraint dropped';

-- 4.2: Create new constraint with additional foul modifiers
ALTER TABLE public.game_stats
ADD CONSTRAINT game_stats_modifier_check CHECK (
  (
    -- Field goals: made, missed (UNCHANGED)
    (stat_type IN ('field_goal', 'three_pointer') AND modifier IN ('made', 'missed'))
    OR
    -- Free throws: made, missed (UNCHANGED)
    (stat_type = 'free_throw' AND modifier IN ('made', 'missed'))
    OR
    -- Rebounds: offensive, defensive (UNCHANGED)
    (stat_type = 'rebound' AND modifier IN ('offensive', 'defensive'))
    OR
    -- Fouls: ADDED 'flagrant' and '1-and-1' to existing list
    -- OLD: personal, shooting, technical, offensive
    -- NEW: personal, shooting, 1-and-1, technical, flagrant, offensive
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', '1-and-1', 'technical', 'flagrant', 'offensive'))
    OR
    -- Other stats: no modifier required (UNCHANGED)
    (stat_type IN ('assist', 'steal', 'block', 'turnover') AND modifier IS NULL)
    OR
    -- Turnovers with modifiers (UNCHANGED)
    (stat_type = 'turnover' AND modifier IN ('offensive_foul', 'steal', 'bad_pass', 'travel', 'double_dribble'))
  )
);

RAISE NOTICE '✅ New constraint created with flagrant and 1-and-1 modifiers';

-- 4.3: Verify new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as new_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- 4.4: Test the new constraint with sample data (will rollback)
DO $$
BEGIN
    -- Test 1: Flagrant foul should work
    BEGIN
        INSERT INTO game_stats (
            game_id, player_id, team_id, stat_type, modifier, 
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',
            'foul', 'flagrant', 1, 10, 30, 1
        );
        RAISE NOTICE '✅ Test passed: flagrant modifier accepted';
        ROLLBACK TO SAVEPOINT test_flagrant;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ Test failed: flagrant modifier rejected: %', SQLERRM;
    END;
    
    -- Test 2: 1-and-1 foul should work
    SAVEPOINT test_bonus;
    BEGIN
        INSERT INTO game_stats (
            game_id, player_id, team_id, stat_type, modifier,
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',
            'foul', '1-and-1', 1, 10, 30, 1
        );
        RAISE NOTICE '✅ Test passed: 1-and-1 modifier accepted';
        ROLLBACK TO SAVEPOINT test_bonus;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION '❌ Test failed: 1-and-1 modifier rejected: %', SQLERRM;
    END;
    
    -- Test 3: Invalid modifier should still be rejected
    SAVEPOINT test_invalid;
    BEGIN
        INSERT INTO game_stats (
            game_id, player_id, team_id, stat_type, modifier,
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000001',
            '00000000-0000-0000-0000-000000000002',
            '00000000-0000-0000-0000-000000000003',
            'foul', 'invalid_modifier', 1, 10, 30, 1
        );
        RAISE EXCEPTION '❌ Test failed: Invalid modifier should have been rejected';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ Test passed: Invalid modifier correctly rejected';
            ROLLBACK TO SAVEPOINT test_invalid;
    END;
END $$;

COMMIT;

SELECT '=== MIGRATION COMPLETE ===' as status;

-- ============================================================================
-- STEP 5: VERIFICATION - Confirm changes (READ-ONLY)
-- ============================================================================

-- 5.1: Verify constraint exists with new definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as final_definition,
    'Should include flagrant and 1-and-1' as expected
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- 5.2: Verify no data was affected (row count should be unchanged)
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN stat_type = 'foul' THEN 1 END) as foul_rows,
    'Compare with pre-migration counts' as note
FROM public.game_stats;

-- 5.3: Show what new modifiers are now allowed
SELECT 
    'foul' as stat_type,
    unnest(ARRAY['personal', 'shooting', '1-and-1', 'technical', 'flagrant', 'offensive']) as allowed_modifier,
    CASE 
        WHEN unnest(ARRAY['personal', 'shooting', '1-and-1', 'technical', 'flagrant', 'offensive']) IN ('flagrant', '1-and-1')
        THEN '✅ NEW'
        ELSE 'existing'
    END as status;

SELECT '=== VERIFICATION COMPLETE - Migration successful! ===' as status;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- If you need to rollback, run this:

ALTER TABLE public.game_stats 
DROP CONSTRAINT IF EXISTS game_stats_modifier_check;

ALTER TABLE public.game_stats
ADD CONSTRAINT game_stats_modifier_check CHECK (
  (
    (stat_type IN ('field_goal', 'three_pointer') AND modifier IN ('made', 'missed'))
    OR
    (stat_type = 'free_throw' AND modifier IN ('made', 'missed'))
    OR
    (stat_type = 'rebound' AND modifier IN ('offensive', 'defensive'))
    OR
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', 'technical', 'offensive'))  -- OLD VERSION
    OR
    (stat_type IN ('assist', 'steal', 'block', 'turnover') AND modifier IS NULL)
    OR
    (stat_type = 'turnover' AND modifier IN ('offensive_foul', 'steal', 'bad_pass', 'travel', 'double_dribble'))
  )
);
*/

