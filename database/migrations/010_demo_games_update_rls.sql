-- ============================================================================
-- FIX: Allow stat admins to UPDATE demo games (automation settings)
-- 
-- ISSUE: Stat admins cannot save automation settings for demo games
-- ERROR: RLS policy blocks UPDATE because demo games have no stat_admin_id
-- 
-- ROOT CAUSE: games_update_policy only allows updates if:
-- 1. stat_admin_id = auth.uid() (but demo games have NULL stat_admin_id)
-- 2. User is the tournament organizer
-- 
-- SOLUTION: Update games UPDATE policy to allow:
-- 1. Updates for games assigned to the stat admin (stat_admin_id = auth.uid())
-- 2. Updates for demo games (is_demo = true) by any stat admin
-- 3. Updates by tournament organizers (existing behavior)
-- ============================================================================

-- Step 1: Check current UPDATE policy on games
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    with_check
FROM pg_policies 
WHERE tablename = 'games'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Step 2: Drop existing UPDATE policy
DROP POLICY IF EXISTS "games_update_policy" ON public.games;

-- Step 3: Recreate UPDATE policy with demo game support
CREATE POLICY "games_update_policy" ON public.games
FOR UPDATE TO authenticated
USING (
  -- Stat admins can update their assigned games
  stat_admin_id = auth.uid()
  OR
  -- Stat admins can update demo games
  is_demo = true
  OR
  -- Organizers can update games in their tournaments
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = games.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Same conditions for the updated values
  stat_admin_id = auth.uid()
  OR
  is_demo = true
  OR
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = games.tournament_id 
    AND t.organizer_id = auth.uid()
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
WHERE tablename = 'games'
AND policyname = 'games_update_policy';

-- Step 5: Success message
SELECT '=== DEMO GAMES UPDATE RLS SETUP COMPLETE ===' as status;

