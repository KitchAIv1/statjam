-- Create storage bucket for NBA card assets
-- This includes player photos, processed images, and generated cards

-- Create the card-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-assets',
  'card-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the card-assets bucket

-- Policy: Users can upload their own photos
CREATE POLICY "Users can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own photos
CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own photos
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to generated cards (for sharing)
CREATE POLICY "Public read access to generated cards" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND (storage.foldername(name))[2] = 'generated-cards'
);

-- Policy: Admins can view all assets (for moderation)
CREATE POLICY "Admins can view all card assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'card-assets' 
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add comments for documentation
COMMENT ON POLICY "Users can upload their own photos" ON storage.objects IS 'Allows users to upload photos to their own folder in card-assets bucket';
COMMENT ON POLICY "Public read access to generated cards" ON storage.objects IS 'Allows public access to generated card images for sharing purposes';
