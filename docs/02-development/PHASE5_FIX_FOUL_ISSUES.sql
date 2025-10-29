-- ============================================================================
-- PHASE 5: Fix Foul Flow Issues
-- ============================================================================
-- 
-- ISSUES IDENTIFIED:
-- 1. Database constraint doesn't allow 'flagrant' and '1-and-1' modifiers
-- 2. Need to add these to the CHECK constraint
--
-- ============================================================================

-- Step 1: Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname LIKE '%modifier%';

-- Step 2: Drop old constraint if it exists
ALTER TABLE public.game_stats 
DROP CONSTRAINT IF EXISTS game_stats_modifier_check;

-- Step 3: Create new constraint with all foul modifiers
ALTER TABLE public.game_stats
ADD CONSTRAINT game_stats_modifier_check CHECK (
  (
    -- Field goals: made, missed
    (stat_type IN ('field_goal', 'three_pointer') AND modifier IN ('made', 'missed'))
    OR
    -- Free throws: made, missed
    (stat_type = 'free_throw' AND modifier IN ('made', 'missed'))
    OR
    -- Rebounds: offensive, defensive
    (stat_type = 'rebound' AND modifier IN ('offensive', 'defensive'))
    OR
    -- Fouls: personal, shooting, 1-and-1, technical, flagrant, offensive
    (stat_type = 'foul' AND modifier IN ('personal', 'shooting', '1-and-1', 'technical', 'flagrant', 'offensive'))
    OR
    -- Other stats: no modifier required
    (stat_type IN ('assist', 'steal', 'block', 'turnover') AND modifier IS NULL)
    OR
    -- Turnovers with modifiers (optional)
    (stat_type = 'turnover' AND modifier IN ('offensive_foul', 'steal', 'bad_pass', 'travel', 'double_dribble'))
  )
);

-- Step 4: Verify constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname = 'game_stats_modifier_check';

SELECT '=== CONSTRAINT UPDATE COMPLETE ===' as status;

