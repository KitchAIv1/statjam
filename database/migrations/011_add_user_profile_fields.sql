-- ============================================================================
-- MIGRATION 011: Add User Profile Fields
-- ============================================================================
-- Purpose: Add profile fields for profile card feature
-- Date: 2025-11-10
-- ============================================================================

-- Step 1: Add profile fields to users table
-- NOTE: profile_photo_url already exists, so we only add the missing ones
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Step 2: Add comments for documentation
COMMENT ON COLUMN users.bio IS 'User bio/tagline (1-2 lines)';
COMMENT ON COLUMN users.location IS 'User location (City, Country)';
COMMENT ON COLUMN users.social_links IS 'Social media links (twitter, instagram, website)';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- ============================================================================

-- Check if new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('bio', 'location', 'social_links')
ORDER BY column_name;

-- Sample query to test
-- SELECT id, email, name, role, profile_photo_url, bio, location, social_links
-- FROM users
-- WHERE role = 'organizer'
-- LIMIT 5;

