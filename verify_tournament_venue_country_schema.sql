-- ============================================================================
-- VERIFY TOURNAMENT VENUE & COUNTRY SCHEMA
-- ============================================================================
-- Purpose: Verify that tournaments table has venue and country columns
-- Date: Generated for tournament settings venue tab implementation
-- ============================================================================

-- Check if tournaments table has venue column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tournaments'
  AND column_name = 'venue';

-- Check if tournaments table has country column
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tournaments'
  AND column_name = 'country';

-- If venue column doesn't exist, add it:
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS venue TEXT NOT NULL DEFAULT 'TBD';

-- If country column doesn't exist, add it:
-- ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US';

-- Verify both columns exist and show sample data
SELECT 
  id,
  name,
  venue,
  country,
  created_at
FROM tournaments
ORDER BY created_at DESC
LIMIT 5;

