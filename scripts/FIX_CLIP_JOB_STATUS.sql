-- ============================================================
-- FIX CLIP GENERATION JOB STATUS
-- Issue: Jobs show "processing" but clips are complete in Bunny.net
-- ============================================================

-- STEP 1: Check current status of clip_generation_jobs for both games
SELECT 
  cj.id,
  cj.game_id,
  cj.status,
  cj.total_clips,
  cj.completed_clips,
  cj.failed_clips,
  cj.created_at,
  cj.updated_at,
  g.opponent_name,
  t.name AS team_name
FROM clip_generation_jobs cj
LEFT JOIN games g ON cj.game_id = g.id
LEFT JOIN teams t ON g.team_a_id = t.id
WHERE cj.game_id IN (
  '70d61fd3-2f21-4b8d-8754-01ce5838094f',  -- Winslow vs Shawnee Medford
  '7f743a36-8814-4932-b116-4ce22ab3afb9'   -- Magicians vs Spartans
);

-- STEP 2: Check actual clip counts in generated_clips table
SELECT 
  game_id,
  COUNT(*) AS total_clips,
  SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready_clips,
  SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing_clips,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_clips
FROM generated_clips
WHERE game_id IN (
  '70d61fd3-2f21-4b8d-8754-01ce5838094f',
  '7f743a36-8814-4932-b116-4ce22ab3afb9'
)
GROUP BY game_id;

-- STEP 3: FIX - Update clip_generation_jobs to reflect actual completion
-- For Winslow vs Shawnee Medford
UPDATE clip_generation_jobs
SET 
  status = 'completed',
  completed_clips = (
    SELECT COUNT(*) FROM generated_clips 
    WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f' AND status = 'ready'
  ),
  failed_clips = (
    SELECT COUNT(*) FROM generated_clips 
    WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f' AND status = 'failed'
  ),
  updated_at = NOW()
WHERE game_id = '70d61fd3-2f21-4b8d-8754-01ce5838094f'
  AND status != 'completed';

-- For Magicians vs Spartans
UPDATE clip_generation_jobs
SET 
  status = 'completed',
  completed_clips = (
    SELECT COUNT(*) FROM generated_clips 
    WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9' AND status = 'ready'
  ),
  failed_clips = (
    SELECT COUNT(*) FROM generated_clips 
    WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9' AND status = 'failed'
  ),
  updated_at = NOW()
WHERE game_id = '7f743a36-8814-4932-b116-4ce22ab3afb9'
  AND status != 'completed';

-- STEP 4: Verify the fix
SELECT 
  cj.id,
  cj.game_id,
  cj.status,
  cj.total_clips,
  cj.completed_clips,
  cj.failed_clips,
  cj.updated_at,
  g.opponent_name
FROM clip_generation_jobs cj
LEFT JOIN games g ON cj.game_id = g.id
WHERE cj.game_id IN (
  '70d61fd3-2f21-4b8d-8754-01ce5838094f',
  '7f743a36-8814-4932-b116-4ce22ab3afb9'
);

