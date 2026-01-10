-- ===========================================
-- FIX: Update clip_generation_jobs for game 0b38e518-974e-4fdb-9bca-153d5b3cc788
-- UI shows "processing" but 66 clips are ready in DB
-- ===========================================

-- 1. VERIFY: Count actual ready clips in generated_clips
SELECT 
  'ACTUAL CLIPS' as section,
  COUNT(*) as total_ready_clips
FROM generated_clips
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788'
  AND status = 'ready';

-- 2. CHECK: Current clip_generation_jobs state
SELECT 
  id,
  game_id,
  status,
  total_clips,
  completed_clips,
  failed_clips,
  created_at,
  updated_at
FROM clip_generation_jobs
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- ===========================================
-- 3. EXECUTE: Update job to completed with correct counts
-- ===========================================
UPDATE clip_generation_jobs
SET 
  status = 'completed',
  completed_clips = 66,
  total_clips = 66,
  failed_clips = 0,
  updated_at = NOW()
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

-- 4. VERIFY: Confirm update
SELECT 
  'VERIFICATION' as section,
  id,
  game_id,
  status,
  total_clips,
  completed_clips,
  failed_clips,
  updated_at
FROM clip_generation_jobs
WHERE game_id = '0b38e518-974e-4fdb-9bca-153d5b3cc788';

