-- ============================================================================
-- ROLLBACK: Remove game_stats_realtime_select Policy
-- 
-- USE THIS IF: The new policy causes issues or doesn't work as expected
-- 
-- SAFETY: This only removes the new policy, all existing policies remain intact
-- ============================================================================

-- Step 1: Remove the new policy
DROP POLICY IF EXISTS "game_stats_realtime_select" ON public.game_stats;

-- Step 2: Verify rollback was successful
SELECT 
    '=== ROLLBACK VERIFICATION ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename = 'game_stats' 
            AND policyname = 'game_stats_realtime_select'
        ) THEN '❌ Policy still exists - rollback failed'
        ELSE '✅ Policy removed - rollback successful'
    END as rollback_status;

-- Step 3: List remaining policies (should not include game_stats_realtime_select)
SELECT 
    '=== REMAINING POLICIES ===' as status,
    policyname,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 4: Confirm original policy still exists
SELECT 
    '=== ORIGINAL POLICY CHECK ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename = 'game_stats' 
            AND policyname = 'game_stats_public_read'
        ) THEN '✅ Original policy (game_stats_public_read) still exists'
        ELSE '❌ Original policy missing - investigate'
    END as original_policy_status;

SELECT '=== ROLLBACK COMPLETE ===' as final_status;

