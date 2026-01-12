-- ========================================
-- Verify Manual Tracked Games (Coach Games)
-- Email: natecoffield@gmail.com
-- ========================================

-- 1. Find the user by email
SELECT 
  id,
  email,
  name,
  role,
  created_at
FROM users
WHERE email = 'natecoffield@gmail.com';

-- 2. Count manually tracked games (coach games) for this user
-- Coach games are identified by: is_coach_game = true AND stat_admin_id = user.id
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  COUNT(g.id) as total_coach_games,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_games,
  COUNT(CASE WHEN g.status = 'in_progress' THEN 1 END) as in_progress_games,
  COUNT(CASE WHEN g.status = 'scheduled' THEN 1 END) as scheduled_games,
  COUNT(CASE WHEN g.status = 'cancelled' THEN 1 END) as cancelled_games
FROM users u
LEFT JOIN games g ON g.stat_admin_id = u.id AND g.is_coach_game = true
WHERE u.email = 'natecoffield@gmail.com'
GROUP BY u.id, u.email, u.name;

-- 3. Detailed list of all coach games (optional - for verification)
SELECT 
  g.id,
  g.status,
  g.is_coach_game,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.quarter,
  g.created_at,
  g.start_time,
  g.end_time,
  ta.name as team_name
FROM users u
JOIN games g ON g.stat_admin_id = u.id AND g.is_coach_game = true
LEFT JOIN teams ta ON g.team_a_id = ta.id
WHERE u.email = 'natecoffield@gmail.com'
ORDER BY g.created_at DESC;

