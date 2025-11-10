# Profile Fields Migration Instructions

## Overview
This migration adds profile fields to the `users` table to support the new Profile Card feature.

## What This Migration Does
- Adds `profile_photo_url` column (TEXT) - stores Supabase storage URL
- Adds `bio` column (TEXT) - user bio/tagline
- Adds `location` column (TEXT) - user location (City, Country)
- Adds `social_links` column (JSONB) - social media links (twitter, instagram, website)

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `migrations/011_add_user_profile_fields.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Option 2: Supabase CLI
```bash
# From project root
cd database/migrations
supabase db push 011_add_user_profile_fields.sql
```

## Verification

After running the migration, verify it worked:

```sql
-- Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('profile_photo_url', 'bio', 'location', 'social_links')
ORDER BY column_name;
```

You should see 4 rows returned:
- `bio` (text, YES)
- `location` (text, YES)
- `profile_photo_url` (text, YES)
- `social_links` (jsonb, YES)

## Test the Profile Card

After migration:
1. Refresh your Organizer Dashboard
2. You should see the Profile Card at the top
3. Click "Edit Profile" to test editing
4. Upload a photo, add bio, location, social links
5. Click "Save Changes"
6. Profile card should update immediately

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS profile_photo_url;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
ALTER TABLE users DROP COLUMN IF EXISTS location;
ALTER TABLE users DROP COLUMN IF EXISTS social_links;

-- Remove index
DROP INDEX IF EXISTS idx_users_profile_photo;
```

## Notes
- All columns are nullable (optional)
- `social_links` defaults to empty JSONB object `{}`
- No data loss - only adds new columns
- Safe to run multiple times (uses `IF NOT EXISTS`)

