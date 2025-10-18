-- ============================================================================
-- REMOVE DUPLICATE INSERT POLICY
-- 
-- ISSUE: We have both "game_stats_stat_admin_manage" (ALL) and 
--        "game_stats_stat_admin_insert" (INSERT) which might conflict
-- 
-- SOLUTION: Remove the duplicate INSERT policy since ALL covers INSERT
-- ============================================================================

-- Remove the duplicate INSERT policy
DROP POLICY IF EXISTS "game_stats_stat_admin_insert" ON public.game_stats;

-- Verify only the ALL policy remains
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
AND policyname LIKE '%stat_admin%'
ORDER BY policyname;
