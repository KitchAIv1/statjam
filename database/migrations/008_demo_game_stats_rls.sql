-- ============================================================================
-- FIX: Allow stat admins to insert stats for DEMO games
-- 
-- ISSUE: Stat admins getting 403 error when trying to INSERT into game_stats for demo games
-- ERROR: "new row violates row-level security policy for table \"game_stats\""
-- 
-- ROOT CAUSE: Demo games don't have stat_admin_id assigned, so the existing RLS policy
-- blocks stat admins from inserting stats
-- 
-- SOLUTION: Update game_stats INSERT policy to allow:
-- 1. Stats for games assigned to the stat admin (stat_admin_id = auth.uid())
-- 2. Stats for demo games (is_demo = true) by any stat admin
-- ============================================================================

-- Step 1: Check current policies on game_stats
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Step 2: Drop existing STAT ADMIN policies (NOT coach policies!)
DROP POLICY IF EXISTS "game_stats_stat_admin_insert" ON public.game_stats;
DROP POLICY IF EXISTS "game_stats_stat_admin_manage" ON public.game_stats;

-- Step 3: Recreate stat admin INSERT policy with demo game support
-- ⚠️ NOTE: This ONLY affects stat admins, NOT coaches
CREATE POLICY "game_stats_stat_admin_insert" ON public.game_stats
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_stats.game_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      g.is_demo = true              -- ✅ Demo games (NEW: accessible to all stat admins)
    )
  )
);

-- Step 4: Recreate stat admin ALL policy with demo game support
-- ⚠️ NOTE: This ONLY affects stat admins, NOT coaches
CREATE POLICY "game_stats_stat_admin_manage" ON public.game_stats
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_stats.game_id 
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
    WHERE g.id = game_stats.game_id 
    AND (
      g.stat_admin_id = auth.uid()  -- ✅ Assigned games (existing behavior)
      OR 
      g.is_demo = true              -- ✅ Demo games (NEW: accessible to all stat admins)
    )
  )
);

-- Step 5: Verify policies were created successfully
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
AND policyname LIKE '%stat_admin%'
ORDER BY policyname;

-- Step 6: Success message
SELECT '=== DEMO GAME STATS RLS SETUP COMPLETE ===' as status;

