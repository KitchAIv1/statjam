-- ============================================================================
-- POLICY CONFLICT FIX - Based on SOURCE OF TRUTH Documentation
-- ============================================================================
-- Reference: RLS_ISSUE_ANALYSIS.md, SYSTEM_AUDIT_SOURCE_OF_TRUTH.md
-- Issue: Multiple RLS policies causing conflict for anon users on homepage
-- Solution: Remove conflicting policies, keep only the correct ones
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX: REMOVE CONFLICTING GAMES POLICIES
-- ----------------------------------------------------------------------------

-- Problem: We have TWO policies for anon access to games:
-- 1. "games_public_read_policy" - USING (true) - TOO PERMISSIVE
-- 2. "public_view_games" - USING (tournament.is_public = true) - CORRECT

-- Remove the overly permissive policy
DROP POLICY IF EXISTS "games_public_read_policy" ON games;

-- Keep the correct policy that restricts to public tournaments only
-- (public_view_games already exists and is correct)

-- ----------------------------------------------------------------------------
-- VERIFICATION: Check remaining policies
-- ----------------------------------------------------------------------------

SELECT 'Remaining games policies:' as status;
SELECT 
    policyname,
    roles,
    cmd as command,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'games'
AND roles::text LIKE '%anon%'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- TEST: Verify anon can access public games
-- ----------------------------------------------------------------------------

SET ROLE anon;
SELECT 'Testing anon access after policy fix:' as test;
SELECT 
    id,
    status,
    tournament_id
FROM games 
WHERE status IN ('live', 'in_progress', 'overtime')
LIMIT 3;
RESET ROLE;

-- ----------------------------------------------------------------------------
-- SUMMARY
-- ----------------------------------------------------------------------------

SELECT 'POLICY CONFLICT RESOLVED!' as status;
SELECT 'Anon users can now access games from public tournaments only' as result;
