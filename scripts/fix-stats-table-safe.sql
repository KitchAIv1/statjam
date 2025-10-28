-- Safe migration for stats table to support custom players
-- This version checks each step and provides feedback

BEGIN;

-- Step 1: Check current state
DO $$ 
DECLARE
  has_custom_col BOOLEAN;
  player_id_nullable BOOLEAN;
BEGIN
  -- Check if custom_player_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stats' 
    AND column_name = 'custom_player_id'
  ) INTO has_custom_col;
  
  -- Check if player_id is nullable
  SELECT is_nullable = 'YES' INTO player_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'stats' 
  AND column_name = 'player_id';
  
  RAISE NOTICE '=== CURRENT STATE ===';
  RAISE NOTICE 'custom_player_id column exists: %', has_custom_col;
  RAISE NOTICE 'player_id is nullable: %', player_id_nullable;
END $$;

-- Step 2: Add custom_player_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stats' 
    AND column_name = 'custom_player_id'
  ) THEN
    ALTER TABLE stats 
    ADD COLUMN custom_player_id UUID REFERENCES custom_players(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added custom_player_id column';
  ELSE
    RAISE NOTICE '⏭️  custom_player_id column already exists';
  END IF;
END $$;

-- Step 3: Make player_id nullable if it isn't already
DO $$ 
DECLARE
  is_null BOOLEAN;
BEGIN
  SELECT is_nullable = 'YES' INTO is_null
  FROM information_schema.columns
  WHERE table_name = 'stats' 
  AND column_name = 'player_id';
  
  IF NOT is_null THEN
    ALTER TABLE stats ALTER COLUMN player_id DROP NOT NULL;
    RAISE NOTICE '✅ Made player_id nullable';
  ELSE
    RAISE NOTICE '⏭️  player_id is already nullable';
  END IF;
END $$;

-- Step 4: Drop old constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stats_player_required' 
    AND conrelid = 'stats'::regclass
  ) THEN
    ALTER TABLE stats DROP CONSTRAINT stats_player_required;
    RAISE NOTICE '✅ Dropped old stats_player_required constraint';
  ELSE
    RAISE NOTICE '⏭️  No existing stats_player_required constraint';
  END IF;
END $$;

-- Step 5: Add new constraint
DO $$ 
BEGIN
  ALTER TABLE stats 
  ADD CONSTRAINT stats_player_required 
  CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR 
    (player_id IS NULL AND custom_player_id IS NOT NULL)
  );
  RAISE NOTICE '✅ Added new stats_player_required constraint';
END $$;

-- Step 6: Add index for performance
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_stats_custom_player_id 
  ON stats(custom_player_id);
  RAISE NOTICE '✅ Added index on custom_player_id';
END $$;

-- Step 7: Add RLS policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "stats_custom_player_coach_read" ON stats;
  DROP POLICY IF EXISTS "stats_custom_player_coach_insert" ON stats;
  DROP POLICY IF EXISTS "stats_custom_player_stat_admin_read" ON stats;

  -- Allow coaches to read stats for their custom players
  CREATE POLICY "stats_custom_player_coach_read" ON stats
    FOR SELECT TO authenticated
    USING (
      custom_player_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM custom_players cp
        WHERE cp.id = stats.custom_player_id 
        AND cp.coach_id = auth.uid()
      )
    );

  -- Allow coaches to insert stats for their custom players
  CREATE POLICY "stats_custom_player_coach_insert" ON stats
    FOR INSERT TO authenticated
    WITH CHECK (
      custom_player_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM custom_players cp
        WHERE cp.id = stats.custom_player_id 
        AND cp.coach_id = auth.uid()
      )
    );

  -- Allow stat admins to read custom player stats for their matches
  CREATE POLICY "stats_custom_player_stat_admin_read" ON stats
    FOR SELECT TO authenticated
    USING (
      custom_player_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM games g
        WHERE g.id = stats.match_id 
        AND g.stat_admin_id = auth.uid()
      )
    );

  RAISE NOTICE '✅ Added RLS policies for custom players';
END $$;

-- Step 8: Verify final state
DO $$ 
DECLARE
  has_custom_col BOOLEAN;
  player_id_nullable BOOLEAN;
  has_constraint BOOLEAN;
  has_index BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stats' 
    AND column_name = 'custom_player_id'
  ) INTO has_custom_col;
  
  SELECT is_nullable = 'YES' INTO player_id_nullable
  FROM information_schema.columns
  WHERE table_name = 'stats' 
  AND column_name = 'player_id';
  
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stats_player_required'
  ) INTO has_constraint;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_stats_custom_player_id'
  ) INTO has_index;
  
  RAISE NOTICE '=== FINAL STATE ===';
  RAISE NOTICE 'custom_player_id column: %', has_custom_col;
  RAISE NOTICE 'player_id nullable: %', player_id_nullable;
  RAISE NOTICE 'stats_player_required constraint: %', has_constraint;
  RAISE NOTICE 'idx_stats_custom_player_id index: %', has_index;
  
  IF has_custom_col AND player_id_nullable AND has_constraint AND has_index THEN
    RAISE NOTICE '✅ ✅ ✅ MIGRATION SUCCESSFUL ✅ ✅ ✅';
  ELSE
    RAISE EXCEPTION 'Migration incomplete - check logs above';
  END IF;
END $$;

COMMIT;

