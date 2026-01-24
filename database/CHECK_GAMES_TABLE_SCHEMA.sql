-- ============================================================================
-- CHECK GAMES TABLE SCHEMA
-- Purpose: Verify actual column names in games table
-- ============================================================================

-- Check all columns in games table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'games'
AND column_name LIKE '%score%'
ORDER BY column_name;

-- Also check for any score-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'games'
AND (
    column_name LIKE '%score%' 
    OR column_name LIKE '%point%'
    OR column_name LIKE '%home%'
    OR column_name LIKE '%away%'
    OR column_name LIKE '%team_a%'
    OR column_name LIKE '%team_b%'
)
ORDER BY column_name;
