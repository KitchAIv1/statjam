SELECT COUNT(*) as total_team_players, 
COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as with_player_id,
COUNT(CASE WHEN custom_player_id IS NOT NULL THEN 1 END) as with_custom_player_id,
COUNT(CASE WHEN player_id IS NULL AND custom_player_id IS NULL THEN 1 END) as invalid_records
FROM team_players;
