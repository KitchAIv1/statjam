-- Update the trigger function to work with the new partial unique indexes

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
      NULL,  -- custom_player_id is NULL for regular players
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
      NULL,  -- player_id is NULL for custom players
      NEW.custom_player_id,
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

SELECT '✅ Trigger function updated to use partial unique indexes' as status;

