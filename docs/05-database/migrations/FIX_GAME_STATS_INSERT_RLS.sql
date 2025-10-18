-- ============================================================================
-- FIX: game_stats INSERT RLS Policy for Stat Admins
-- 
-- ISSUE: GameServiceV3 getting 403 error when trying to INSERT into game_stats
-- ERROR: "new row violates row-level security policy for table \"stats\""
-- 
-- SOLUTION: Add INSERT policy for stat_admin users on game_stats table
-- ============================================================================

-- Check current policies on game_stats
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;

-- Add INSERT policy for stat_admin users on game_stats
CREATE POLICY "game_stats_stat_admin_insert" ON public.game_stats
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_stats.game_id AND g.stat_admin_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    with_check
FROM pg_policies 
WHERE tablename = 'game_stats'
AND policyname = 'game_stats_stat_admin_insert';

-- Test query (replace with actual stat_admin user ID)
/*
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
