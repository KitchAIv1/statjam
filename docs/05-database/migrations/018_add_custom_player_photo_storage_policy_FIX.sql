-- ============================================================================
-- MIGRATION: Fix Storage Policy for Custom Player Photos
-- ============================================================================
-- Purpose: Fix the buggy policies that use cp.name instead of storage path name
-- Date: 2025-01-XX
-- ============================================================================
--
-- BUG IDENTIFIED:
-- The existing policies incorrectly use:
--   storage.foldername((cp.name)::text)[2]
-- 
-- This is wrong because cp.name is the player's name (e.g., "John Doe"),
-- not the storage path. The 'name' in storage policy context refers to
-- the storage object path (e.g., 'custom-players/{customPlayerId}/profile.jpg').
--
-- CORRECT VERSION:
--   storage.foldername(name)[2]
--
-- Where 'name' is the storage object's path name.
-- ============================================================================

-- STEP 1: Drop the buggy policies
DROP POLICY IF EXISTS "Coaches can upload custom player photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update custom player photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete custom player photos" ON storage.objects;

-- STEP 2: Create CORRECT policy for custom player photo uploads (INSERT)
-- Note: 'name' in storage policy context = storage object path (storage.objects.name)
-- Example path: 'custom-players/5e5f8083-4f78-49d8-b24a-e7dfe11a9eb1/profile.jpg'
--   [1] = 'custom-players'
--   [2] = '5e5f8083-4f78-49d8-b24a-e7dfe11a9eb1' (customPlayerId)
-- 
-- IMPORTANT: Use storage.objects.name explicitly to avoid ambiguity
CREATE POLICY "Coaches can upload custom player photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-images'
  AND (storage.foldername(storage.objects.name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(storage.objects.name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 3: Create CORRECT policy for custom player photo updates (UPDATE)
CREATE POLICY "Coaches can update custom player photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND (storage.foldername(storage.objects.name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(storage.objects.name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 4: Create CORRECT policy for custom player photo deletion (DELETE)
CREATE POLICY "Coaches can delete custom player photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND (storage.foldername(storage.objects.name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(storage.objects.name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 5: Verify policies were created correctly
SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%custom player%'
ORDER BY policyname;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the policies show:
--   WHERE cp.id::text = (storage.foldername(name))[2]
-- 
-- NOT:
--   WHERE cp.id::text = (storage.foldername((cp.name)::text))[2]
--
-- The difference is critical:
-- - CORRECT: 'name' = storage object path
-- - WRONG: 'cp.name' = custom player's name field
-- ============================================================================

