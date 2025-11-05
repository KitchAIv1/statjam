-- ============================================================================
-- PLAYER IMAGES STORAGE BUCKET
-- ============================================================================
-- Purpose: Create storage bucket for player profile and pose photos
-- Bucket: player-images
-- Access: Public read, authenticated write
-- Max Size: 5MB per file
-- Allowed Types: JPEG, PNG, WebP, GIF
-- ============================================================================

-- Create the player-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'player-images',
  'player-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own player images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'player-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Users can update their own player images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'player-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own player images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'player-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to all player images
CREATE POLICY "Public can view player images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'player-images');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify bucket was created
-- SELECT * FROM storage.buckets WHERE id = 'player-images';

-- Verify policies were created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%player images%';

