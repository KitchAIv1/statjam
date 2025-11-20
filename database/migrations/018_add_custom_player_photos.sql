-- ============================================================================
-- MIGRATION: Add Photo Columns to custom_players Table
-- ============================================================================
-- Purpose: Add profile_photo_url and pose_photo_url columns to custom_players
-- Date: 2025-01-XX
-- ============================================================================

-- Step 1: Add profile_photo_url and pose_photo_url columns
ALTER TABLE custom_players 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS pose_photo_url TEXT;

-- Step 2: Add indexes for photo URL lookups (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_custom_players_profile_photo 
ON custom_players(profile_photo_url) 
WHERE profile_photo_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_custom_players_pose_photo 
ON custom_players(pose_photo_url) 
WHERE pose_photo_url IS NOT NULL;

-- Step 3: Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
AND column_name IN ('profile_photo_url', 'pose_photo_url')
ORDER BY column_name;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify:
-- 1. Columns exist: Run the SELECT query above - should return 2 rows
-- 2. Existing data unaffected: SELECT COUNT(*) FROM custom_players; (should be same)
-- 3. Columns are nullable: Both columns should allow NULL values
-- ============================================================================

