-- ============================================================================
-- FIX: Ensure RLS Policies Allow Photo URL Updates
-- ============================================================================
-- Purpose: Fix RLS policies to allow coaches to UPDATE photo URLs
-- Issue: UPDATE operations need both USING and WITH CHECK clauses
-- ============================================================================

-- STEP 1: Check current UPDATE policies
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'custom_players'
AND cmd = 'UPDATE';

-- STEP 2: Drop existing coach access policy if it doesn't have WITH CHECK
-- (We'll recreate it with proper WITH CHECK clause)
DROP POLICY IF EXISTS "custom_players_coach_access" ON custom_players;

-- STEP 3: Recreate policy with both USING and WITH CHECK clauses
-- This ensures UPDATE operations work properly
CREATE POLICY "custom_players_coach_access"
ON custom_players
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

-- STEP 4: Verify the policy was created correctly
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'custom_players'
AND policyname = 'custom_players_coach_access';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, try updating a custom player's photo URL:
-- 
-- UPDATE custom_players
-- SET profile_photo_url = 'https://test.com/photo.jpg'
-- WHERE id = 'YOUR_PLAYER_ID'
-- AND coach_id = auth.uid()
-- RETURNING id, name, profile_photo_url;
--
-- If this works, the RLS policy is fixed.
-- ============================================================================

