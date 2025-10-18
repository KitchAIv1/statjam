-- ============================================================================
-- DIAGNOSE: Actual stats table schema
-- 
-- PURPOSE: Verify the actual column names in the stats table before creating RLS policies
-- ============================================================================

-- Step 1: Check if stats table exists
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
WHERE tablename = 'stats';

-- Step 2: Get actual column structure of stats table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stats' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='stats';

-- Step 4: Check current RLS policies on stats table
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'stats'
ORDER BY policyname;

-- Step 5: Sample data to understand structure (if any exists)
SELECT 
    column_name,
    COUNT(*) as non_null_count
FROM information_schema.columns c
LEFT JOIN (
    SELECT * FROM public.stats LIMIT 1
) s ON true
WHERE c.table_name = 'stats' 
AND c.table_schema = 'public'
GROUP BY column_name
ORDER BY column_name;

SELECT '=== STATS TABLE DIAGNOSIS COMPLETE ===' as status;
