-- ============================================================================
-- ADD VENUE COLUMN TO GAMES TABLE
-- ============================================================================
-- Purpose: Add venue column to games table to support per-game venue settings
-- Date: Generated for schedule game modal venue functionality
-- ============================================================================

-- Check if venue column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'venue';

-- If venue column doesn't exist, add it:
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS venue TEXT;

-- Add comment for documentation
COMMENT ON COLUMN games.venue IS 'Game-specific venue. If NULL, uses tournament.venue as fallback';

-- Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'venue';

-- ✅ EXPECTED RESULT:
-- column_name: venue
-- data_type: text
-- is_nullable: YES
-- column_default: NULL

