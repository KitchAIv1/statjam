-- Check all RLS policies on team_players
SELECT 
    policyname,
    cmd,  -- SELECT, INSERT, UPDATE, DELETE, ALL
    qual,  -- USING clause
    with_check  -- WITH CHECK clause
FROM pg_policies
WHERE tablename = 'team_players'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'team_players';

-- Test if current user can insert (replace UUIDs with real values)
-- This will show if RLS is blocking
DO $$
DECLARE
    test_team_id UUID := '00000000-0000-0000-0000-000000000001';  -- Replace
    test_player_id UUID := '00000000-0000-0000-0000-000000000002';  -- Replace
BEGIN
    -- Try to insert
    INSERT INTO team_players (team_id, player_id, custom_player_id)
    VALUES (test_team_id, test_player_id, NULL);
    
    RAISE NOTICE '✅ INSERT SUCCESSFUL - RLS allows this operation';
    
    -- Rollback
    RAISE EXCEPTION 'Rolling back test';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%Rolling back test%' THEN
            RAISE NOTICE '✅ Test completed successfully';
        ELSE
            RAISE NOTICE '❌ INSERT FAILED: %', SQLERRM;
        END IF;
END $$;

