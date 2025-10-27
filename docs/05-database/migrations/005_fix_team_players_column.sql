-- ============================================================================
-- FIX TEAM_PLAYERS CUSTOM_PLAYER_ID COLUMN
-- ============================================================================
-- Purpose: Add missing custom_player_id column to team_players table
-- Context: The custom_players table exists but team_players wasn't updated
-- ============================================================================

-- Check if custom_player_id column exists
DO $$
BEGIN
    -- Add custom_player_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_players' 
        AND column_name = 'custom_player_id'
    ) THEN
        ALTER TABLE team_players 
        ADD COLUMN custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added custom_player_id column to team_players table';
    ELSE
        RAISE NOTICE 'custom_player_id column already exists in team_players table';
    END IF;
END $$;

-- Add constraint to ensure either player_id OR custom_player_id (but not both)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'team_players' 
        AND constraint_name = 'team_players_player_required'
    ) THEN
        ALTER TABLE team_players DROP CONSTRAINT team_players_player_required;
        RAISE NOTICE 'Dropped existing team_players_player_required constraint';
    END IF;
    
    -- Add the constraint
    ALTER TABLE team_players 
    ADD CONSTRAINT team_players_player_required 
    CHECK (
        (player_id IS NOT NULL AND custom_player_id IS NULL) OR
        (player_id IS NULL AND custom_player_id IS NOT NULL)
    );
    
    RAISE NOTICE 'Added team_players_player_required constraint';
END $$;

-- Add index for custom player lookups
CREATE INDEX IF NOT EXISTS idx_team_players_custom_player_id ON team_players(custom_player_id);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'team_players' 
AND column_name IN ('player_id', 'custom_player_id')
ORDER BY column_name;
