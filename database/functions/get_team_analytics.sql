-- Coach Team Analytics Aggregation Function
-- Purpose: Aggregate all game stats for a team in ONE query (50x faster than N+1 queries)
-- Usage: SELECT * FROM get_team_analytics('team-uuid-here');

DROP FUNCTION IF EXISTS get_team_analytics(UUID) CASCADE;

CREATE FUNCTION get_team_analytics(p_team_id UUID)
RETURNS TABLE (
  games_played BIGINT,
  total_points BIGINT,
  total_fgm BIGINT,
  total_fga BIGINT,
  total_3pm BIGINT,
  total_3pa BIGINT,
  total_ftm BIGINT,
  total_fta BIGINT,
  total_rebounds BIGINT,
  total_assists BIGINT,
  total_turnovers BIGINT,
  total_opponent_points BIGINT
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Games played
    (SELECT COUNT(DISTINCT g.id)::BIGINT 
     FROM games g 
     WHERE g.team_a_id = p_team_id 
       AND g.status IN ('completed', 'in_progress')
    ) as games_played,
    
    -- Total points
    (SELECT COALESCE(SUM(g.home_score), 0)::BIGINT 
     FROM games g 
     WHERE g.team_a_id = p_team_id 
       AND g.status IN ('completed', 'in_progress')
    ) as total_points,
    
    -- Field goals made (COUNT rows, NOT sum stat_value!)
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type IN ('field_goal', 'two_pointer', 'three_pointer')
       AND gs.modifier = 'made'
       AND gs.is_opponent_stat = false
    ) as total_fgm,
    
    -- Field goals attempted
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type IN ('field_goal', 'two_pointer', 'three_pointer')
       AND gs.is_opponent_stat = false
    ) as total_fga,
    
    -- 3-pointers made
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'three_pointer'
       AND gs.modifier = 'made'
       AND gs.is_opponent_stat = false
    ) as total_3pm,
    
    -- 3-pointers attempted
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'three_pointer'
       AND gs.is_opponent_stat = false
    ) as total_3pa,
    
    -- Free throws made
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'free_throw'
       AND gs.modifier = 'made'
       AND gs.is_opponent_stat = false
    ) as total_ftm,
    
    -- Free throws attempted
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'free_throw'
       AND gs.is_opponent_stat = false
    ) as total_fta,
    
    -- Rebounds
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'rebound'
       AND gs.is_opponent_stat = false
    ) as total_rebounds,
    
    -- Assists
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'assist'
       AND gs.is_opponent_stat = false
    ) as total_assists,
    
    -- Turnovers
    (SELECT COUNT(*)::BIGINT 
     FROM game_stats gs
     JOIN games g ON g.id = gs.game_id
     WHERE g.team_a_id = p_team_id
       AND g.status IN ('completed', 'in_progress')
       AND gs.team_id = p_team_id
       AND gs.stat_type = 'turnover'
       AND gs.is_opponent_stat = false
    ) as total_turnovers,
    
    -- Opponent points
    (SELECT COALESCE(SUM(g.away_score), 0)::BIGINT 
     FROM games g 
     WHERE g.team_a_id = p_team_id 
       AND g.status IN ('completed', 'in_progress')
    ) as total_opponent_points;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_team_analytics(UUID) TO authenticated;

-- Example usage:
-- SELECT * FROM get_team_analytics('f5bf451e-6743-4e37-82a9-5c1987ab6d66');
