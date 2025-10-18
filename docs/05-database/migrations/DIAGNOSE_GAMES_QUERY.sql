-- ============================================================================
-- DIAGNOSTIC: Check why games query is hanging for stat_admin
-- ============================================================================

-- Check 1: Does the index exist?
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'games'
AND indexname LIKE '%stat_admin%';

-- Check 2: What policies are on games table?
SELECT 
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'games'
ORDER BY policyname;

-- Check 3: Try the actual query as the stat_admin user
-- Replace 'YOUR_STAT_ADMIN_ID' with: 18358f53-c5af-429b-835d-026f904904a6
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "18358f53-c5af-429b-835d-026f904904a6", "role": "authenticated"}';

EXPLAIN ANALYZE
SELECT id, tournament_id, team_a_id, team_b_id, start_time, status, created_at
FROM public.games
WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6';

RESET ROLE;

-- Check 4: How many games exist for this stat_admin? (as superuser)
SELECT COUNT(*) as game_count
FROM public.games
WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6';

-- Check 5: Sample of games for this stat_admin
SELECT 
    id,
    tournament_id,
    team_a_id,
    team_b_id,
    status,
    stat_admin_id
FROM public.games
WHERE stat_admin_id = '18358f53-c5af-429b-835d-026f904904a6'
LIMIT 5;

