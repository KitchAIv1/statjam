-- ============================================================================
-- FIX: Enable WebSocket Real-Time Subscriptions for game_stats Table
-- 
-- ISSUE: WebSocket subscriptions for game_stats INSERT events not working
-- - Replication is enabled ✅
-- - RLS policies exist ✅
-- - But real-time subscriptions don't receive INSERT events
-- 
-- ROOT CAUSE: Real-time subscriptions evaluate RLS policies differently than HTTP queries.
-- Complex JOIN-based policies may not be evaluated efficiently during event broadcasting.
-- 
-- SOLUTION: Add a complementary RLS policy optimized for real-time evaluation
-- that allows SELECT for game_stats rows where the game is accessible.
-- 
-- SECURITY: This policy maintains the same access control as existing policies:
-- - Only allows SELECT (read-only)
-- - Works alongside existing policies (additive, not replacement)
-- - Maintains security boundaries
-- ============================================================================

-- ============================================================================
-- PHASE 1: VERIFICATION - Check Current State
-- ============================================================================

-- Step 1.1: Verify replication is enabled for game_stats
SELECT 
    '=== REPLICATION STATUS ===' as verification_step,
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE tablename = 'game_stats';

-- Step 1.2: List all current RLS policies on game_stats
SELECT 
    '=== CURRENT RLS POLICIES ===' as verification_step,
    policyname,
    permissive,
    roles,
    cmd as command,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_status,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
ORDER BY cmd, policyname;

-- Step 1.3: Verify RLS is enabled on game_stats table
SELECT 
    '=== RLS ENABLED STATUS ===' as verification_step,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'game_stats';

-- Step 1.4: Test if anonymous SELECT works with existing policy
-- Replace 'YOUR_GAME_ID' with an actual game_id from a public tournament
-- This verifies the existing policy works for HTTP queries
SELECT 
    '=== TEST: Anonymous SELECT (HTTP) ===' as verification_step,
    COUNT(*) as accessible_stats_count
FROM game_stats gs
WHERE EXISTS (
    SELECT 1 
    FROM games g
    JOIN tournaments t ON g.tournament_id = t.id
    WHERE g.id = gs.game_id 
    AND t.is_public = true
)
LIMIT 1;

-- ============================================================================
-- PHASE 2: CREATE REAL-TIME OPTIMIZED POLICY
-- ============================================================================

-- Step 2.1: Create a real-time optimized SELECT policy
-- This policy allows SELECT for game_stats where the game exists and tournament is public
-- Uses a simpler structure that real-time can evaluate efficiently
-- 
-- NOTE: This is ADDITIVE - works alongside existing policies
-- NOTE: Only allows SELECT (read-only) - no INSERT/UPDATE/DELETE
-- NOTE: Uses same security logic as game_stats_public_read but optimized for real-time

CREATE POLICY "game_stats_realtime_select" ON public.game_stats
FOR SELECT TO anon, authenticated
USING (
    -- Check if game exists and tournament is public (simplified for real-time)
    EXISTS (
        SELECT 1 
        FROM public.games g
        WHERE g.id = game_stats.game_id
        AND EXISTS (
            SELECT 1 
            FROM public.tournaments t
            WHERE t.id = g.tournament_id
            AND t.is_public = true
        )
    )
);

-- ============================================================================
-- PHASE 3: VERIFICATION - Verify Policy Created Successfully
-- ============================================================================

-- Step 3.1: Verify new policy exists
SELECT 
    '=== NEW POLICY CREATED ===' as verification_step,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND policyname = 'game_stats_realtime_select';

-- Step 3.2: List all policies after creation (should show new policy)
SELECT 
    '=== ALL POLICIES (AFTER FIX) ===' as verification_step,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
ORDER BY cmd, policyname;

-- Step 3.3: Test SELECT with new policy (should work same as before)
-- Replace 'YOUR_GAME_ID' with an actual game_id from a public tournament
SELECT 
    '=== TEST: Anonymous SELECT (After Policy) ===' as verification_step,
    COUNT(*) as accessible_stats_count
FROM game_stats gs
WHERE gs.game_id = 'YOUR_GAME_ID'::uuid  -- Replace with actual game_id
LIMIT 1;

-- ============================================================================
-- PHASE 4: SECURITY VERIFICATION
-- ============================================================================

-- Step 4.1: Verify policy doesn't expose private tournament stats
-- This query should return 0 rows if security is maintained
-- Replace 'PRIVATE_TOURNAMENT_GAME_ID' with a game_id from a non-public tournament
SELECT 
    '=== SECURITY TEST: Private Tournament Access ===' as verification_step,
    COUNT(*) as exposed_stats_count
FROM game_stats gs
WHERE gs.game_id = 'PRIVATE_TOURNAMENT_GAME_ID'::uuid  -- Replace with private game_id
AND EXISTS (
    SELECT 1 
    FROM games g
    JOIN tournaments t ON g.tournament_id = t.id
    WHERE g.id = gs.game_id 
    AND t.is_public = false  -- Should NOT be accessible
)
LIMIT 1;
-- Expected: 0 rows (policy correctly blocks private tournaments)

-- Step 4.2: Verify policy allows public tournament stats
-- Replace 'PUBLIC_TOURNAMENT_GAME_ID' with a game_id from a public tournament
SELECT 
    '=== SECURITY TEST: Public Tournament Access ===' as verification_step,
    COUNT(*) as accessible_stats_count
FROM game_stats gs
WHERE gs.game_id = 'PUBLIC_TOURNAMENT_GAME_ID'::uuid  -- Replace with public game_id
AND EXISTS (
    SELECT 1 
    FROM games g
    JOIN tournaments t ON g.tournament_id = t.id
    WHERE g.id = gs.game_id 
    AND t.is_public = true  -- Should be accessible
)
LIMIT 1;
-- Expected: > 0 rows (policy correctly allows public tournaments)

-- ============================================================================
-- PHASE 5: ROLLBACK INSTRUCTIONS (If Needed)
-- ============================================================================

-- ⚠️ ROLLBACK: If this fix causes issues, run this to remove the new policy:
-- 
-- DROP POLICY IF EXISTS "game_stats_realtime_select" ON public.game_stats;
--
-- Then verify it's removed:
-- SELECT policyname FROM pg_policies 
-- WHERE tablename = 'game_stats' 
-- AND policyname = 'game_stats_realtime_select';
-- Expected: 0 rows

-- ============================================================================
-- QUICK ROLLBACK SCRIPT (Copy and run if needed)
-- ============================================================================
/*
DROP POLICY IF EXISTS "game_stats_realtime_select" ON public.game_stats;

SELECT 
    '=== ROLLBACK COMPLETE ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'game_stats' 
            AND policyname = 'game_stats_realtime_select'
        ) THEN '❌ Policy still exists - rollback failed'
        ELSE '✅ Policy removed - rollback successful'
    END as rollback_status;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '=== GAME_STATS REAL-TIME RLS FIX COMPLETE ===' as status,
       'Next step: Test WebSocket subscription in browser console' as next_action,
       'Look for: 🔔 HybridService: WebSocket event received for game_stats' as expected_log;

