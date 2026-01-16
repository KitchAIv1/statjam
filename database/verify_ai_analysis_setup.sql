-- ============================================================================
-- VERIFICATION SCRIPT: AI Analysis Setup
-- ============================================================================
-- Purpose: Verify that ai_analysis table and RPC function are properly deployed
-- ============================================================================

-- 1. Check if ai_analysis table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_analysis')
    THEN '✅ ai_analysis table EXISTS'
    ELSE '❌ ai_analysis table MISSING'
  END AS table_status;

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_analysis'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'ai_analysis'
ORDER BY policyname;

-- 4. Check if RPC function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
      AND p.proname = 'get_ai_analysis_data'
    )
    THEN '✅ get_ai_analysis_data function EXISTS'
    ELSE '❌ get_ai_analysis_data function MISSING'
  END AS function_status;

-- 5. Check RPC function signature
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_ai_analysis_data';

-- 6. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ai_analysis';
