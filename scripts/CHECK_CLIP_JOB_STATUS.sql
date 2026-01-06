-- Check clip generation job status for game
SELECT 
    j.id AS job_id,
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

-- Check individual clip statuses
SELECT 
    status,
    COUNT(*) as count
FROM game_stat_clips
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98'
GROUP BY status
ORDER BY status;

