-- ============================================================================
-- TEST: Verify Storage Policies Allow Custom Player Photo Uploads
-- ============================================================================
-- Purpose: Test if storage policies are correctly configured
-- Run this as the coach who owns the custom player
-- ============================================================================

-- STEP 1: Verify you're authenticated as the coach
SELECT 
  auth.uid() as current_user_id,
  '87bdbce5-fb1a-441e-adcf-4d6fe5c4365e' as expected_coach_id,
  CASE 
    WHEN auth.uid()::text = '87bdbce5-fb1a-441e-adcf-4d6fe5c4365e' THEN '✅ Match'
    ELSE '❌ Mismatch - you are not logged in as the coach'
  END as auth_check;

-- STEP 2: Verify custom player exists and coach relationship
SELECT 
  cp.id,
  cp.name,
  cp.coach_id,
  CASE 
    WHEN cp.coach_id = auth.uid() THEN '✅ Coach owns this player'
    ELSE '❌ Coach does NOT own this player'
  END as ownership_check
FROM custom_players cp
WHERE cp.id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- STEP 3: Check storage policies for INSERT
-- Look for policies that allow INSERT to custom-players/{customPlayerId}/
SELECT 
  policyname,
  cmd,
  with_check as policy_condition
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND cmd = 'INSERT'
AND (
  with_check::text LIKE '%custom-players%' OR
  with_check::text LIKE '%custom_players%'
)
ORDER BY policyname;

-- STEP 4: Test the storage policy logic manually
-- This simulates what the policy should check
SELECT 
  cp.id as custom_player_id,
  cp.name,
  cp.coach_id,
  auth.uid() as current_user,
  CASE 
    WHEN cp.coach_id = auth.uid() THEN '✅ Policy would allow'
    ELSE '❌ Policy would BLOCK'
  END as policy_result
FROM custom_players cp
WHERE cp.id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- STEP 5: List all storage policies for player-images bucket
SELECT 
  policyname,
  cmd,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND (
  qual::text LIKE '%player-images%' OR
  with_check::text LIKE '%player-images%'
)
ORDER BY cmd, policyname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- STEP 1: Should show "✅ Match"
-- STEP 2: Should show "✅ Coach owns this player"
-- STEP 3: Should show at least one policy with "custom-players" in condition
-- STEP 4: Should show "✅ Policy would allow"
-- STEP 5: Should show policies that allow INSERT to custom-players paths
-- ============================================================================
-- If any step fails, that's the issue to fix
-- ============================================================================

