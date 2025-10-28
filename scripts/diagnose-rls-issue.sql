-- Quick diagnostic to find the exact RLS issue

-- 1. Check if custom_players table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'custom_players'
) as "custom_players_exists";

-- 2. Check RLS status on all relevant tables
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('team_players', 'custom_players', 'users')
  AND schemaname = 'public';

-- 3. Check ALL policies on custom_players
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'custom_players'
  AND schemaname = 'public';

-- 4. Check users table policies (coaches need to search players)
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'users'
  AND schemaname = 'public'
ORDER BY policyname;
