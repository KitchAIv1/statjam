/**
 * teamMatchupsService - Fetch games for one team (for public team page carousel)
 * Keeps useTeamMatchups hook under 100 lines.
 */

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import type { TournamentMatchup } from '@/hooks/useTournamentMatchups';

function calcScores(
  stats: any[],
  gameId: string,
  teamAId: string,
  teamBId: string
): { teamAScore: number; teamBScore: number } {
  const gameStats = (stats || []).filter((s: any) => s.game_id === gameId);
  let a = 0,
    b = 0;
  gameStats.forEach((s: any) => {
    if (s.modifier !== 'made') return;
    const pts = Number(s.stat_value) || 0;
    if (s.is_opponent_stat) b += pts;
    else if (s.team_id === teamAId) a += pts;
    else if (s.team_id === teamBId) b += pts;
  });
  return { teamAScore: a, teamBScore: b };
}

const GAME_COLS =
  'id,team_a_id,team_b_id,status,start_time,home_score,away_score,game_phase';

export async function fetchTeamMatchups(
  teamId: string,
  tournamentId: string,
  opts: { status?: 'completed' | 'scheduled' | 'all'; limit?: number } = {}
): Promise<TournamentMatchup[]> {
  const { status = 'all', limit = 20 } = opts;
  const statusFilter =
    status === 'completed'
      ? { status: 'eq.completed' }
      : status === 'scheduled'
        ? { status: 'eq.scheduled' }
        : {};
  const base = {
    tournament_id: `eq.${tournamentId}`,
    order: 'start_time.asc',
    limit: limit.toString(),
    ...statusFilter,
  };

  const [gamesA, gamesB] = await Promise.all([
    hybridSupabaseService.query<any>('games', GAME_COLS, {
      ...base,
      team_a_id: `eq.${teamId}`,
    }),
    hybridSupabaseService.query<any>('games', GAME_COLS, {
      ...base,
      team_b_id: `eq.${teamId}`,
    }),
  ]);

  const seen = new Set<string>();
  const raw: any[] = [];
  for (const g of [...(gamesA || []), ...(gamesB || [])]) {
    if (g?.id && !seen.has(g.id)) {
      seen.add(g.id);
      raw.push(g);
    }
  }
  raw.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  if (raw.length === 0) return [];

  const teamIds = [...new Set(raw.flatMap((g: any) => [g.team_a_id, g.team_b_id].filter(Boolean)))];
  const teams =
    teamIds.length > 0
      ? await hybridSupabaseService.query<any>('teams', 'id,name,logo_url', {
          id: `in.(${teamIds.join(',')})`,
        })
      : [];
  const teamsMap = new Map(
    (teams || []).map((t: any) => [
      t.id,
      { id: t.id, name: t.name, logo: t.logo_url || undefined },
    ])
  );

  return Promise.all(
    raw.map(async (game: any) => {
      const teamA = teamsMap.get(game.team_a_id) || { id: game.team_a_id, name: 'Team A' };
      const teamB = teamsMap.get(game.team_b_id) || { id: game.team_b_id, name: 'Team B' };
      let teamAScore = 0,
        teamBScore = 0;

      if (game.status === 'completed' || game.status === 'in_progress') {
        try {
          const stats = await hybridSupabaseService.query<any>(
            'game_stats',
            'game_id,team_id,stat_value,modifier,is_opponent_stat',
            { game_id: `eq.${game.id}` }
          );
          const calc = calcScores(stats || [], game.id, game.team_a_id, game.team_b_id);
          teamAScore = calc.teamAScore ?? game.home_score ?? 0;
          teamBScore = calc.teamBScore ?? game.away_score ?? 0;
        } catch {
          teamAScore = game.home_score ?? 0;
          teamBScore = game.away_score ?? 0;
        }
      }

      return {
        gameId: game.id,
        teamA: { ...teamA, score: teamAScore },
        teamB: { ...teamB, score: teamBScore },
        status: game.status,
        gameDate: game.start_time || game.created_at,
        gamePhase: game.game_phase,
      };
    })
  );
}
