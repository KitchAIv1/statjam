-- ============================================================================
-- 🔐 ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
-- Purpose: Enable RLS on all tables so policies are actually enforced
-- This is REQUIRED for RLS policies to work!
-- ============================================================================

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_substitutions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supporting tables (if they exist)
ALTER TABLE IF EXISTS public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.template_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.card_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stat_audit_log ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'tournaments', 'teams', 'games', 'team_players', 
    'game_stats', 'game_substitutions'
)
ORDER BY tablename;

-- Success message
SELECT '✅ RLS ENABLED ON ALL TABLES!' as status;

