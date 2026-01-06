-- ============================================================
-- INVESTIGATE: Coach Video Upload Issue
-- Coach: wardterence02@gmail.com
-- Issue: Videos uploaded to Bunny.net but no tracking request in admin
-- ============================================================

-- 1. Find the coach's user profile
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM users
WHERE email = 'wardterence02@gmail.com';

-- 2. Find coach's teams
SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.coach_id,
    t.created_at
FROM teams t
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com';

-- 3. Find coach's games (is_coach_game = true)
SELECT 
    g.id AS game_id,
    g.opponent_name,
    g.status,
    g.home_score,
    g.away_score,
    g.team_a_id,
    g.is_coach_game,
    g.created_at
FROM games g
JOIN teams t ON g.team_a_id = t.id
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com'
ORDER BY g.created_at DESC
LIMIT 10;

-- 4. Find game_videos for coach's games
SELECT 
    gv.id AS video_id,
    gv.game_id,
    gv.bunny_video_id,
    gv.video_url,
    gv.assignment_status,
    gv.stats_count,
    gv.is_calibrated,
    gv.created_at
FROM game_videos gv
JOIN games g ON gv.game_id = g.id
JOIN teams t ON g.team_a_id = t.id
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com'
ORDER BY gv.created_at DESC
LIMIT 10;

-- 5. Check video_tracking_requests table
SELECT 
    vtr.id,
    vtr.game_id,
    vtr.video_id,
    vtr.status,
    vtr.priority,
    vtr.requested_by,
    vtr.created_at
FROM video_tracking_requests vtr
JOIN games g ON vtr.game_id = g.id
JOIN teams t ON g.team_a_id = t.id
JOIN users u ON t.coach_id = u.id
WHERE u.email = 'wardterence02@gmail.com'
ORDER BY vtr.created_at DESC
LIMIT 10;

-- 6. Check if video_tracking_requests table exists and structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'video_tracking_requests'
AND table_schema = 'public'
ORDER BY ordinal_position;

