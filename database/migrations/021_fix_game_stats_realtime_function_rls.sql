-- ============================================================================
-- FIX: Function-Based RLS Policy for game_stats Real-Time Subscriptions
-- 
-- ISSUE: WebSocket subscriptions connect (SUBSCRIBED) but INSERT events blocked
-- - Subscriptions show SUBSCRIBED status ✅
-- - But no INSERT events received ❌
-- - RLS policy evaluation fails during real-time event broadcasting
-- 
-- ROOT CAUSE: Nested EXISTS policies may not evaluate efficiently during
-- INSERT event broadcasting, even though HTTP SELECT queries work fine.
-- 
-- SOLUTION: Create PostgreSQL function-based RLS policy that Supabase real-time
-- can evaluate more efficiently during INSERT event broadcasting.
-- 
-- SAFETY: 
-- - Additive (doesn't replace existing policies)
-- - Read-only (SELECT only)
-- - HTTP queries unaffected (existing policies still work)
-- - Easy rollback
-- ============================================================================

-- ============================================================================
-- PHASE 1: VERIFICATION - Check Current State
-- ============================================================================

-- Step 1.1: Verify existing policies
SELECT 
    '=== CURRENT GAME_STATS SELECT POLICIES ===' as verification_step,
    policyname,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 1.2: Check if function already exists
SELECT 
    '=== CHECK FUNCTION EXISTS ===' as verification_step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = 'is_game_stats_public'
        ) THEN '⚠️ Function already exists'
        ELSE '✅ Function does not exist (will create)'
    END as function_status;

-- ============================================================================
-- PHASE 2: CREATE HELPER FUNCTION
-- ============================================================================

-- Step 2.1: Create function to check if game_stats row is publicly accessible
-- This function checks if the game's tournament is public
-- Optimized for real-time evaluation
CREATE OR REPLACE FUNCTION public.is_game_stats_public(p_game_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.games g
    JOIN public.tournaments t ON g.tournament_id = t.id
    WHERE g.id = p_game_id
    AND t.is_public = true
  );
END;
$$;

-- Step 2.2: Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.is_game_stats_public(UUID) TO anon, authenticated;

-- Step 2.3: Add comment for documentation
COMMENT ON FUNCTION public.is_game_stats_public(UUID) IS 
'Checks if game_stats row is publicly accessible based on tournament.is_public. Used by RLS policies for real-time subscriptions.';

-- ============================================================================
-- PHASE 3: CREATE FUNCTION-BASED RLS POLICY
-- ============================================================================

-- Step 3.1: Create new RLS policy using the function
-- This policy is optimized for real-time evaluation
CREATE POLICY "game_stats_realtime_function_select" ON public.game_stats
FOR SELECT TO anon, authenticated
USING (
    public.is_game_stats_public(game_id)
);

-- ============================================================================
-- PHASE 4: VERIFICATION - Verify Function and Policy Created
-- ============================================================================

-- Step 4.1: Verify function was created
SELECT 
    '=== FUNCTION CREATED ===' as verification_step,
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    CASE 
        WHEN prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'is_game_stats_public';

-- Step 4.2: Verify function permissions
SELECT 
    '=== FUNCTION PERMISSIONS ===' as verification_step,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
AND routine_name = 'is_game_stats_public'
ORDER BY grantee, privilege_type;

-- Step 4.3: Verify new policy was created
SELECT 
    '=== NEW POLICY CREATED ===' as verification_step,
    policyname,
    permissive,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND policyname = 'game_stats_realtime_function_select';

-- Step 4.4: List all SELECT policies (should include new one)
SELECT 
    '=== ALL SELECT POLICIES (AFTER FIX) ===' as verification_step,
    policyname,
    roles,
    cmd as command
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================================================
-- PHASE 5: FUNCTIONAL TESTING
-- ============================================================================

-- Step 5.1: Test function directly with a real game_id
-- Replace 'YOUR_GAME_ID' with an actual game_id from a public tournament
-- Expected: Returns true for public tournaments, false for private
SELECT 
    '=== FUNCTION TEST ===' as verification_step,
    public.is_game_stats_public('YOUR_GAME_ID'::uuid) as is_public,
    'Replace YOUR_GAME_ID with actual game_id' as note;

-- Step 5.2: Test anonymous SELECT still works (HTTP fallback)
-- Replace 'YOUR_GAME_ID' with an actual game_id from a public tournament
SELECT 
    '=== HTTP SELECT TEST ===' as verification_step,
    COUNT(*) as accessible_stats_count
FROM game_stats gs
WHERE gs.game_id = 'YOUR_GAME_ID'::uuid  -- Replace with actual game_id
LIMIT 1;
-- Expected: > 0 rows (should work same as before)

-- Step 5.3: Test function with multiple game_ids
-- This verifies the function works correctly
SELECT 
    '=== FUNCTION BATCH TEST ===' as verification_step,
    g.id as game_id,
    public.is_game_stats_public(g.id) as is_public,
    t.is_public as tournament_is_public
FROM games g
JOIN tournaments t ON g.tournament_id = t.id
LIMIT 5;
-- Expected: is_public should match tournament_is_public

-- ============================================================================
-- PHASE 6: SECURITY VERIFICATION
-- ============================================================================

-- Step 6.1: Verify function doesn't expose private tournaments
-- Replace 'PRIVATE_GAME_ID' with a game_id from a non-public tournament
SELECT 
    '=== SECURITY TEST: Private Tournament ===' as verification_step,
    public.is_game_stats_public('PRIVATE_GAME_ID'::uuid) as is_public,
    'Should return false for private tournaments' as expected;
-- Expected: false (function correctly blocks private tournaments)

-- Step 6.2: Verify function allows public tournaments
-- Replace 'PUBLIC_GAME_ID' with a game_id from a public tournament
SELECT 
    '=== SECURITY TEST: Public Tournament ===' as verification_step,
    public.is_game_stats_public('PUBLIC_GAME_ID'::uuid) as is_public,
    'Should return true for public tournaments' as expected;
-- Expected: true (function correctly allows public tournaments)

-- ============================================================================
-- PHASE 7: ROLLBACK INSTRUCTIONS (If Needed)
-- ============================================================================

-- ⚠️ ROLLBACK: If this fix causes issues, run these commands:
-- 
-- 1. Drop the new policy:
-- DROP POLICY IF EXISTS "game_stats_realtime_function_select" ON public.game_stats;
--
-- 2. Drop the function (optional - can keep for future use):
-- DROP FUNCTION IF EXISTS public.is_game_stats_public(UUID);
--
-- 3. Verify rollback:
-- SELECT policyname FROM pg_policies 
-- WHERE tablename = 'game_stats' 
-- AND policyname = 'game_stats_realtime_function_select';
-- Expected: 0 rows

-- ============================================================================
-- QUICK ROLLBACK SCRIPT (Copy and run if needed)
-- ============================================================================
/*
-- Rollback: Remove function-based policy
DROP POLICY IF EXISTS "game_stats_realtime_function_select" ON public.game_stats;

-- Optional: Remove function (or keep for future use)
DROP FUNCTION IF EXISTS public.is_game_stats_public(UUID);

-- Verify rollback
SELECT 
    '=== ROLLBACK COMPLETE ===' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'game_stats' 
            AND policyname = 'game_stats_realtime_function_select'
        ) THEN '❌ Policy still exists - rollback failed'
        ELSE '✅ Policy removed - rollback successful'
    END as rollback_status;
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '=== FUNCTION-BASED RLS POLICY CREATED ===' as status,
       'Next step: Test WebSocket subscription in browser console' as next_action,
       'Look for: 🔔 HybridService: WebSocket event received for game_stats' as expected_log,
       'If still not working, check Supabase real-time replication settings' as troubleshooting;

