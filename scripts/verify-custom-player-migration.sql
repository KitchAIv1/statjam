-- Verify that the migration was applied correctly
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'game_stats' 
  AND column_name IN ('player_id', 'custom_player_id')
ORDER BY column_name;

-- Check constraints
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'game_stats' 
  AND tc.constraint_type = 'CHECK';
