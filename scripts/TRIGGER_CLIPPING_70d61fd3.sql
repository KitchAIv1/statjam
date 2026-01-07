-- ============================================================
-- MULTI-CLIPPING TRIGGER FOR GAME
-- Game: 70d61fd3-2f21-4b8d-8754-01ce5838094f
-- ============================================================

-- STEP 1: Check game info
SELECT 
  g.id,
  g.status,
  ta.name as team_a,
  tb.name as team_b,
  g.team_a_score,
  g.team_b_score
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id = '70d61fd3-2f21-4b8d-8754-01ce5838094f';

-- STEP 2: Check existing clip jobs
SELECT 
  id AS job_id,
  status,
  total_clips,
  completed_clips,
  failed_clips,
  approved_at,
  started_at,
  completed_at,
  error_message
FROM clip_generation_jobs
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
ORDER BY created_at DESC;

-- STEP 3: Check video info
SELECT 
  id AS video_id,
  bunny_video_id,
  assignment_status,
  stats_count,
  is_calibrated
FROM game_videos
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f';

-- STEP 4: Count clip-eligible stats
SELECT 
  stat_type,
  modifier,
  COUNT(*) AS count
FROM game_stats
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND video_timestamp_ms IS NOT NULL
  AND stat_type IN ('field_goal', 'three_pointer', 'free_throw', 'rebound', 'assist', 'steal', 'block')
  AND (
    (stat_type IN ('field_goal', 'three_pointer', 'free_throw') AND modifier = 'made')
    OR stat_type IN ('rebound', 'assist', 'steal', 'block')
  )
GROUP BY stat_type, modifier
ORDER BY stat_type;

-- ============================================================
-- IF JOB EXISTS AND IS APPROVED, THE CLIP WORKER WILL PICK IT UP
-- THE RAILWAY CLIP WORKER POLLS EVERY 30 SECONDS
-- ============================================================

-- STEP 5: If job is NOT approved, set it to approved:
/*
UPDATE clip_generation_jobs
SET 
  status = 'approved',
  approved_at = NOW(),
  error_message = NULL,
  failed_clips = 0,
  started_at = NULL
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND status != 'completed';
*/

-- STEP 6: Verify job is now approved
-- SELECT id, status, approved_at FROM clip_generation_jobs WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f';

