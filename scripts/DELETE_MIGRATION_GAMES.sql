-- ========================================
-- Identify & Delete Migration Games
-- Coach: wardterence02@gmail.com
-- ========================================

-- 1. Find the coach
SELECT id, email, name FROM users WHERE email = 'wardterence02@gmail.com';

-- 2. Find their teams
SELECT t.id, t.name, t.created_at
FROM teams t
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com';

-- 3. Find ALL games for their teams (identify migration games)
SELECT 
  g.id,
  g.status,
  g.is_coach_game,
  g.opponent_name,
  g.home_score,
  g.away_score,
  g.created_at,
  g.start_time,
  ta.name as team_a_name,
  tb.name as team_b_name,
  CASE 
    WHEN g.stat_admin_id IS NULL AND g.is_coach_game = false THEN '⚠️ LIKELY MIGRATION'
    ELSE ''
  END as migration_flag
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE ta.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com')
   OR tb.coach_id = (SELECT id FROM users WHERE email = 'wardterence02@gmail.com')
ORDER BY g.created_at ASC;

-- ========================================
-- ⚠️ DANGER ZONE - DELETE COMMANDS
-- Run ONLY after confirming the game IDs above
-- Replace 'GAME_ID_1' and 'GAME_ID_2' with actual IDs
-- ========================================

-- DELETE game stats
-- DELETE FROM game_stats WHERE game_id IN ('GAME_ID_1', 'GAME_ID_2');

-- DELETE game substitutions
-- DELETE FROM game_substitutions WHERE game_id IN ('GAME_ID_1', 'GAME_ID_2');

-- DELETE game timeouts
-- DELETE FROM game_timeouts WHERE game_id IN ('GAME_ID_1', 'GAME_ID_2');

-- DELETE season_games junction (removes from seasons)
-- DELETE FROM season_games WHERE game_id IN ('GAME_ID_1', 'GAME_ID_2');

-- DELETE the games themselves
-- DELETE FROM games WHERE id IN ('GAME_ID_1', 'GAME_ID_2');

