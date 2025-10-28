-- Check what constraints exist on the stats table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'stats'::regclass
ORDER BY conname;

