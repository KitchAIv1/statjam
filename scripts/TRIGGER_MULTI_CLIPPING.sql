-- ============================================================
-- MULTI-CLIPPING TRIGGER FOR GAME
-- Game: 34ef2b6b-ad6d-4c58-8326-916e9a7c4e98
-- ============================================================

-- STEP 1: Check current job status for this game
SELECT 
  j.id AS job_id,
  j.game_id,
  j.video_id,
  j.status,
  j.total_clips,
  j.completed_clips,
  j.failed_clips,
  j.approved_at,
  j.started_at,
  j.completed_at,
  j.error_message
FROM clip_generation_jobs j
WHERE j.game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

-- STEP 2: Check video assignment status
SELECT 
  id AS video_id,
  game_id,
  assignment_status,
  stats_count,
  is_calibrated
FROM game_videos
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

-- ============================================================
-- IF JOB EXISTS AND IS APPROVED, THE CLIP WORKER WILL PICK IT UP
-- IF JOB NEEDS TO BE RESET TO APPROVED, RUN THIS:
-- ============================================================

/*
-- RESET JOB TO APPROVED (if stuck in processing or failed)
UPDATE clip_generation_jobs
SET 
  status = 'approved',
  error_message = NULL,
  failed_clips = 0,
  started_at = NULL
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

-- RESET ALL CLIPS TO PENDING (if need to re-process)
UPDATE generated_clips
SET 
  status = 'pending',
  error_message = NULL,
  generation_attempts = 0
WHERE job_id IN (
  SELECT id FROM clip_generation_jobs 
  WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
);
*/

-- ============================================================
-- VERIFICATION: Count clip-eligible stats
-- ============================================================
SELECT 
  stat_type,
  modifier,
  COUNT(*) AS count
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
  AND video_timestamp_ms IS NOT NULL
  AND stat_type IN ('field_goal', 'three_pointer', 'free_throw', 'rebound', 'assist', 'steal', 'block')
  AND (
    (stat_type IN ('field_goal', 'three_pointer', 'free_throw') AND modifier = 'made')
    OR stat_type IN ('rebound', 'assist', 'steal', 'block')
  )
GROUP BY stat_type, modifier
ORDER BY stat_type;

