-- ============================================================
-- ADD 16 SECONDS TO Q3 GAME CLOCK (3:51 to 0:00)
-- Game: 34ef2b6b-ad6d-4c58-8326-916e9a7c4e98
-- ============================================================

-- First, preview what will be updated
SELECT 
  id,
  stat_type,
  modifier,
  quarter,
  game_time_minutes,
  game_time_seconds,
  -- Calculate new time (add 16 seconds)
  FLOOR((game_time_minutes * 60 + game_time_seconds + 16) / 60) AS new_minutes,
  MOD((game_time_minutes * 60 + game_time_seconds + 16), 60) AS new_seconds,
  created_at
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND quarter = 3
  AND (
    -- Time range: 3:51 to 0:00 (total seconds: 231 down to 0)
    (game_time_minutes * 60 + game_time_seconds) <= 231
  )
ORDER BY game_time_minutes DESC, game_time_seconds DESC;

-- ============================================================
-- UNCOMMENT BELOW TO EXECUTE THE UPDATE
-- ============================================================

/*
UPDATE game_stats
SET 
  game_time_minutes = FLOOR((game_time_minutes * 60 + game_time_seconds + 16) / 60),
  game_time_seconds = MOD((game_time_minutes * 60 + game_time_seconds + 16), 60)
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND quarter = 3
  AND (
    -- Time range: 3:51 to 0:00 (total seconds: 231 down to 0)
    (game_time_minutes * 60 + game_time_seconds) <= 231
  );
*/

-- ============================================================
-- VERIFICATION QUERY (run after update)
-- ============================================================

/*
SELECT 
  id,
  stat_type,
  modifier,
  quarter,
  game_time_minutes,
  game_time_seconds,
  created_at
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND quarter = 3
ORDER BY game_time_minutes DESC, game_time_seconds DESC;
*/

