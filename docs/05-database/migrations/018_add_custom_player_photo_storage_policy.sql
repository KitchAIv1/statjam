-- ============================================================================
-- MIGRATION: Add Storage Policy for Custom Player Photos
-- ============================================================================
-- Purpose: Allow coaches to upload photos for custom players they created
-- Date: 2025-01-XX
-- ============================================================================
--
-- ISSUE:
-- The existing storage policy for player-images bucket only allows uploads
-- where the first folder matches auth.uid(). Custom player photos are stored
-- at custom-players/{customPlayerId}/, which violates this policy.
--
-- SOLUTION:
-- Add a new policy that allows coaches to upload to custom-players/{customPlayerId}/
-- if they own the custom player (coach_id = auth.uid()).
-- ============================================================================

-- STEP 1: Show current policies for context
SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%player%'
ORDER BY policyname;

-- STEP 2: Drop existing policies if they exist (to fix the bug)
DROP POLICY IF EXISTS "Coaches can upload custom player photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update custom player photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete custom player photos" ON storage.objects;

-- STEP 3: Create policy for custom player photo uploads (INSERT)
-- Note: 'name' refers to the storage object path (e.g., 'custom-players/{customPlayerId}/profile.jpg')
CREATE POLICY "Coaches can upload custom player photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-images'
  AND (storage.foldername(name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 4: Create policy for custom player photo updates (UPDATE)
CREATE POLICY "Coaches can update custom player photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND (storage.foldername(name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 5: Create policy for custom player photo deletion (DELETE)
CREATE POLICY "Coaches can delete custom player photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-images'
  AND (storage.foldername(name))[1] = 'custom-players'
  AND EXISTS (
    SELECT 1
    FROM custom_players cp
    WHERE cp.id::text = (storage.foldername(name))[2]
    AND cp.coach_id = auth.uid()
  )
);

-- STEP 6: Verify policies were created
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
-- VERIFICATION QUERIES
-- ============================================================================
-- Test that the policy works (run as authenticated coach):
--
-- 1. Check if custom player exists and coach owns it:
--    SELECT id, name, coach_id 
--    FROM custom_players 
--    WHERE coach_id = auth.uid() 
--    LIMIT 1;
--
-- 2. Test upload path structure:
--    The path should be: custom-players/{customPlayerId}/profile.jpg
--    Example: custom-players/5e5f8083-4f78-49d8-b24a-e7dfe11a9eb1/profile.jpg
--
-- ============================================================================

