-- ============================================================================
-- CHECK CURRENT RLS POLICIES - DIAGNOSE WHAT'S BLOCKING ACCESS
-- ============================================================================

-- Check all policies on games table (likely the problem)
SELECT 
  'GAMES TABLE POLICIES' as section,
  policyname,
  roles,
  cmd,
  permissive,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- Check if there are conflicting policies
SELECT 
  'POLICY CONFLICTS CHECK' as section,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'games' 
  AND cmd = 'SELECT'
  AND 'anon' = ANY(roles);

-- Test anon access to games
SELECT 'TESTING ANON ACCESS' as test;
SET ROLE anon;
SELECT COUNT(*) as games_accessible_to_anon FROM games LIMIT 1;
RESET ROLE;

-- Test authenticated access to games  
SELECT 'TESTING AUTHENTICATED ACCESS' as test;
-- This will show what an authenticated user can see
SELECT COUNT(*) as games_accessible_to_authenticated FROM games LIMIT 1;
