-- ============================================================
-- CHECK CURRENT TRIGGER STATUS ON game_stats TABLE
-- Run this in Supabase SQL Editor to see what triggers are active
-- ============================================================

-- 1. List ALL triggers on game_stats table
SELECT 
  trigger_name,
  event_manipulation AS event_type,
  action_timing AS timing,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ ENABLED (Origin)'
    WHEN tgenabled = 'D' THEN '❌ DISABLED'
    WHEN tgenabled = 'R' THEN '✅ ENABLED (Replica)'
    WHEN tgenabled = 'A' THEN '✅ ENABLED (Always)'
    ELSE tgenabled::text
  END AS status,
  action_statement
FROM information_schema.triggers t
JOIN pg_trigger pt ON t.trigger_name = pt.tgname
WHERE event_object_table = 'game_stats'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 2. Count stats for the problematic game (to see the data size)
SELECT 
  'Stats in game' AS metric,
  COUNT(*) AS count
FROM game_stats
WHERE game_id = '34ef2b6b-ad6d-4c58-8326-916e9a7c4e98';

-- 3. Check for any active locks on the games table
-- SELECT 
--   l.locktype,
--   l.mode,
--   l.granted,
--   a.query,
--   a.state,
--   a.wait_event_type,
--   a.wait_event
-- FROM pg_locks l
-- JOIN pg_stat_activity a ON l.pid = a.pid
-- WHERE l.relation = 'games'::regclass
-- AND NOT l.granted;

-- 4. Check statement timeout setting
SHOW statement_timeout;

