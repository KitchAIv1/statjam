-- ============================================================================
-- DIAGNOSE: Storage Upload Issue
-- ============================================================================
-- Purpose: Check if storage policies are blocking uploads
-- Issue: Database has URL but storage file doesn't exist
-- ============================================================================

-- STEP 1: Check ALL custom player files in storage
SELECT 
  name as file_path,
  id,
  bucket_id,
  created_at,
  updated_at,
  metadata->>'size' as file_size_bytes
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/%'
ORDER BY created_at DESC;

-- STEP 2: Check storage policies for INSERT operations
SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND cmd = 'INSERT'
AND (
  qual::text LIKE '%player-images%' OR
  with_check::text LIKE '%player-images%'
)
ORDER BY policyname;

-- STEP 3: Test if the storage path structure matches what the code expects
-- Expected path: custom-players/{customPlayerId}/profile.jpg
-- Let's check what files exist for any custom player
SELECT 
  name,
  (storage.foldername(name))[1] as folder1,
  (storage.foldername(name))[2] as folder2,
  (storage.foldername(name))[3] as filename
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/%'
LIMIT 10;

-- STEP 4: Check if there are any files that were uploaded but don't match expected pattern
SELECT 
  name,
  created_at
FROM storage.objects
WHERE bucket_id = 'player-images'
AND (
  name LIKE '%8bbb5f60-70af-46f6-b609-f00b62cea586%' OR
  name LIKE '%custom%'
)
ORDER BY created_at DESC;

-- STEP 5: Verify the custom player exists and coach relationship
SELECT 
  cp.id,
  cp.name,
  cp.coach_id,
  cp.profile_photo_url,
  u.email as coach_email
FROM custom_players cp
LEFT JOIN users u ON cp.coach_id = u.id
WHERE cp.id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- ============================================================================
-- DIAGNOSIS
-- ============================================================================
-- If STEP 1 shows NO files: Uploads are failing or never happening
-- If STEP 2 shows NO policies: Storage policies missing - need to create them
-- If STEP 4 shows files with different path: Path mismatch issue
-- ============================================================================

