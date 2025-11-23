-- ============================================================================
-- DIAGNOSTIC: Check RLS Policies for game_substitutions
-- ============================================================================
-- Purpose: Verify that RLS policies are correctly set up for custom player substitutions
-- Run this in Supabase SQL Editor to diagnose 403 errors
-- ============================================================================

-- STEP 1: Check all policies on game_substitutions table
SELECT 
    '=== CURRENT POLICIES ===' as section,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'game_substitutions'
ORDER BY policyname;

-- STEP 2: Check if RLS is enabled
SELECT 
    '=== RLS STATUS ===' as section,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'game_substitutions'
AND schemaname = 'public';

-- STEP 3: Check current user context
SELECT 
    '=== USER CONTEXT ===' as section,
    current_user,
    session_user,
    auth.uid() as auth_uid;

-- STEP 4: Test if a game exists with stat_admin_id matching current user
-- (Replace with actual game_id from your error)
SELECT 
    '=== GAME CHECK ===' as section,
    id,
    stat_admin_id,
    team_a_id,
    team_b_id,
    is_coach_game,
    CASE 
        WHEN stat_admin_id = auth.uid() THEN '✅ Match - coach is stat_admin'
        ELSE '❌ No match - coach is NOT stat_admin'
    END as stat_admin_match
FROM games
WHERE id = '2adcc3f0-b65e-4621-82be-f700f1c81d17'; -- Replace with your game_id

-- STEP 5: Test if custom players exist for current coach
SELECT 
    '=== CUSTOM PLAYERS CHECK ===' as section,
    id,
    name,
    coach_id,
    team_id,
    CASE 
        WHEN coach_id = auth.uid() THEN '✅ Coach owns this player'
        ELSE '❌ Coach does NOT own this player'
    END as ownership_status
FROM custom_players
WHERE coach_id = auth.uid()
LIMIT 5;

-- STEP 6: Test policy evaluation (simulate INSERT check)
-- This shows which policies would match for an INSERT
SELECT 
    '=== POLICY EVALUATION TEST ===' as section,
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'INSERT' THEN '✅ Applies to INSERT'
        WHEN cmd = 'ALL' THEN '✅ Applies to INSERT (FOR ALL)'
        ELSE '❌ Does NOT apply to INSERT'
    END as applies_to_insert,
    with_check as policy_condition
FROM pg_policies
WHERE tablename = 'game_substitutions'
AND (cmd = 'INSERT' OR cmd = 'ALL')
ORDER BY policyname;

