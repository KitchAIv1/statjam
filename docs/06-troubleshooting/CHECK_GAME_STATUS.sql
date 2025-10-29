-- Check the status of a specific game
-- Replace 'GAME_ID_HERE' with the actual game ID

SELECT 
  id,
  status,
  team_a_id,
  team_b_id,
  quarter,
  game_clock_minutes,
  game_clock_seconds,
  is_clock_running,
  home_score,
  away_score,
  start_time,
  end_time,
  created_at,
  updated_at
FROM games
WHERE id = '9129cd69-5f0e-49cf-a1c3-d72ede070958';

-- If the status is 'completed', the game has ended
-- If the status is 'in_progress', the game is still active

