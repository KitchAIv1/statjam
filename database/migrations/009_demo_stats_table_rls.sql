-- ============================================================================
-- FIX: Allow stat admins to manage aggregate stats for DEMO games
-- 
-- ISSUE: After fixing game_stats RLS, now getting 403 on the "stats" table
-- ERROR: "new row violates row-level security policy for table \"stats\""
-- 
-- ROOT CAUSE: Database triggers update the "stats" (aggregate) table after
-- inserting into game_stats, but the stats table RLS doesn't allow demo games
-- 
-- SOLUTION: Update stats table RLS policy to allow:
-- 1. Stats for games assigned to the stat admin (stat_admin_id = auth.uid())
-- 2. Stats for demo games (is_demo = true) by any stat admin
-- 
-- NOTE: The "stats" table uses "match_id" column (not "game_id")
-- ============================================================================

-- Step 1: Check current policies on stats table
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'stats'
ORDER BY policyname;

-- Step 2: Drop existing stat admin policy on stats table
DROP POLICY IF EXISTS "stats_stat_admin_manage" ON public.stats;

-- Step 3: Recreate stat admin policy with demo game support
-- ⚠️ IMPORTANT: stats table uses "match_id" column (not "game_id")
CREATE POLICY "stats_stat_admin_manage" ON public.stats
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = stats.match_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      g.is_demo = true              -- ✅ Demo games (NEW: accessible to all stat admins)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = stats.match_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      g.is_demo = true              -- ✅ Demo games (NEW: accessible to all stat admins)
    )
  )
);

-- Step 4: Verify policy was created successfully
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    with_check
FROM pg_policies 
WHERE tablename = 'stats'
AND policyname = 'stats_stat_admin_manage';

-- Step 5: Success message
SELECT '=== DEMO STATS TABLE RLS SETUP COMPLETE ===' as status;

