-- ============================================================================
-- VERIFY USER PROFILE COLUMNS
-- ============================================================================
-- Purpose: Check which profile columns already exist in users table
-- Run this FIRST before running any migration
-- ============================================================================

-- Step 1: Check ALL columns in users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check specifically for profile-related columns
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('profile_photo_url', 'bio', 'location', 'social_links') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name IN ('profile_photo_url', 'bio', 'location', 'social_links', 'name', 'email', 'role')
ORDER BY column_name;

-- Step 3: Sample query to see actual data structure
SELECT 
    id,
    email,
    name,
    role,
    created_at
    -- Add these if they exist:
    -- profile_photo_url,
    -- bio,
    -- location,
    -- social_links
FROM users
WHERE role = 'organizer'
LIMIT 3;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copy this entire file
-- 2. Paste into Supabase SQL Editor
-- 3. Run it
-- 4. Check the results:
--    - Step 1 shows ALL columns (see what exists)
--    - Step 2 shows which profile columns exist
--    - Step 3 shows sample data
-- 5. Report back which columns are MISSING
-- ============================================================================

