-- Check current game_stats table structure and constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'game_stats' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on game_stats
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'game_stats' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- Check if custom_players table exists and has records
SELECT 
  COUNT(*) as custom_player_count,
  'custom_players table exists' as status
FROM custom_players
UNION ALL
SELECT 
  COUNT(*) as regular_player_count,
  'regular players in users table' as status  
FROM users WHERE role = 'player';
