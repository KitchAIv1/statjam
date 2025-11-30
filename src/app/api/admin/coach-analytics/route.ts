/**
 * Admin Coach Analytics API Route
 * Uses service role to bypass RLS for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Verify admin token exists (basic auth check)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch ALL coach games (bypasses RLS with service role)
    const { data: games, error: gamesError } = await supabaseAdmin
      .from('games')
      .select('id, status, updated_at, team_a_id, opponent_name, home_score, away_score, created_at')
      .eq('is_coach_game', true)
      .order('updated_at', { ascending: false });

    if (gamesError) {
      console.error('❌ Failed to fetch coach games:', gamesError);
      return NextResponse.json({ error: gamesError.message }, { status: 500 });
    }

    // Get unique team IDs
    const teamIds = [...new Set(games?.map(g => g.team_a_id) || [])];

    // Fetch team names with coach_id (ordered by latest first)
    const { data: teams } = await supabaseAdmin
      .from('teams')
      .select('id, name, created_at, coach_id')
      .in('id', teamIds.length > 0 ? teamIds : ['none'])
      .order('created_at', { ascending: false });

    // Get unique coach IDs and fetch their emails
    const coachIds = [...new Set(teams?.map(t => t.coach_id).filter(Boolean) || [])];
    const { data: coaches } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('id', coachIds.length > 0 ? coachIds : ['none']);

    const coachMap = new Map(coaches?.map(c => [c.id, c.email]) || []);
    const teamMap = new Map(teams?.map(t => [t.id, { ...t, coachEmail: coachMap.get(t.coach_id) }]) || []);

    // Calculate metrics
    const completedGames = games?.filter(g => g.status === 'completed').length || 0;
    const inProgressGames = games?.filter(g => g.status === 'in_progress').length || 0;
    const lastActive = games && games.length > 0 ? games[0].updated_at : null;

    // Fetch stats count
    const gameIds = games?.map(g => g.id) || [];
    let totalStats = 0;
    if (gameIds.length > 0) {
      const { count } = await supabaseAdmin
        .from('game_stats')
        .select('id', { count: 'exact', head: true })
        .in('game_id', gameIds);
      totalStats = count || 0;
    }

    // Format response
    const metrics = {
      totalTeams: teamIds.length,
      totalGames: games?.length || 0,
      completedGames,
      inProgressGames,
      totalStatsRecorded: totalStats,
      lastActiveDate: lastActive
    };

    const recentGames = (games || []).slice(0, 10).map(g => ({
      id: g.id,
      teamName: teamMap.get(g.team_a_id)?.name || 'Unknown Team',
      opponentName: g.opponent_name || 'Opponent',
      status: g.status,
      homeScore: g.home_score || 0,
      awayScore: g.away_score || 0,
      createdAt: g.created_at,
      updatedAt: g.updated_at
    }));

    const coachTeamsUnsorted = await Promise.all(
      (teams || []).slice(0, 10).map(async (team) => {
        const { count: playerCount } = await supabaseAdmin
          .from('team_players')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', team.id);

        const teamGames = games?.filter(g => g.team_a_id === team.id).length || 0;

        return {
          id: team.id,
          name: team.name,
          coachEmail: coachMap.get(team.coach_id) || null,
          playerCount: playerCount || 0,
          gamesPlayed: teamGames,
          createdAt: team.created_at
        };
      })
    );

    // Sort teams by created_at descending (latest first)
    const coachTeams = coachTeamsUnsorted.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      metrics,
      recentGames,
      teams: coachTeams
    });

  } catch (error: any) {
    console.error('❌ Admin coach analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

