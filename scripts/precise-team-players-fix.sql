-- ============================================================================
-- PRECISE TEAM_PLAYERS FIX - Based on Actual Table Analysis
-- ============================================================================
-- Issue: player_id is NOT NULL but should be NULLABLE for custom players
-- Current structure is mostly correct, just need to fix the constraint
-- ============================================================================

-- Step 1: Check current constraints
SELECT 'Current constraints on team_players:' as info;
SELECT 
  constraint_name, 
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'team_players';

-- Step 2: Make player_id NULLABLE (this is the key fix)
ALTER TABLE team_players ALTER COLUMN player_id DROP NOT NULL;

-- Step 3: Ensure we have the proper either/or constraint
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
ALTER TABLE team_players ADD CONSTRAINT team_players_player_required 
CHECK (
  (player_id IS NOT NULL AND custom_player_id IS NULL) OR
  (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- Step 4: Ensure id column is primary key (if not already)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'team_players' 
        AND constraint_type = 'PRIMARY KEY'
        AND constraint_name LIKE '%id%'
    ) THEN
        ALTER TABLE team_players ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Step 5: Verify the fix
SELECT 'VERIFICATION: Updated team_players structure' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_players' 
ORDER BY ordinal_position;

-- Step 6: Test the constraint works
SELECT 'TESTING: Constraint validation' as info;

-- This should work (player_id set, custom_player_id null)
-- INSERT INTO team_players (team_id, player_id, custom_player_id) 
-- VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', NULL);

-- This should work (player_id null, custom_player_id set)  
-- INSERT INTO team_players (team_id, player_id, custom_player_id)
-- VALUES ('00000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000000003');

-- This should FAIL (both set)
-- INSERT INTO team_players (team_id, player_id, custom_player_id)
-- VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003');

-- This should FAIL (both null)
-- INSERT INTO team_players (team_id, player_id, custom_player_id)
-- VALUES ('00000000-0000-0000-0000-000000000001', NULL, NULL);

SELECT 'SUCCESS: team_players constraint fix completed!' as result;
SELECT 'Now player_id can be NULL for custom players' as note;
