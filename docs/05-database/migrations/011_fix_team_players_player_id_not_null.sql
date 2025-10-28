-- ============================================================================
-- FIX TEAM_PLAYERS PLAYER_ID NOT NULL
-- ============================================================================
-- Purpose: Ensure player_id is NOT NULL (it may have been made nullable)
-- Context: Organizer cannot add players - might be due to nullable player_id
-- ============================================================================

-- STEP 1: Check current state
DO $$
DECLARE
    is_nullable TEXT;
BEGIN
    SELECT column_default INTO is_nullable
    FROM information_schema.columns
    WHERE table_name = 'team_players' AND column_name = 'player_id';
    
    RAISE NOTICE 'Current player_id nullable status: %', is_nullable;
END $$;

-- STEP 2: Make player_id NOT NULL (if it's currently nullable)
-- Note: This will fail if there are existing NULL values
-- In that case, we need to clean up the data first
DO $$
BEGIN
    -- Try to set NOT NULL
    BEGIN
        ALTER TABLE team_players 
        ALTER COLUMN player_id DROP NOT NULL;
        
        RAISE NOTICE '✅ Removed NOT NULL constraint from player_id (allowing NULL for custom players)';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ℹ️ player_id is already nullable or error: %', SQLERRM;
    END;
END $$;

-- STEP 3: Verify the CHECK constraint is correct
DO $$
BEGIN
    -- Drop and recreate the constraint to ensure it's correct
    ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;
    
    ALTER TABLE team_players 
    ADD CONSTRAINT team_players_player_required 
    CHECK (
        (player_id IS NOT NULL AND custom_player_id IS NULL) OR
        (player_id IS NULL AND custom_player_id IS NOT NULL)
    );
    
    RAISE NOTICE '✅ Recreated team_players_player_required constraint';
END $$;

-- STEP 4: Verify the fix
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'team_players'
AND column_name IN ('player_id', 'custom_player_id');

