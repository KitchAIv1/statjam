-- Verify is_coach_game flag for organizer game
-- Game ID from console logs: 932615f0-ffae-48e8-b6f8-5535d407af47

SELECT 
  id,
  is_coach_game,
  opponent_name,
  team_a_id,
  team_b_id,
  stat_admin_id,
  status
FROM games
WHERE id = '932615f0-ffae-48e8-b6f8-5535d407af47';

