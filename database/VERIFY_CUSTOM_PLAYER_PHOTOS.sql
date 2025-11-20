-- ============================================================================
-- VERIFICATION QUERIES: Custom Player Photos
-- ============================================================================
-- Purpose: Verify that custom player photos are properly configured
-- Run these queries in Supabase SQL Editor to diagnose photo display issues
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify custom_players table has photo columns
-- ============================================================================
-- Expected: Should show profile_photo_url and pose_photo_url columns
-- If missing, run: ALTER TABLE custom_players ADD COLUMN profile_photo_url TEXT, ADD COLUMN pose_photo_url TEXT;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
AND column_name IN ('profile_photo_url', 'pose_photo_url')
ORDER BY column_name;

-- ============================================================================
-- STEP 2: Check if any custom players have photo URLs in database
-- ============================================================================
-- Expected: Should show custom players with their photo URLs (if any exist)

SELECT 
  id,
  name,
  team_id,
  coach_id,
  profile_photo_url,
  pose_photo_url,
  created_at
FROM custom_players
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 3: Check specific custom player (replace with actual ID from logs)
-- ============================================================================
-- From your logs: player ID is 8bbb5f60-70af-46f6-b609-f00b62cea586
-- Replace this ID with the actual custom player ID you're testing

SELECT 
  id,
  name,
  jersey_number,
  position,
  team_id,
  coach_id,
  profile_photo_url,
  pose_photo_url,
  created_at,
  updated_at
FROM custom_players
WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- ============================================================================
-- STEP 4: Verify storage bucket exists and is public
-- ============================================================================
-- Expected: Should show player-images bucket with public = true

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'player-images';

-- ============================================================================
-- STEP 5: Check if photos exist in storage for custom players
-- ============================================================================
-- Expected: Should list files in custom-players/ folder
-- If empty, photos weren't uploaded to storage

SELECT 
  name as file_path,
  id,
  bucket_id,
  created_at,
  updated_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/%'
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================================
-- STEP 6: Check specific custom player's storage files
-- ============================================================================
-- Replace {custom_player_id} with actual ID (e.g., 8bbb5f60-70af-46f6-b609-f00b62cea586)

SELECT 
  name as file_path,
  id,
  bucket_id,
  created_at,
  updated_at
FROM storage.objects
WHERE bucket_id = 'player-images'
AND name LIKE 'custom-players/8bbb5f60-70af-46f6-b609-f00b62cea586/%'
ORDER BY name;

-- ============================================================================
-- STEP 7: Verify storage policies allow custom player photo access
-- ============================================================================
-- Expected: Should show policies for custom player photos

SELECT 
  policyname,
  cmd as command,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND (
  policyname LIKE '%custom player%' 
  OR policyname LIKE '%player-image%'
  OR (qual::text LIKE '%custom-players%' OR with_check::text LIKE '%custom-players%')
)
ORDER BY policyname;

-- ============================================================================
-- STEP 8: Check if team_players table properly links custom players
-- ============================================================================
-- Expected: Should show team_players entries with custom_player_id

SELECT 
  tp.id as team_player_id,
  tp.team_id,
  tp.player_id,
  tp.custom_player_id,
  cp.name as custom_player_name,
  cp.profile_photo_url,
  cp.pose_photo_url,
  t.name as team_name
FROM team_players tp
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
LEFT JOIN teams t ON tp.team_id = t.id
WHERE tp.custom_player_id IS NOT NULL
ORDER BY tp.created_at DESC
LIMIT 20;

-- ============================================================================
-- STEP 9: Verify RLS policies allow reading custom player photos
-- ============================================================================
-- Expected: Should show policies that allow SELECT on custom_players

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'custom_players'
ORDER BY policyname;

-- ============================================================================
-- STEP 10: Test query that matches tournamentService.getTeamsByTournament
-- ============================================================================
-- This simulates what the frontend query does
-- Replace {tournament_id} with actual tournament ID

SELECT 
  t.id as team_id,
  t.name as team_name,
  tp.custom_player_id,
  cp.id as custom_player_id,
  cp.name as custom_player_name,
  cp.jersey_number,
  cp.position,
  cp.profile_photo_url,
  cp.pose_photo_url
FROM teams t
INNER JOIN team_players tp ON t.id = tp.team_id
INNER JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE t.tournament_id = 'YOUR_TOURNAMENT_ID_HERE'
AND tp.custom_player_id IS NOT NULL
LIMIT 10;

-- ============================================================================
-- DIAGNOSIS SUMMARY
-- ============================================================================
-- After running all queries, check:
--
-- 1. If STEP 1 shows NO ROWS: Columns don't exist - need to add them
-- 2. If STEP 2 shows NULL photo URLs: Photos weren't saved to database after upload
-- 3. If STEP 5 shows NO ROWS: Photos weren't uploaded to storage
-- 4. If STEP 7 shows NO ROWS: Storage policies missing - need to create them
-- 5. If STEP 10 shows NULL photo URLs: Query is working but data is missing
--
-- ============================================================================
-- FIXES (if needed)
-- ============================================================================

-- Fix 1: Add photo columns if missing
-- ALTER TABLE custom_players 
-- ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
-- ADD COLUMN IF NOT EXISTS pose_photo_url TEXT;

-- Fix 2: Update a specific custom player's photo URL (if you have the storage URL)
-- UPDATE custom_players
-- SET profile_photo_url = 'https://your-project.supabase.co/storage/v1/object/public/player-images/custom-players/{id}/profile.jpg'
-- WHERE id = '8bbb5f60-70af-46f6-b609-f00b62cea586';

-- Fix 3: Create storage policies if missing (see 018_add_custom_player_photo_storage_policy.sql)

