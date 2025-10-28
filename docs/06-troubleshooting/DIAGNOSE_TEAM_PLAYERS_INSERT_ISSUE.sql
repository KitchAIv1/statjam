-- ============================================================================
-- DIAGNOSE TEAM_PLAYERS INSERT ISSUE
-- ============================================================================
-- Purpose: Identify why organizer cannot add players to teams
-- Run this in Supabase SQL Editor while logged in as the organizer
-- ============================================================================

-- STEP 1: Check team_players table structure
SELECT 
    '=== TEAM_PLAYERS STRUCTURE ===' as section,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'team_players'
ORDER BY ordinal_position;

-- STEP 2: Check constraints
SELECT 
    '=== CONSTRAINTS ===' as section,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'team_players';

-- STEP 3: Check the specific CHECK constraint
SELECT 
    '=== CHECK CONSTRAINT DEFINITION ===' as section,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'team_players_player_required';

-- STEP 4: Check RLS policies
SELECT 
    '=== RLS POLICIES ===' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'team_players'
ORDER BY policyname;

-- STEP 5: Test a sample insert (replace with your actual IDs)
-- IMPORTANT: Replace these UUIDs with real values from your database
DO $$
DECLARE
    test_team_id UUID := 'YOUR_TEAM_ID_HERE';  -- Replace with actual team ID
    test_player_id UUID := 'YOUR_PLAYER_ID_HERE';  -- Replace with actual player ID
BEGIN
    -- Try to insert
    BEGIN
        INSERT INTO team_players (team_id, player_id)
        VALUES (test_team_id, test_player_id);
        
        RAISE NOTICE '✅ INSERT SUCCESSFUL';
        
        -- Rollback the test insert
        RAISE EXCEPTION 'Rolling back test insert';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ INSERT FAILED: %', SQLERRM;
    END;
END $$;

-- STEP 6: Check if player_id column is nullable
SELECT 
    '=== PLAYER_ID NULLABLE CHECK ===' as section,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'team_players'
AND column_name IN ('player_id', 'custom_player_id');

-- STEP 7: Check existing team_players data
SELECT 
    '=== EXISTING DATA SAMPLE ===' as section,
    tp.team_id,
    tp.player_id,
    tp.custom_player_id,
    t.name as team_name,
    u.name as player_name
FROM team_players tp
LEFT JOIN teams t ON tp.team_id = t.id
LEFT JOIN users u ON tp.player_id = u.id
LIMIT 5;

