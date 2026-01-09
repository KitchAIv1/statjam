-- ============================================================================
-- VERIFY TEAM GAMES - Debug query for Season feature
-- Purpose: Check what games exist and their structure
-- ============================================================================

-- STEP 1: Get all teams for the coach (wardterence02@gmail.com)
SELECT 
  t.id AS team_id,
  t.name AS team_name,
  t.coach_id,
  u.email AS coach_email
FROM teams t
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com';

-- STEP 2: Get ALL games where team_a_id matches the coach's team(s)
-- Replace 'TEAM_ID_HERE' with actual team ID from step 1
SELECT 
  g.id,
  g.team_a_id,
  g.opponent_name,
  g.status,
  g.home_score,
  g.away_score,
  g.stat_admin_id,
  g.is_coach_game,
  g.start_time,
  g.created_at
FROM games g
WHERE g.team_a_id IN (
  SELECT t.id FROM teams t
  JOIN users u ON t.coach_id = u.id
  WHERE u.email = 'wardterence02@gmail.com'
)
ORDER BY g.created_at DESC
LIMIT 20;

-- STEP 3: Check if games have stat_admin_id matching coach user_id
SELECT 
  g.id,
  g.opponent_name,
  g.status,
  g.stat_admin_id,
  u.email AS stat_admin_email,
  coach_u.email AS team_coach_email,
  CASE 
    WHEN g.stat_admin_id = t.coach_id THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END AS stat_admin_match
FROM games g
JOIN teams t ON g.team_a_id = t.id
JOIN users u ON g.stat_admin_id = u.id
JOIN users coach_u ON t.coach_id = coach_u.id
WHERE t.coach_id IN (
  SELECT id FROM users WHERE email = 'wardterence02@gmail.com'
)
ORDER BY g.created_at DESC
LIMIT 20;

-- STEP 4: Count games by status for the coach's teams
SELECT 
  t.name AS team_name,
  g.status,
  COUNT(*) AS count
FROM games g
JOIN teams t ON g.team_a_id = t.id
WHERE t.coach_id IN (
  SELECT id FROM users WHERE email = 'wardterence02@gmail.com'
)
GROUP BY t.name, g.status
ORDER BY t.name, g.status;

