-- ============================================================================
-- COMPARISON: games vs game_stats RLS Policy Structure
-- 
-- PURPOSE: Since games table WebSocket IS working but game_stats is NOT,
-- we need to compare their RLS policy structures to identify the difference.
-- 
-- GOAL: Find what makes games table real-time work and apply same pattern
-- ============================================================================

-- ============================================================================
-- PHASE 1: Check games Table RLS Policies
-- ============================================================================

-- Step 1.1: List all RLS policies on games table
SELECT 
    '=== GAMES TABLE RLS POLICIES ===' as comparison_step,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'games'
ORDER BY cmd, policyname;

-- Step 1.2: Check if games table has public SELECT policy (for anon role)
SELECT 
    '=== GAMES TABLE PUBLIC SELECT POLICIES ===' as comparison_step,
    policyname,
    roles,
    cmd as command,
    CASE 
        WHEN 'anon' = ANY(roles::text[]) THEN '✅ Includes anon role'
        ELSE '❌ No anon role'
    END as anon_access,
    qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'games'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 1.3: Get full policy definition for games public SELECT
-- This shows the exact structure that works for real-time
SELECT 
    '=== GAMES PUBLIC SELECT POLICY DETAIL ===' as comparison_step,
    policyname,
    pg_get_expr(qual, 'public.games'::regclass) as using_expression,
    pg_get_expr(with_check, 'public.games'::regclass) as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'games'
AND cmd = 'SELECT'
AND 'anon' = ANY(roles::text[])
ORDER BY policyname;

-- ============================================================================
-- PHASE 2: Compare game_stats Table RLS Policies
-- ============================================================================

-- Step 2.1: List all RLS policies on game_stats table
SELECT 
    '=== GAME_STATS TABLE RLS POLICIES ===' as comparison_step,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
ORDER BY cmd, policyname;

-- Step 2.2: Check if game_stats table has public SELECT policy (for anon role)
SELECT 
    '=== GAME_STATS TABLE PUBLIC SELECT POLICIES ===' as comparison_step,
    policyname,
    roles,
    cmd as command,
    CASE 
        WHEN 'anon' = ANY(roles::text[]) THEN '✅ Includes anon role'
        ELSE '❌ No anon role'
    END as anon_access,
    qual as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Step 2.3: Get full policy definition for game_stats public SELECT
-- This shows the exact structure that doesn't work for real-time
SELECT 
    '=== GAME_STATS PUBLIC SELECT POLICY DETAIL ===' as comparison_step,
    policyname,
    pg_get_expr(qual, 'public.game_stats'::regclass) as using_expression,
    pg_get_expr(with_check, 'public.game_stats'::regclass) as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
AND 'anon' = ANY(roles::text[])
ORDER BY policyname;

-- ============================================================================
-- PHASE 3: Side-by-Side Comparison
-- ============================================================================

-- Step 3.1: Compare policy complexity (JOIN count, nested EXISTS, etc.)
SELECT 
    '=== POLICY STRUCTURE COMPARISON ===' as comparison_step,
    'games' as table_name,
    policyname,
    CASE 
        WHEN qual::text LIKE '%JOIN%' THEN 'Has JOIN'
        WHEN qual::text LIKE '%EXISTS%' THEN 'Has EXISTS'
        ELSE 'Simple condition'
    END as structure_type,
    CASE 
        WHEN qual::text LIKE '%EXISTS%EXISTS%' THEN 'Nested EXISTS'
        WHEN qual::text LIKE '%EXISTS%' THEN 'Single EXISTS'
        ELSE 'No EXISTS'
    END as exists_depth
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'games'
AND cmd = 'SELECT'
AND 'anon' = ANY(roles::text[])

UNION ALL

SELECT 
    '=== POLICY STRUCTURE COMPARISON ===' as comparison_step,
    'game_stats' as table_name,
    policyname,
    CASE 
        WHEN qual::text LIKE '%JOIN%' THEN 'Has JOIN'
        WHEN qual::text LIKE '%EXISTS%' THEN 'Has EXISTS'
        ELSE 'Simple condition'
    END as structure_type,
    CASE 
        WHEN qual::text LIKE '%EXISTS%EXISTS%' THEN 'Nested EXISTS'
        WHEN qual::text LIKE '%EXISTS%' THEN 'Single EXISTS'
        ELSE 'No EXISTS'
    END as exists_depth
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'game_stats'
AND cmd = 'SELECT'
AND 'anon' = ANY(roles::text[])

ORDER BY table_name, policyname;

-- Step 3.2: Check replication status for both tables
SELECT 
    '=== REPLICATION STATUS COMPARISON ===' as comparison_step,
    tablename,
    CASE 
        WHEN tablename IN (SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime') 
        THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as replication_status
FROM (VALUES ('games'), ('game_stats')) AS t(tablename)
ORDER BY tablename;

-- ============================================================================
-- PHASE 4: Test Anonymous SELECT on Both Tables
-- ============================================================================

-- Step 4.1: Test games table anonymous SELECT (this works for real-time)
SELECT 
    '=== GAMES TABLE ANONYMOUS SELECT TEST ===' as comparison_step,
    COUNT(*) as accessible_games_count
FROM games g
WHERE EXISTS (
    SELECT 1 
    FROM tournaments t
    WHERE t.id = g.tournament_id
    AND t.is_public = true
)
LIMIT 1;

-- Step 4.2: Test game_stats table anonymous SELECT (this doesn't work for real-time)
SELECT 
    '=== GAME_STATS TABLE ANONYMOUS SELECT TEST ===' as comparison_step,
    COUNT(*) as accessible_stats_count
FROM game_stats gs
WHERE EXISTS (
    SELECT 1 
    FROM games g
    JOIN tournaments t ON g.tournament_id = t.id
    WHERE g.id = gs.game_id 
    AND t.is_public = true
)
LIMIT 1;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '=== COMPARISON ANALYSIS COMPLETE ===' as status,
       'Review the results above to identify structural differences' as next_action,
       'Key things to look for: JOIN vs EXISTS, nested depth, policy complexity' as analysis_guide;

