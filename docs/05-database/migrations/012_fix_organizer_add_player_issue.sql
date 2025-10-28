-- ============================================================================
-- FIX ORGANIZER ADD PLAYER ISSUE
-- ============================================================================
-- Purpose: Fix the issue preventing organizers from adding players to teams
-- Context: After custom_player_id migration, organizers can't add players
-- ============================================================================

-- STEP 1: Drop any conflicting system-generated constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find and drop any system-generated NOT NULL constraints
    FOR constraint_record IN 
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'team_players'::regclass
        AND contype = 'c'
        AND conname LIKE '%_not_null'
    LOOP
        EXECUTE format('ALTER TABLE team_players DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- STEP 2: Ensure the correct CHECK constraint exists
ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_player_required;

ALTER TABLE team_players 
ADD CONSTRAINT team_players_player_required 
CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR
    (player_id IS NULL AND custom_player_id IS NOT NULL)
);

-- STEP 3: Ensure both columns are nullable
ALTER TABLE team_players ALTER COLUMN player_id DROP NOT NULL;
ALTER TABLE team_players ALTER COLUMN custom_player_id DROP NOT NULL;

-- STEP 4: Fix the upsert conflict target in case it's wrong
-- The primary key should be on 'id', not on (team_id, player_id)
DO $$
BEGIN
    -- Drop old unique constraint if it exists
    ALTER TABLE team_players DROP CONSTRAINT IF EXISTS team_players_team_id_player_id_key;
    
    -- Ensure we have a unique index for the upsert to work
    CREATE UNIQUE INDEX IF NOT EXISTS idx_team_players_unique_player 
    ON team_players(team_id, player_id) 
    WHERE player_id IS NOT NULL;
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_team_players_unique_custom 
    ON team_players(team_id, custom_player_id) 
    WHERE custom_player_id IS NOT NULL;
    
    RAISE NOTICE '✅ Created unique indexes for upsert operations';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Index creation issue (may already exist): %', SQLERRM;
END $$;

-- STEP 5: Verify RLS policies allow organizer INSERT
-- Drop and recreate the organizer policy to ensure it's correct
DROP POLICY IF EXISTS "team_players_organizer_full_access" ON team_players;

CREATE POLICY "team_players_organizer_full_access" ON team_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND t.tournament_id IS NOT NULL 
      AND tr.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      LEFT JOIN tournaments tr ON t.tournament_id = tr.id
      WHERE t.id = team_players.team_id 
      AND t.tournament_id IS NOT NULL 
      AND tr.organizer_id = auth.uid()
    )
  );

-- STEP 6: Verify the fix
SELECT 
    '=== VERIFICATION ===' as section,
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'team_players'
AND column_name IN ('player_id', 'custom_player_id');

SELECT 
    '=== CONSTRAINTS ===' as section,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'team_players'::regclass
AND contype = 'c'
ORDER BY conname;

RAISE NOTICE '✅ Migration complete - organizers should now be able to add players';

