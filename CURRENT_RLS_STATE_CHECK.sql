-- ============================================================================
-- CURRENT RLS STATE DIAGNOSTIC - ANON ACCESS TO GAMES
-- ============================================================================
-- Purpose: Check what's blocking anon users from accessing games table
-- Issue: Query hangs completely for anon users
-- ============================================================================

-- 1. Check if RLS is enabled on games table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'games';

-- 2. Check ALL policies on games table (not just anon)
SELECT 
  policyname,
  roles,
  cmd,
  permissive,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- 3. Check if there are ANY policies allowing anon SELECT on games
SELECT 
  policyname,
  'anon' = ANY(roles) as allows_anon,
  cmd,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'games' 
  AND cmd = 'SELECT'
  AND 'anon' = ANY(roles);

-- 4. Test anon access to tournaments (should work)
SELECT 'Testing anon access to tournaments...' as test;
SET ROLE anon;
SELECT COUNT(*) as tournament_count FROM tournaments WHERE is_public = true;
RESET ROLE;

-- 5. Test anon access to games (this should fail/hang)
SELECT 'Testing anon access to games...' as test;
SET ROLE anon;
-- This will likely hang or fail
SELECT COUNT(*) as games_count FROM games LIMIT 1;
RESET ROLE;

-- 6. Check what tournaments are marked as public
SELECT id, name, is_public 
FROM tournaments 
WHERE is_public = true 
LIMIT 5;

-- 7. Check if any games exist for public tournaments
SELECT 
  g.id,
  g.status,
  t.name as tournament_name,
  t.is_public
FROM games g
JOIN tournaments t ON g.tournament_id = t.id
WHERE t.is_public = true
LIMIT 5;
