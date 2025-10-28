-- Check for triggers that update the stats table
-- This will show us if there's a trigger that needs updating

-- Step 1: Find all triggers on game_stats table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
ORDER BY trigger_name;

-- Step 2: Find all triggers on stats table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'stats'
ORDER BY trigger_name;

-- Step 3: Get the actual trigger function code
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%stat%'
  AND p.proname LIKE '%trigger%'
ORDER BY p.proname;

