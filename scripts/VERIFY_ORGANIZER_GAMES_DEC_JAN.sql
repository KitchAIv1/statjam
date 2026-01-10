-- ============================================================================
-- VERIFY ORGANIZER-CREATED GAMES (Dec 1, 2025 - Jan 9, 2026)
-- ============================================================================
-- Purpose: List all games created by organizers and their assigned stat admins
-- Date Range: December 1, 2025 to January 9, 2026
-- ============================================================================

SELECT 
  -- Game Information
  g.id AS game_id,
  g.status AS game_status,
  g.created_at AS game_created_at,
  g.start_time AS game_start_time,
  g.end_time AS game_end_time,
  g.home_score,
  g.away_score,
  g.quarter,
  
  -- Tournament Information
  t.id AS tournament_id,
  t.name AS tournament_name,
  t.status AS tournament_status,
  
  -- Organizer Information (who created the tournament)
  org.id AS organizer_id,
  org.email AS organizer_email,
  org.name AS organizer_name,
  org.role AS organizer_role,
  
  -- Stat Admin Information (assigned to game)
  stat_admin.id AS stat_admin_id,
  stat_admin.email AS stat_admin_email,
  stat_admin.name AS stat_admin_name,
  stat_admin.role AS stat_admin_role,
  
  -- Team Information
  team_a.name AS team_a_name,
  team_b.name AS team_b_name,
  
  -- Counts
  (SELECT COUNT(*) FROM game_stats WHERE game_id = g.id) AS total_stats_recorded,
  (SELECT COUNT(*) FROM game_substitutions WHERE game_id = g.id) AS total_substitutions

FROM games g
INNER JOIN tournaments t ON g.tournament_id = t.id
INNER JOIN users org ON t.organizer_id = org.id
LEFT JOIN users stat_admin ON g.stat_admin_id = stat_admin.id
INNER JOIN teams team_a ON g.team_a_id = team_a.id
INNER JOIN teams team_b ON g.team_b_id = team_b.id

WHERE 
  -- Filter by date range
  g.created_at >= '2025-12-01 00:00:00'::timestamptz
  AND g.created_at < '2026-01-10 00:00:00'::timestamptz
  
  -- Only organizer-created games (exclude coach games)
  AND g.tournament_id IS NOT NULL
  AND org.role = 'organizer'

ORDER BY 
  g.created_at DESC,
  t.name ASC,
  g.start_time ASC;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

SELECT 
  '=== SUMMARY ===' AS section,
  COUNT(*) AS total_organizer_games,
  COUNT(DISTINCT t.organizer_id) AS unique_organizers,
  COUNT(DISTINCT g.stat_admin_id) AS unique_stat_admins_assigned,
  COUNT(CASE WHEN g.stat_admin_id IS NULL THEN 1 END) AS games_without_stat_admin,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) AS completed_games,
  COUNT(CASE WHEN g.status = 'in_progress' THEN 1 END) AS in_progress_games,
  COUNT(CASE WHEN g.status = 'scheduled' THEN 1 END) AS scheduled_games
FROM games g
INNER JOIN tournaments t ON g.tournament_id = t.id
INNER JOIN users org ON t.organizer_id = org.id
WHERE 
  g.created_at >= '2025-12-01 00:00:00'::timestamptz
  AND g.created_at < '2026-01-10 00:00:00'::timestamptz
  AND g.tournament_id IS NOT NULL
  AND org.role = 'organizer';

-- ============================================================================
-- GAMES BY ORGANIZER
-- ============================================================================

SELECT 
  '=== GAMES BY ORGANIZER ===' AS section,
  org.id AS organizer_id,
  org.email AS organizer_email,
  org.name AS organizer_name,
  COUNT(*) AS total_games_created,
  COUNT(CASE WHEN g.stat_admin_id IS NOT NULL THEN 1 END) AS games_with_stat_admin,
  COUNT(CASE WHEN g.stat_admin_id IS NULL THEN 1 END) AS games_without_stat_admin,
  MIN(g.created_at) AS first_game_created,
  MAX(g.created_at) AS last_game_created
FROM games g
INNER JOIN tournaments t ON g.tournament_id = t.id
INNER JOIN users org ON t.organizer_id = org.id
WHERE 
  g.created_at >= '2025-12-01 00:00:00'::timestamptz
  AND g.created_at < '2026-01-10 00:00:00'::timestamptz
  AND g.tournament_id IS NOT NULL
  AND org.role = 'organizer'
GROUP BY org.id, org.email, org.name
ORDER BY total_games_created DESC;

-- ============================================================================
-- STAT ADMIN ASSIGNMENT SUMMARY
-- ============================================================================

SELECT 
  '=== STAT ADMIN ASSIGNMENTS ===' AS section,
  stat_admin.id AS stat_admin_id,
  stat_admin.email AS stat_admin_email,
  stat_admin.name AS stat_admin_name,
  COUNT(*) AS total_games_assigned,
  COUNT(CASE WHEN g.status = 'completed' THEN 1 END) AS completed_games,
  COUNT(CASE WHEN g.status = 'in_progress' THEN 1 END) AS in_progress_games,
  COUNT(CASE WHEN g.status = 'scheduled' THEN 1 END) AS scheduled_games
FROM games g
INNER JOIN tournaments t ON g.tournament_id = t.id
INNER JOIN users org ON t.organizer_id = org.id
INNER JOIN users stat_admin ON g.stat_admin_id = stat_admin.id
WHERE 
  g.created_at >= '2025-12-01 00:00:00'::timestamptz
  AND g.created_at < '2026-01-10 00:00:00'::timestamptz
  AND g.tournament_id IS NOT NULL
  AND org.role = 'organizer'
  AND stat_admin.role = 'stat_admin'
GROUP BY stat_admin.id, stat_admin.email, stat_admin.name
ORDER BY total_games_assigned DESC;
