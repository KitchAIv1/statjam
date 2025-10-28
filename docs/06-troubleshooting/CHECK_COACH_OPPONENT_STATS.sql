-- ============================================================================
-- CHECK COACH OPPONENT STATS
-- ============================================================================
-- Purpose: Diagnose why opponent stats are not showing in coach tracker
-- ============================================================================

-- Step 1: Check if is_opponent_stat column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_stats'
AND column_name = 'is_opponent_stat';

-- Expected: Should return 1 row with column details
-- If empty: Column doesn't exist, need to add it

-- Step 2: Check recent game_stats for a coach game
-- Replace with your actual game_id
SELECT 
  id,
  game_id,
  team_id,
  player_id,
  custom_player_id,
  is_opponent_stat,
  stat_type,
  modifier,
  stat_value,
  created_at
FROM game_stats
WHERE game_id = '1e5e0b68-7ad2-4a5e-b403-91a68c6de104' -- Replace with your game ID
ORDER BY created_at DESC
LIMIT 20;

-- Expected: Should show stats with is_opponent_stat = true for opponent stats
-- If all false: Flag is not being set correctly

-- Step 3: Count opponent vs regular stats
SELECT 
  is_opponent_stat,
  COUNT(*) as count,
  SUM(CASE WHEN stat_type IN ('field_goal', 'three_pointer', 'free_throw') AND modifier = 'made' THEN stat_value ELSE 0 END) as total_points
FROM game_stats
WHERE game_id = '1e5e0b68-7ad2-4a5e-b403-91a68c6de104' -- Replace with your game ID
GROUP BY is_opponent_stat;

-- Expected: 
-- is_opponent_stat | count | total_points
-- false            | X     | Y
-- true             | Z     | W

-- Step 4: Check if column has default value
SELECT 
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'game_stats'
AND column_name = 'is_opponent_stat';

-- Expected: column_default should be 'false' or NULL

-- ============================================================================
-- SOLUTION: If column doesn't exist, add it
-- ============================================================================

-- Add is_opponent_stat column if it doesn't exist
ALTER TABLE game_stats
ADD COLUMN IF NOT EXISTS is_opponent_stat BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_game_stats_opponent 
ON game_stats(game_id, is_opponent_stat);

-- Update existing NULL values to false
UPDATE game_stats
SET is_opponent_stat = false
WHERE is_opponent_stat IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify column exists and has correct default
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'game_stats'
AND column_name = 'is_opponent_stat';

-- Expected:
-- column_name      | data_type | column_default | is_nullable
-- is_opponent_stat | boolean   | false          | YES

-- ============================================================================
-- TEST: Insert a test opponent stat
-- ============================================================================

-- Insert a test opponent stat (replace IDs with actual values)
INSERT INTO game_stats (
  game_id,
  team_id,
  player_id,
  is_opponent_stat,
  stat_type,
  modifier,
  stat_value,
  quarter,
  game_time_minutes,
  game_time_seconds
) VALUES (
  '1e5e0b68-7ad2-4a5e-b403-91a68c6de104', -- Your game ID
  'bbe9dafc-a632-404f-907f-2ee3d082b9d8', -- Your team ID
  (SELECT id FROM users WHERE role = 'coach' LIMIT 1), -- Coach user ID
  true, -- ← OPPONENT STAT FLAG
  'field_goal',
  'made',
  2,
  1,
  12,
  0
);

-- Verify the test stat was inserted
SELECT 
  id,
  is_opponent_stat,
  stat_type,
  modifier,
  stat_value
FROM game_stats
WHERE game_id = '1e5e0b68-7ad2-4a5e-b403-91a68c6de104'
AND is_opponent_stat = true
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Should show the test stat with is_opponent_stat = true

-- ============================================================================
-- CLEANUP: Remove test stat
-- ============================================================================

-- Delete the test stat (optional)
-- DELETE FROM game_stats
-- WHERE game_id = '1e5e0b68-7ad2-4a5e-b403-91a68c6de104'
-- AND is_opponent_stat = true
-- AND stat_type = 'field_goal'
-- AND created_at > NOW() - INTERVAL '1 minute';

