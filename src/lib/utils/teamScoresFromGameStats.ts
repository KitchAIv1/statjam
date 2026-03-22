/**
 * Team score aggregation from game_stats rows (single game).
 * Matches public tournament Overview / useTournamentMatchups.calculateScoresFromBatchedStats
 * so player profile RESULT stays consistent with "Recent Matchups".
 */

export interface GameStatRowForTeamScore {
  team_id: string | null;
  stat_value: number | null;
  modifier: string | null;
  is_opponent_stat?: boolean | null;
}

/**
 * Sum team A / team B points from stat rows for one game.
 * - modifier === 'made' counts stat_value toward scoring
 * - is_opponent_stat → credits team B (coach / opponent tracking)
 * - else team_id matched to team_a_id / team_b_id
 */
export function teamScoresFromGameStatRows(
  rows: GameStatRowForTeamScore[],
  teamAId: string,
  teamBId: string
): { teamAScore: number; teamBScore: number } {
  let teamAScore = 0;
  let teamBScore = 0;

  for (const stat of rows) {
    if (stat.modifier !== 'made') continue;
    const points = Number(stat.stat_value) || 0;

    if (stat.is_opponent_stat) {
      teamBScore += points;
    } else if (stat.team_id === teamAId) {
      teamAScore += points;
    } else if (stat.team_id === teamBId) {
      teamBScore += points;
    }
  }

  return { teamAScore, teamBScore };
}

/**
 * Games per `game_id IN (...)` batch. Smaller = fewer rows per request before pagination.
 */
export const GAME_STATS_IN_CHUNK_GAME_COUNT = 6;

/** PostgREST / Supabase default max rows per response — paginate past this. */
export const POSTGREST_MAX_ROWS_PER_REQUEST = 1000;
