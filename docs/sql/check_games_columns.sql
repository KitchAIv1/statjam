-- Check actual column names in games table
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'games'
ORDER BY ordinal_position;

