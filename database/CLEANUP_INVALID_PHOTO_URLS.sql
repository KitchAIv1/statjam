-- ============================================================================
-- CLEANUP: Remove Invalid Photo URLs from Database
-- ============================================================================
-- Purpose: Remove photo URLs from custom_players that point to non-existent files
-- This fixes the issue where URLs were saved but uploads failed
-- ============================================================================

-- STEP 1: Find custom players with photo URLs that don't exist in storage
SELECT 
  cp.id,
  cp.name,
  cp.profile_photo_url,
  cp.pose_photo_url,
  CASE 
    WHEN cp.profile_photo_url IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM storage.objects 
          WHERE bucket_id = 'player-images' 
          AND name = REPLACE(cp.profile_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', '')
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
      END
    ELSE 'N/A'
  END as profile_photo_status,
  CASE 
    WHEN cp.pose_photo_url IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM storage.objects 
          WHERE bucket_id = 'player-images' 
          AND name = REPLACE(cp.pose_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', '')
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
      END
    ELSE 'N/A'
  END as pose_photo_status
FROM custom_players cp
WHERE cp.profile_photo_url IS NOT NULL OR cp.pose_photo_url IS NOT NULL
ORDER BY cp.created_at DESC;

-- STEP 2: Extract file paths from URLs and check if they exist
-- This is a more accurate check
WITH photo_urls AS (
  SELECT 
    cp.id,
    cp.name,
    cp.profile_photo_url,
    cp.pose_photo_url,
    -- Extract file path from URL
    CASE 
      WHEN cp.profile_photo_url IS NOT NULL THEN
        REPLACE(
          REPLACE(cp.profile_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', ''),
          'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images', ''
        )
      ELSE NULL
    END as profile_path,
    CASE 
      WHEN cp.pose_photo_url IS NOT NULL THEN
        REPLACE(
          REPLACE(cp.pose_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', ''),
          'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images', ''
        )
      ELSE NULL
    END as pose_path
  FROM custom_players cp
  WHERE cp.profile_photo_url IS NOT NULL OR cp.pose_photo_url IS NOT NULL
)
SELECT 
  pu.id,
  pu.name,
  pu.profile_photo_url,
  pu.pose_photo_url,
  pu.profile_path,
  pu.pose_path,
  CASE 
    WHEN pu.profile_path IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM storage.objects 
          WHERE bucket_id = 'player-images' 
          AND name = pu.profile_path
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
      END
    ELSE 'N/A'
  END as profile_exists,
  CASE 
    WHEN pu.pose_path IS NOT NULL THEN
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM storage.objects 
          WHERE bucket_id = 'player-images' 
          AND name = pu.pose_path
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
      END
    ELSE 'N/A'
  END as pose_exists
FROM photo_urls pu
ORDER BY pu.id;

-- STEP 3: Clean up invalid photo URLs (UNCOMMENT TO RUN)
-- This will set profile_photo_url and pose_photo_url to NULL for players where files don't exist
/*
UPDATE custom_players cp
SET 
  profile_photo_url = CASE 
    WHEN cp.profile_photo_url IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM storage.objects 
      WHERE bucket_id = 'player-images' 
      AND name = REPLACE(
        REPLACE(cp.profile_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', ''),
        'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images', ''
      )
    ) THEN NULL
    ELSE cp.profile_photo_url
  END,
  pose_photo_url = CASE 
    WHEN cp.pose_photo_url IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM storage.objects 
      WHERE bucket_id = 'player-images' 
      AND name = REPLACE(
        REPLACE(cp.pose_photo_url, 'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images/', ''),
        'https://xhunnsczqjwfrwgjetff.supabase.co/storage/v1/object/public/player-images', ''
      )
    ) THEN NULL
    ELSE cp.pose_photo_url
  END
WHERE (cp.profile_photo_url IS NOT NULL OR cp.pose_photo_url IS NOT NULL);
*/

-- STEP 4: Simple cleanup - just remove URLs that don't match existing files
-- This is safer - only removes URLs for files we know don't exist
UPDATE custom_players
SET profile_photo_url = NULL
WHERE profile_photo_url IS NOT NULL
AND profile_photo_url LIKE '%custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586%'
AND NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'player-images' 
  AND name = 'custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/profile.jpg'
)
RETURNING id, name, profile_photo_url;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After cleanup, verify the player no longer has invalid URL:
-- SELECT id, name, profile_photo_url, pose_photo_url
-- FROM custom_players
-- WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586';
-- ============================================================================

