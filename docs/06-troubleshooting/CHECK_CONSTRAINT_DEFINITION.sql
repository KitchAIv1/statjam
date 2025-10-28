-- Check the exact definition of team_players_player_required
SELECT 
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'team_players_player_required';

-- Also check what those numbered constraints are
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'team_players'::regclass
AND contype = 'c'  -- CHECK constraints only
ORDER BY conname;

