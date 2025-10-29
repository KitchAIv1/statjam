-- ============================================================================
-- FUTURE MIGRATION: Shot Clock Violation Modifier Support
-- ============================================================================
-- 
-- PURPOSE: Add 'shot_clock_violation' as a valid modifier for turnover stats
--          AND allow team-level turnovers without player attribution
-- STATUS: ⚠️ PENDING BACKEND IMPLEMENTATION
-- PRIORITY: LOW (Feature works with metadata workaround)
-- 
-- CURRENT STATE (2 workarounds):
-- 1. Shot clock violations recorded as generic turnovers (modifier: NULL)
--    - Violation type stored in metadata: { violationType: 'shot_clock_violation' }
-- 2. Team turnovers use user ID as proxy player (game_stats_player_required constraint)
--    - Metadata flags: { isTeamTurnover: true, proxyPlayerId: '...' }
-- 
-- AFTER MIGRATION:
-- 1. Shot clock violations can use modifier: 'shot_clock_violation'
-- 2. Team turnovers can have both player_id AND custom_player_id as NULL
-- 3. Enables proper analytics without proxy player pollution
-- 4. Maintains backward compatibility
-- 
-- ============================================================================

-- ============================================================================
-- STEP 1: BACKUP - Check current constraint definition
-- ============================================================================

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as current_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- ============================================================================
-- STEP 2: CHECK - Verify existing shot clock violations in metadata
-- ============================================================================

-- Count existing violations stored in metadata
SELECT 
    COUNT(*) as violation_count,
    'Existing shot clock violations (stored in metadata)' as description
FROM public.game_stats
WHERE stat_type = 'turnover'
AND modifier IS NULL
AND metadata->>'violationType' = 'shot_clock_violation';

-- Show sample violations
SELECT 
    id,
    game_id,
    team_id,
    player_id,
    stat_type,
    modifier,
    metadata,
    created_at
FROM public.game_stats
WHERE stat_type = 'turnover'
AND modifier IS NULL
AND metadata->>'violationType' = 'shot_clock_violation'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: MIGRATION - Update constraints (WRITE OPERATION)
-- ============================================================================

BEGIN;

-- 3.1: Drop old modifier constraint
ALTER TABLE public.game_stats 
DROP CONSTRAINT IF EXISTS game_stats_modifier_check;

RAISE NOTICE '✅ Old modifier constraint dropped';

-- 3.2: Create new modifier constraint with shot_clock_violation support
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
    -- Fouls: personal, shooting, technical, offensive, flagrant, 1-and-1 (UNCHANGED)
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', 'technical', 'offensive', 'flagrant', '1-and-1'))
    OR
    -- ✅ NEW: Turnovers can now have modifiers OR be NULL
    -- NULL: Generic turnover, bad pass, lost ball, etc.
    -- 'shot_clock_violation': Shot clock violation
    -- 'traveling': Traveling violation
    -- 'offensive_foul': Offensive foul turnover
    -- 'steal': Turnover caused by steal (auto-generated)
    (stat_type = 'turnover' AND (
      modifier IS NULL 
      OR modifier IN ('shot_clock_violation', 'traveling', 'offensive_foul', 'steal', 'bad_pass', 'lost_ball', 'double_dribble', '3_seconds', '5_seconds', '8_seconds', 'backcourt', 'offensive_goaltending')
    ))
    OR
    -- Assist, steal, block: NULL only (UNCHANGED)
    (stat_type IN ('assist', 'steal', 'block') AND modifier IS NULL)
  )
);

RAISE NOTICE '✅ New modifier constraint created with shot_clock_violation support';

-- 3.3: Drop old player requirement constraint
ALTER TABLE public.game_stats 
DROP CONSTRAINT IF EXISTS game_stats_player_required;

RAISE NOTICE '✅ Old player_required constraint dropped';

-- 3.4: Create new player requirement constraint (allows team-level stats)
-- ✅ NEW: Allows BOTH player_id and custom_player_id to be NULL for team turnovers
ALTER TABLE public.game_stats 
ADD CONSTRAINT game_stats_player_required 
CHECK (
  -- Regular stats: Require exactly one player identifier
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR 
  (player_id IS NULL AND custom_player_id IS NOT NULL) OR
  -- ✅ NEW: Team turnovers: Allow both to be NULL if metadata indicates team turnover
  (player_id IS NULL AND custom_player_id IS NULL AND stat_type = 'turnover' AND metadata->>'isTeamTurnover' = 'true')
);

RAISE NOTICE '✅ New player_required constraint created (allows team turnovers)';

-- 3.3: Test the new constraint
DO $$
BEGIN
    -- Test 1: Shot clock violation should work
    BEGIN
        INSERT INTO game_stats (
            game_id, team_id, stat_type, modifier, 
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'turnover', 'shot_clock_violation',
            1, 10, 30, 1
        );
        RAISE NOTICE '✅ Test 1 PASSED: shot_clock_violation modifier accepted';
        ROLLBACK TO SAVEPOINT test1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Test 1 FAILED: %', SQLERRM;
        ROLLBACK TO SAVEPOINT test1;
    END;
    
    -- Test 2: NULL modifier should still work (backward compatibility)
    BEGIN
        SAVEPOINT test2;
        INSERT INTO game_stats (
            game_id, team_id, stat_type, modifier, 
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'turnover', NULL,
            1, 10, 30, 1
        );
        RAISE NOTICE '✅ Test 2 PASSED: NULL modifier still accepted (backward compatible)';
        ROLLBACK TO SAVEPOINT test2;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Test 2 FAILED: %', SQLERRM;
        ROLLBACK TO SAVEPOINT test2;
    END;
    
    -- Test 3: Invalid modifier should fail
    BEGIN
        SAVEPOINT test3;
        INSERT INTO game_stats (
            game_id, team_id, stat_type, modifier, 
            quarter, game_time_minutes, game_time_seconds, stat_value
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'turnover', 'invalid_modifier',
            1, 10, 30, 1
        );
        RAISE NOTICE '❌ Test 3 FAILED: Invalid modifier was accepted (should have been rejected)';
        ROLLBACK TO SAVEPOINT test3;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✅ Test 3 PASSED: Invalid modifier rejected as expected';
        ROLLBACK TO SAVEPOINT test3;
    END;
END $$;

-- Review changes before committing
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as new_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- ⚠️ IMPORTANT: Review the output above before committing
-- If everything looks good, commit the transaction
-- If not, rollback with: ROLLBACK;

COMMIT;

RAISE NOTICE '✅ Migration complete - shot_clock_violation modifier now supported';

-- ============================================================================
-- STEP 4: OPTIONAL - Migrate existing violations from metadata to modifier
-- ============================================================================

-- ⚠️ OPTIONAL: Update existing violations to use new modifier
-- This is NOT required - existing records work fine with NULL modifier
-- Only run this if you want to normalize historical data

/*
BEGIN;

UPDATE public.game_stats
SET modifier = 'shot_clock_violation'
WHERE stat_type = 'turnover'
AND modifier IS NULL
AND metadata->>'violationType' = 'shot_clock_violation';

-- Check how many were updated
SELECT 
    COUNT(*) as updated_count,
    'Violations migrated from metadata to modifier' as description
FROM public.game_stats
WHERE stat_type = 'turnover'
AND modifier = 'shot_clock_violation';

COMMIT;
*/

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Verify constraint is updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as final_definition,
    'Should include shot_clock_violation' as expected
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

-- Show turnover modifier distribution
SELECT 
    modifier,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.game_stats
WHERE stat_type = 'turnover'
GROUP BY modifier
ORDER BY count DESC;

SELECT '=== MIGRATION COMPLETE ===' as status;

-- ============================================================================
-- ROLLBACK (if needed)
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
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', 'technical', 'offensive', 'flagrant', '1-and-1'))
    OR
    (stat_type IN ('assist', 'steal', 'block', 'turnover') AND modifier IS NULL)  -- OLD VERSION
  )
);
*/

