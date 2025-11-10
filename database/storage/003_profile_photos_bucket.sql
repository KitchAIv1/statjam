-- ============================================================================
-- STORAGE BUCKET: Profile Photos
-- ============================================================================
-- Purpose: Create storage bucket for user profile photos
-- Date: 2025-11-10
-- ============================================================================

-- Step 1: Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up RLS policies for profile photos

-- Policy 1: Anyone can view profile photos (public bucket)
CREATE POLICY "Public profile photos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy 2: Users can upload their own profile photo
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own profile photo
CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own profile photo
CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check if bucket was created
SELECT id, name, public
FROM storage.buckets
WHERE id = 'profile-photos';

-- Check policies
SELECT policyname, cmd as command
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%profile photo%'
ORDER BY policyname;

