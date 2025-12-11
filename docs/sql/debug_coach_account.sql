-- ============================================
-- DEBUG COACH ACCOUNT: hayden.alfano@gmail.com
-- Created: 2025-12-10 (v3 - simplified)
-- ============================================

-- 1. USER ACCOUNT
SELECT 
    'User Account' AS section,
    id AS user_id,
    email,
    name,
    role,
    profile_photo_url IS NOT NULL AS has_photo
FROM users 
WHERE email = 'hayden.alfano@gmail.com';

-- 2. OWNED TOURNAMENTS
SELECT 
    'Owned Tournaments' AS section,
    t.id AS tournament_id,
    t.name AS tournament_name,
    t.status
FROM tournaments t
WHERE t.organizer_id = (
    SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com'
);

-- 3. TEAMS WHERE USER IS COACH
SELECT 
    'Coach Teams' AS section,
    t.id AS team_id,
    t.name AS team_name,
    t.tournament_id,
    tn.name AS tournament_name,
    t.coach_id
FROM teams t
LEFT JOIN tournaments tn ON t.tournament_id = tn.id
WHERE t.coach_id = (
    SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com'
);

-- 4. PLAYERS ON COACH'S TEAMS
SELECT 
    'Team Players' AS section,
    tp.id AS team_player_id,
    tp.team_id,
    t.name AS team_name,
    tp.player_id,
    u.name AS player_name,
    u.email AS player_email
FROM team_players tp
INNER JOIN teams t ON tp.team_id = t.id
LEFT JOIN users u ON tp.player_id = u.id
WHERE t.coach_id = (
    SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com'
);

-- 5. CUSTOM PLAYERS ON COACH'S TEAMS
SELECT 
    'Custom Players' AS section,
    cp.id AS custom_player_id,
    cp.team_id,
    t.name AS team_name,
    cp.name AS player_name,
    cp.jersey_number
FROM custom_players cp
INNER JOIN teams t ON cp.team_id = t.id
WHERE t.coach_id = (
    SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com'
);

-- 6. GAMES ASSIGNED AS STAT ADMIN
SELECT 
    'Assigned Games' AS section,
    g.id AS game_id,
    tn.name AS tournament_name,
    g.status AS game_status,
    g.is_coach_game,
    ta.name AS team_a_name,
    tb.name AS team_b_name,
    g.stat_admin_id
FROM games g
LEFT JOIN tournaments tn ON g.tournament_id = tn.id
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.stat_admin_id = (
    SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com'
)
LIMIT 20;

-- 7. GAMES WHERE COACH'S TEAM IS PLAYING
SELECT 
    'Coach Team Games' AS section,
    g.id AS game_id,
    g.is_coach_game,
    ta.name AS team_a_name,
    tb.name AS team_b_name,
    g.status,
    g.stat_admin_id
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE ta.coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
   OR tb.coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
LIMIT 20;

-- 8. PLAYER COUNTS PER GAME (CRITICAL!)
SELECT 
    'Player Availability' AS section,
    g.id AS game_id,
    g.status,
    g.is_coach_game,
    ta.name AS team_a,
    (SELECT COUNT(*) FROM team_players WHERE team_id = g.team_a_id) AS team_a_roster,
    (SELECT COUNT(*) FROM custom_players WHERE team_id = g.team_a_id) AS team_a_custom,
    tb.name AS team_b,
    (SELECT COUNT(*) FROM team_players WHERE team_id = g.team_b_id) AS team_b_roster,
    (SELECT COUNT(*) FROM custom_players WHERE team_id = g.team_b_id) AS team_b_custom
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.stat_admin_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
   OR ta.coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
   OR tb.coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
LIMIT 10;

-- 9. TEAMS WITH NO PLAYERS (ISSUE!)
SELECT 
    'Empty Teams' AS section,
    t.id AS team_id,
    t.name AS team_name,
    (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) AS roster_count,
    (SELECT COUNT(*) FROM custom_players WHERE team_id = t.id) AS custom_count
FROM teams t
WHERE t.coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')
AND (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) = 0
AND (SELECT COUNT(*) FROM custom_players WHERE team_id = t.id) = 0;

-- 10. SUMMARY
SELECT 
    'Summary' AS section,
    (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com') AS user_id,
    (SELECT COUNT(*) FROM teams WHERE coach_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')) AS coached_teams,
    (SELECT COUNT(*) FROM games WHERE stat_admin_id = (SELECT id FROM users WHERE email = 'hayden.alfano@gmail.com')) AS assigned_games;
