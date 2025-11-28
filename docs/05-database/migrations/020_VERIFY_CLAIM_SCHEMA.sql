-- ============================================================================
-- VERIFY CLAIM SCHEMA - Check actual column names
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify schema
-- ============================================================================

-- 1. Check 'users' table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check 'game_awards_history' table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_awards_history' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check 'custom_players' table columns (for reference)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_players' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check 'game_stats' table columns (this one worked, for comparison)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'game_stats' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

