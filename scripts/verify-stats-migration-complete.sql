-- Verify that the stats table migration is complete

-- Check 1: Verify custom_player_id column exists
SELECT 
  'custom_player_id column' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'stats' AND column_name = 'custom_player_id'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check 2: Verify player_id is nullable
SELECT 
  'player_id nullable' as check_name,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULLABLE'
    ELSE '❌ NOT NULL'
  END as status
FROM information_schema.columns
WHERE table_name = 'stats' AND column_name = 'player_id';

-- Check 3: Verify constraint exists
SELECT 
  'stats_player_required constraint' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'stats_player_required'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check 4: Verify index exists
SELECT 
  'idx_stats_custom_player_id index' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_stats_custom_player_id'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Check 5: Verify RLS policies exist
SELECT 
  'RLS policies for custom players' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ ' || COUNT(*) || ' POLICIES'
    ELSE '⚠️ ONLY ' || COUNT(*) || ' POLICIES'
  END as status
FROM pg_policies
WHERE tablename = 'stats' 
  AND policyname LIKE '%custom_player%';

-- Check 6: Show all columns in stats table
SELECT 
  '=== STATS TABLE SCHEMA ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stats'
ORDER BY ordinal_position;

