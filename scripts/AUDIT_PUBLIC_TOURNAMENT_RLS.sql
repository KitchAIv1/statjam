-- ========================================
-- AUDIT: Public Tournament RLS Policies
-- Date: January 13, 2026
-- Purpose: Document current RLS state for public tournament/game viewer
-- ========================================

-- ========================================
-- SECTION 1: game_stats TABLE POLICIES
-- This is the main issue - public tournament pages can't fetch stats
-- ========================================

SELECT 
    '📊 game_stats POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;

-- Count policies by role type
SELECT 
    '📊 game_stats SUMMARY' as section,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE 'anon' = ANY(roles)) as anon_policies,
    COUNT(*) FILTER (WHERE 'authenticated' = ANY(roles)) as auth_policies,
    COUNT(*) FILTER (WHERE 'public' = ANY(roles)) as public_policies
FROM pg_policies 
WHERE tablename = 'game_stats';

-- ========================================
-- SECTION 2: games TABLE POLICIES
-- Public access to game info
-- ========================================

SELECT 
    '🎮 games POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'games'
ORDER BY policyname;

-- ========================================
-- SECTION 3: tournaments TABLE POLICIES
-- Public access to tournament info
-- ========================================

SELECT 
    '🏆 tournaments POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'tournaments'
ORDER BY policyname;

-- ========================================
-- SECTION 4: teams TABLE POLICIES
-- Public access to team info
-- ========================================

SELECT 
    '👥 teams POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname;

-- ========================================
-- SECTION 5: users TABLE POLICIES
-- Public access to player info (names, photos)
-- ========================================

SELECT 
    '👤 users POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- ========================================
-- SECTION 6: game_substitutions TABLE POLICIES
-- Public access to substitution data
-- ========================================

SELECT 
    '🔄 game_substitutions POLICIES' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    CASE 
        WHEN 'anon' = ANY(roles) THEN '✅ ANON ACCESS'
        WHEN 'authenticated' = ANY(roles) THEN '🔐 AUTH ONLY'
        ELSE '❓ OTHER'
    END as access_type,
    LEFT(qual::text, 200) as using_clause_preview
FROM pg_policies 
WHERE tablename = 'game_substitutions'
ORDER BY policyname;

-- ========================================
-- SECTION 7: CRITICAL SUMMARY
-- Tables that NEED anon access for public tournament pages
-- ========================================

SELECT 
    '⚠️ CRITICAL: ANON ACCESS SUMMARY' as section,
    tablename,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE 'anon' = ANY(roles)) as anon_select_policies,
    CASE 
        WHEN COUNT(*) FILTER (WHERE 'anon' = ANY(roles) AND cmd = 'SELECT') > 0 
        THEN '✅ PUBLIC CAN READ'
        ELSE '❌ PUBLIC CANNOT READ'
    END as public_access_status
FROM pg_policies 
WHERE tablename IN ('game_stats', 'games', 'tournaments', 'teams', 'users', 'game_substitutions')
GROUP BY tablename
ORDER BY tablename;

-- ========================================
-- SECTION 8: SPECIFIC POLICY DETAILS FOR game_stats
-- Full USING clauses to understand access patterns
-- ========================================

SELECT 
    '🔍 game_stats FULL POLICY DETAILS' as section,
    policyname,
    cmd as operation,
    roles::text as roles,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;

-- ========================================
-- SECTION 9: Check for public tournament access pattern
-- Does any policy check tournaments.is_public?
-- ========================================

SELECT 
    '🔎 POLICIES CHECKING is_public' as section,
    tablename,
    policyname,
    cmd as operation,
    roles::text as roles
FROM pg_policies 
WHERE qual::text ILIKE '%is_public%'
   OR with_check::text ILIKE '%is_public%'
ORDER BY tablename, policyname;

-- ========================================
-- END OF AUDIT
-- Run this in Supabase SQL Editor and document results
-- ========================================

