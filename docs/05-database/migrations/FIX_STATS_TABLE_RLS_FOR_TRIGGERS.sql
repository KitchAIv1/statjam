-- ============================================================================
-- FIX: RLS Policy for 'stats' table (Aggregate Statistics)
-- 
-- ISSUE: GameServiceV3 getting 403 error when inserting into game_stats
-- ERROR: "new row violates row-level security policy for table \"stats\""
-- 
-- ROOT CAUSE: Database trigger tries to update 'stats' table after game_stats INSERT
-- but 'stats' table lacks proper RLS policies for stat_admin users
-- 
-- SOLUTION: Add comprehensive RLS policies for 'stats' table
-- ============================================================================

-- Step 1: Check if RLS is enabled on stats table
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
WHERE tablename = 'stats';

-- Step 2: Enable RLS on stats table if not already enabled
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;

-- Step 3: Check current policies on stats table
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

-- Step 4: Drop any existing conflicting policies
DROP POLICY IF EXISTS "stats_stat_admin_manage" ON public.stats;
DROP POLICY IF EXISTS "stats_public_read" ON public.stats;
DROP POLICY IF EXISTS "stats_player_read" ON public.stats;

-- Step 5: Create comprehensive RLS policies for stats table

-- Policy 1: Stat admins can manage (SELECT, INSERT, UPDATE, DELETE) stats for their assigned games
CREATE POLICY "stats_stat_admin_manage" ON public.stats
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = stats.game_id AND g.stat_admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = stats.game_id AND g.stat_admin_id = auth.uid()
  )
);

-- Policy 2: Public can read stats for live/completed games
CREATE POLICY "stats_public_read" ON public.stats
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = stats.game_id 
    AND g.status IN ('live', 'LIVE', 'in_progress', 'IN_PROGRESS', 'completed', 'COMPLETED')
  )
);

-- Policy 3: Players can read their own stats
CREATE POLICY "stats_player_read_self" ON public.stats
FOR SELECT TO authenticated
USING (player_id = auth.uid());

-- Step 6: Verify policies were created successfully
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

-- Step 7: Test INSERT into game_stats (should now work without 403 error)
/*
-- Test query (replace with actual values)
INSERT INTO public.game_stats (
  game_id, player_id, team_id, stat_type, modifier, quarter, 
  game_time_minutes, game_time_seconds, stat_value
) VALUES (
  '66744655-4e6e-4c75-a999-06abd5818647',
  '550e8400-e29b-41d4-a716-446655440001', 
  '0bd4885a-54df-401d-ae89-90b3dd517344',
  'field_goal', 'made', 1, 11, 44, 2
);
*/

-- Step 8: Verify no RLS violations
SELECT '=== STATS TABLE RLS SETUP COMPLETE ===' as status;
