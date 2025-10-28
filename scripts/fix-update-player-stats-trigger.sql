-- Fix the update_player_stats trigger function to support custom players
-- This trigger runs AFTER INSERT on game_stats and aggregates data into the stats table

-- Step 1: Create or update unique constraint to handle both player types
DO $$ 
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stats_match_player_unique'
  ) THEN
    ALTER TABLE stats DROP CONSTRAINT stats_match_player_unique;
    RAISE NOTICE 'Dropped old stats_match_player_unique constraint';
  END IF;
  
  -- Create new unique constraint that works with either player_id OR custom_player_id
  -- Use COALESCE to create a unique index on whichever ID is present
  CREATE UNIQUE INDEX IF NOT EXISTS stats_match_player_unique_idx
  ON stats (match_id, COALESCE(player_id, custom_player_id));
  
  RAISE NOTICE 'Created new unique index for stats table';
END $$;

-- Step 2: Update the trigger function
CREATE OR REPLACE FUNCTION public.update_player_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Insert or update stats for either regular players OR custom players
  INSERT INTO stats (
    match_id, 
    player_id,           -- Will be NULL for custom players
    custom_player_id,    -- Will be NULL for regular players
    points_made, 
    points_missed, 
    assists, 
    rebounds, 
    blocks, 
    steals, 
    turnovers, 
    fouls, 
    timestamp
  )
  VALUES (
    NEW.game_id, 
    NEW.player_id,           -- NULL if custom player
    NEW.custom_player_id,    -- NULL if regular player
    '{}', 
    '{}', 
    0, 
    '{}', 
    0, 
    0, 
    0, 
    '{}', 
    NOW()
  )
  -- Use the unique index to detect conflicts
  ON CONFLICT (match_id, COALESCE(player_id, custom_player_id)) DO UPDATE SET
    points_made = CASE 
      WHEN NEW.stat_type IN ('three_pointer', 'field_goal', 'free_throw') AND NEW.modifier = 'made' THEN
        stats.points_made || jsonb_build_object(
          CASE NEW.stat_value 
            WHEN 3 THEN '3pt' 
            WHEN 2 THEN '2pt' 
            ELSE '1pt' 
          END,
          COALESCE((stats.points_made->>(CASE NEW.stat_value WHEN 3 THEN '3pt' WHEN 2 THEN '2pt' ELSE '1pt' END))::int, 0) + 1
        )
      ELSE stats.points_made 
    END,
    points_missed = CASE 
      WHEN NEW.stat_type IN ('three_pointer', 'field_goal', 'free_throw') AND NEW.modifier = 'missed' THEN
        stats.points_missed || jsonb_build_object(
          CASE NEW.stat_value 
            WHEN 3 THEN '3pt' 
            WHEN 2 THEN '2pt' 
            ELSE '1pt' 
          END,
          COALESCE((stats.points_missed->>(CASE NEW.stat_value WHEN 3 THEN '3pt' WHEN 2 THEN '2pt' ELSE '1pt' END))::int, 0) + 1
        )
      ELSE stats.points_missed 
    END,
    assists = CASE WHEN NEW.stat_type = 'assist' THEN stats.assists + NEW.stat_value ELSE stats.assists END,
    rebounds = CASE WHEN NEW.stat_type = 'rebound' THEN stats.rebounds || jsonb_build_object(NEW.modifier, COALESCE((stats.rebounds->>NEW.modifier)::int, 0) + 1) ELSE stats.rebounds END,
    blocks = CASE WHEN NEW.stat_type = 'block' THEN stats.blocks + NEW.stat_value ELSE stats.blocks END,
    steals = CASE WHEN NEW.stat_type = 'steal' THEN stats.steals + NEW.stat_value ELSE stats.steals END,
    turnovers = CASE WHEN NEW.stat_type = 'turnover' THEN stats.turnovers + NEW.stat_value ELSE stats.turnovers END,
    fouls = CASE WHEN NEW.stat_type = 'foul' THEN stats.fouls || jsonb_build_object(NEW.modifier, COALESCE((stats.fouls->>NEW.modifier)::int, 0) + 1) ELSE stats.fouls END,
    timestamp = NOW();
    
  RETURN NEW;
END;
$function$;

-- Verify the function was updated
SELECT 
  '✅ Trigger function updated successfully' as status,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'update_player_stats';

