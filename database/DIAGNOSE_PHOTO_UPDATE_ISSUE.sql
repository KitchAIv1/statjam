-- ============================================================================
-- DIAGNOSE: Why Photo URLs Aren't Being Saved
-- ============================================================================
-- Purpose: Test if RLS policies are blocking photo URL updates
-- ============================================================================

-- STEP 1: Check if you can manually update a photo URL (as the coach)
-- Replace {custom_player_id} with actual ID (e.g., 8bbb5f60-70af-46f6-b609-f00b62cea586)
-- Replace {coach_id} with your coach ID (87bdbce5-fb1a-441e-adcf-4d6fe5c4365e)

-- Test update (should work if RLS allows it)
UPDATE custom_players
SET profile_photo_url = 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/profile.jpg'
WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586'
AND coach_id = '87bdbce5-fb1a-441e-adcf-4d6fe5c4365e'
RETURNING id, name, profile_photo_url;

-- STEP 2: Verify the update worked
SELECT 
  id,
  name,
  profile_photo_url,
  pose_photo_url,
  coach_id
FROM custom_players
WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- STEP 3: Check RLS policies for UPDATE operations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'custom_players'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- STEP 4: Check if storage files exist for the player
SELECT 
  name as file_path,
  created_at
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/%'
ORDER BY name;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- If STEP 1 fails: RLS is blocking updates - need to check UPDATE policies
-- If STEP 1 succeeds but app still fails: Code issue, not RLS
-- If STEP 4 shows files but STEP 2 shows NULL: Update isn't happening
-- ============================================================================

