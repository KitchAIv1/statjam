-- Step 1: Check for triggers on game_stats table
SELECT 
  '=== TRIGGERS ON game_stats ===' as info,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as action
FROM information_schema.triggers
WHERE event_object_table = 'game_stats'
ORDER BY trigger_name;

-- Step 2: Check for triggers on stats table
SELECT 
  '=== TRIGGERS ON stats ===' as info,
  trigger_name,
  event_manipulation as event,
  action_timing as timing,
  action_statement as action
FROM information_schema.triggers
WHERE event_object_table = 'stats'
ORDER BY trigger_name;

-- Step 3: Find trigger functions related to stats
SELECT 
  '=== TRIGGER FUNCTIONS ===' as info,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%stat%' 
    OR p.proname LIKE '%aggregate%'
    OR p.proname LIKE '%trigger%'
  )
  AND p.prorettype = 'trigger'::regtype
ORDER BY p.proname;

