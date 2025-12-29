-- ============================================================================
-- ADD UNIQUE CONSTRAINT TO PREVENT DUPLICATE CLIPS
-- ============================================================================
-- Purpose: Ensures only ONE clip can exist per stat_event_id
-- This prevents duplicates when jobs are retried
-- ============================================================================

-- Add unique constraint on stat_event_id
ALTER TABLE generated_clips
ADD CONSTRAINT generated_clips_stat_event_id_unique 
UNIQUE (stat_event_id);

-- Verify constraint was added
SELECT 
  constraint_name, 
  constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'generated_clips' 
AND constraint_type = 'UNIQUE';

