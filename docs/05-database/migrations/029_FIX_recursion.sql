-- ============================================================================
-- EMERGENCY FIX: Remove recursive policies
-- ============================================================================
-- The policies created caused infinite recursion because:
-- games policy → checks game_videos → game_videos policy checks games → LOOP
--
-- Solution: Use a SECURITY DEFINER function to bypass RLS when checking
-- ============================================================================

-- STEP 1: Drop the problematic policies immediately
DROP POLICY IF EXISTS "games_video_stat_admin_select" ON games;
DROP POLICY IF EXISTS "games_video_stat_admin_update" ON games;

-- STEP 2: Create a SECURITY DEFINER function that bypasses RLS
-- This function checks if the user is assigned to the game's video
CREATE OR REPLACE FUNCTION is_video_assigned_stat_admin(game_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM game_videos gv
    WHERE gv.game_id = game_uuid 
    AND gv.assigned_stat_admin_id = auth.uid()
  );
$$;

-- STEP 3: Recreate policies using the function (no recursion)
CREATE POLICY "games_video_stat_admin_select" ON games
  FOR SELECT TO authenticated
  USING (is_video_assigned_stat_admin(id));

CREATE POLICY "games_video_stat_admin_update" ON games
  FOR UPDATE TO authenticated
  USING (is_video_assigned_stat_admin(id))
  WITH CHECK (is_video_assigned_stat_admin(id));

-- STEP 4: Verify policies work
SELECT 
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename = 'games'
AND policyname LIKE 'games_video%'
ORDER BY policyname;

-- ============================================================================
-- EXPLANATION:
-- SECURITY DEFINER functions run with the privileges of the function OWNER
-- (typically the superuser), bypassing RLS on the tables they query.
-- This breaks the circular dependency while still providing proper access.
-- ============================================================================

