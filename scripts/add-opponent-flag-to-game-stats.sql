-- Add is_opponent_stat flag to game_stats table
-- This allows us to distinguish opponent stats from coach team stats in coach mode

BEGIN;

-- Step 1: Add the column to game_stats
ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS is_opponent_stat BOOLEAN DEFAULT FALSE;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_opponent 
ON game_stats(game_id, is_opponent_stat);

-- Step 3: Add the same column to stats table for consistency
ALTER TABLE stats 
ADD COLUMN IF NOT EXISTS is_opponent_stat BOOLEAN DEFAULT FALSE;

-- Step 4: Update the trigger to preserve the flag
CREATE OR REPLACE FUNCTION public.update_player_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- For REGULAR PLAYERS (player_id IS NOT NULL)
  IF NEW.player_id IS NOT NULL THEN
    INSERT INTO stats (
      match_id, 
      player_id,
      custom_player_id,
      is_opponent_stat,  -- NEW: Preserve opponent flag
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
      NEW.player_id,
      NULL,
      NEW.is_opponent_stat,  -- NEW: Copy from game_stats
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
    ON CONFLICT (match_id, player_id) WHERE player_id IS NOT NULL DO UPDATE SET
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
      
  -- For CUSTOM PLAYERS (custom_player_id IS NOT NULL)
  ELSIF NEW.custom_player_id IS NOT NULL THEN
    INSERT INTO stats (
      match_id, 
      player_id,
      custom_player_id,
      is_opponent_stat,  -- NEW: Preserve opponent flag
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
      NULL,
      NEW.custom_player_id,
      NEW.is_opponent_stat,  -- NEW: Copy from game_stats
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
    ON CONFLICT (match_id, custom_player_id) WHERE custom_player_id IS NOT NULL DO UPDATE SET
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
  END IF;
  
  RETURN NEW;
END;
$function$;

COMMIT;

SELECT '✅ Added is_opponent_stat flag to game_stats and stats tables' as status;
SELECT '✅ Updated trigger to preserve opponent flag' as status;

