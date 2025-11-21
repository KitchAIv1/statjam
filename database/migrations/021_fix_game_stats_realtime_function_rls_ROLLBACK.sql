-- ============================================================================
-- ROLLBACK: Remove Function-Based RLS Policy for game_stats
-- 
-- USE THIS IF: The function-based policy causes issues or doesn't work
-- 
-- SAFETY: This only removes the new policy and function, all existing policies remain intact
-- ============================================================================

-- Step 1: Remove the function-based policy
DROP POLICY IF EXISTS "game_stats_realtime_function_select" ON public.game_stats;

-- Step 2: Remove the function (optional - can keep for future use)
DROP FUNCTION IF EXISTS public.is_game_stats_public(UUID);

-- Step 3: Verify rollback was successful
SELECT 
    '=== ROLLBACK VERIFICATION ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename = 'game_stats' 
            AND policyname = 'game_stats_realtime_function_select'
        ) THEN '❌ Policy still exists - rollback failed'
        ELSE '✅ Policy removed - rollback successful'
    END as policy_rollback_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'is_game_stats_public'
        ) THEN '⚠️ Function still exists (optional - can keep)'
        ELSE '✅ Function removed'
    END as function_rollback_status;

-- Step 4: List remaining SELECT policies (should not include game_stats_realtime_function_select)
SELECT 
    '=== REMAINING SELECT POLICIES ===' as status,
    policyname,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 5: Confirm original policies still exist
SELECT 
    '=== ORIGINAL POLICIES CHECK ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename = 'game_stats' 
            AND policyname = 'game_stats_public_read'
        ) THEN '✅ Original policy (game_stats_public_read) still exists'
        ELSE '❌ Original policy missing - investigate'
    END as original_policy_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND tablename = 'game_stats' 
            AND policyname = 'game_stats_realtime_select'
        ) THEN '✅ Previous policy (game_stats_realtime_select) still exists'
        ELSE 'ℹ️ Previous policy not found (may have been removed)'
    END as previous_policy_status;

SELECT '=== ROLLBACK COMPLETE ===' as final_status;

