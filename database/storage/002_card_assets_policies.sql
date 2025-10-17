-- RLS Policies for card-assets storage bucket
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can upload their own photos
CREATE POLICY "Users can upload their own photos to card-assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own photos
CREATE POLICY "Users can view their own photos in card-assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Users can update their own photos
CREATE POLICY "Users can update their own photos in card-assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Users can delete their own photos
CREATE POLICY "Users can delete their own photos in card-assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow public read access to generated cards (for sharing)
CREATE POLICY "Public read access to generated cards in card-assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND (storage.foldername(name))[2] = 'generated-cards'
);

-- Policy 6: Admins can view all assets (for moderation)
CREATE POLICY "Admins can view all card assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
