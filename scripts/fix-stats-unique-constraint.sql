-- Fix the unique constraint on stats table to handle both player types
-- The current constraint only considers player_id, which fails for custom players

BEGIN;

-- Step 1: Drop the old constraint
ALTER TABLE stats DROP CONSTRAINT IF EXISTS stats_match_player_unique;

-- Step 2: Create a new unique index that handles both player types
-- This uses a partial unique index approach:
-- - One index for regular players (where player_id IS NOT NULL)
-- - One index for custom players (where custom_player_id IS NOT NULL)

-- For regular players
CREATE UNIQUE INDEX IF NOT EXISTS stats_match_regular_player_unique
ON stats (match_id, player_id)
WHERE player_id IS NOT NULL;

-- For custom players
CREATE UNIQUE INDEX IF NOT EXISTS stats_match_custom_player_unique
ON stats (match_id, custom_player_id)
WHERE custom_player_id IS NOT NULL;

-- Step 3: Verify the indexes were created
SELECT 
  '=== UNIQUE INDEXES ON STATS ===' as info,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'stats'
  AND indexname LIKE '%unique%'
ORDER BY indexname;

COMMIT;

SELECT '✅ Stats table unique constraints updated successfully' as status;

