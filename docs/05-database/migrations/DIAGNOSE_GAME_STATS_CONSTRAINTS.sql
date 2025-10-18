-- ============================================================================
-- DIAGNOSE: game_stats table constraints
-- 
-- PURPOSE: Check the CHECK constraint on modifier column that's causing failures
-- ============================================================================

-- Step 1: Get all constraints on game_stats table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
ORDER BY conname;

-- Step 2: Check specific modifier constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.game_stats'::regclass
AND conname LIKE '%modifier%'
ORDER BY conname;

-- Step 3: Sample existing data to see what modifier values are used
SELECT 
    stat_type,
    modifier,
    COUNT(*) as count
FROM public.game_stats 
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- Step 4: Check column definition
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'game_stats' 
AND table_schema = 'public'
AND column_name = 'modifier';

SELECT '=== GAME_STATS CONSTRAINTS DIAGNOSIS COMPLETE ===' as status;
