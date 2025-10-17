-- ============================================================================
-- STATJAM RLS DIAGNOSTIC - CHECK CURRENT STATE
-- ============================================================================
-- Purpose: Identify what broke after SQL changes
-- Issues: 1. Cannot sign in (auth redirect fails)
--         2. Live games not showing on homepage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DIAGNOSTIC 1: CHECK ALL RLS POLICIES ON CRITICAL TABLES
-- ----------------------------------------------------------------------------

-- Check policies on USERS table (affects authentication)
SELECT '=== USERS TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Check policies on GAMES table (affects live viewer)
SELECT '=== GAMES TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- Check policies on TEAMS table (affects live viewer - team names)
SELECT '=== TEAMS TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- Check policies on TOURNAMENTS table (affects live viewer)
SELECT '=== TOURNAMENTS TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'tournaments'
ORDER BY policyname;

-- Check policies on GAME_STATS table (affects real-time updates)
SELECT '=== GAME_STATS TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;

-- Check policies on GAME_SUBSTITUTIONS table (affects real-time updates)
SELECT '=== GAME_SUBSTITUTIONS TABLE POLICIES ===' as diagnostic;
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'game_substitutions'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- DIAGNOSTIC 2: TEST UNAUTHENTICATED ACCESS (ANON ROLE)
-- ----------------------------------------------------------------------------

SELECT '=== TESTING ANON (PUBLIC) ACCESS ===' as diagnostic;

-- Can anon access users table? (Should NOT be able to - for security)
SET ROLE anon;
SELECT 'Testing anon access to users table...' as test;
SELECT COUNT(*) as anon_user_count FROM users LIMIT 1;
RESET ROLE;

-- Can anon access games table? (Should be able to for public tournaments)
SET ROLE anon;
SELECT 'Testing anon access to games table...' as test;
SELECT 
    id,
    status,
    home_score,
    away_score
FROM games 
WHERE status IN ('live', 'in_progress', 'overtime')
LIMIT 3;
RESET ROLE;

-- Can anon access teams table? (Should be able to for public tournaments)
SET ROLE anon;
SELECT 'Testing anon access to teams table...' as test;
SELECT 
    t.id,
    t.name,
    t.tournament_id
FROM teams t
JOIN tournaments tour ON t.tournament_id = tour.id
WHERE tour.is_public = true
LIMIT 3;
RESET ROLE;

-- Can anon access tournaments table? (Should be able to for public ones)
SET ROLE anon;
SELECT 'Testing anon access to tournaments table...' as test;
SELECT 
    id,
    name,
    is_public
FROM tournaments 
WHERE is_public = true
LIMIT 3;
RESET ROLE;

-- ----------------------------------------------------------------------------
-- DIAGNOSTIC 3: TEST AUTHENTICATED ACCESS
-- ----------------------------------------------------------------------------

SELECT '=== TESTING AUTHENTICATED ACCESS ===' as diagnostic;

-- Can authenticated user access their own profile?
-- (This test requires an actual authenticated user context)
SELECT 'Testing authenticated user self-access to users table...' as test;
SELECT 
    id,
    email,
    role
FROM users 
WHERE id = auth.uid()
LIMIT 1;

-- ----------------------------------------------------------------------------
-- DIAGNOSTIC 4: CHECK REALTIME PUBLICATION
-- ----------------------------------------------------------------------------

SELECT '=== REALTIME PUBLICATION STATUS ===' as diagnostic;
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ----------------------------------------------------------------------------
-- DIAGNOSTIC 5: CHECK TRIGGERS
-- ----------------------------------------------------------------------------

SELECT '=== GAME SCORE UPDATE TRIGGERS ===' as diagnostic;
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE '%game%score%' OR tgname LIKE '%update_game_scores%'
ORDER BY tgname;

-- ----------------------------------------------------------------------------
-- SUMMARY
-- ----------------------------------------------------------------------------

SELECT '=== DIAGNOSTIC COMPLETE ===' as status;
SELECT 'Review results above to identify RLS policy issues' as next_step;
