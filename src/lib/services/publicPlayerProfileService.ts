/**
 * PublicPlayerProfileService
 * 
 * PURPOSE: Business logic for public player profile data transformation
 * - Aggregates game stats into tournament stats
 * - Calculates career highs from game history
 * - Counts player awards by type
 * 
 * Follows .cursorrules: Business logic in services, <200 lines
 */

import type { GameStatsSummary } from '@/lib/services/playerGameStatsService';

// === TYPE DEFINITIONS ===

export interface PublicPlayerIdentity {
  playerId: string;
  name: string;
  jerseyNumber?: number | string;
  position?: string;
  teamName?: string;
  teamLogo?: string;
  age?: number;
  height?: string;
  weight?: string;
  location?: string;
  profilePhotoUrl?: string;
  posePhotoUrl?: string;
  bio?: string;
  school?: string;
  graduationYear?: string;
  isRecruitable?: boolean;
  recruitmentNote?: string;
  contactEmail?: string;
  isPublicProfile?: boolean;
}

export interface TournamentStat {
  tournamentId: string;
  tournamentName: string;
  tournamentLogo?: string;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  topg: number;
  mpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
}

export interface PlayerAward {
  type: 'potg' | 'hustle' | 'champion';
  count: number;
}

export interface CareerHighs {
  points: number;
  rebounds: number;
  assists: number;
  blocks: number;
  steals: number;
  threes: number;
  ftm: number;
}

export interface PublicPlayerProfile {
  identity: PublicPlayerIdentity;
  careerStats: {
    ppg: number;
    rpg: number;
    apg: number;
    fgPct: number;
    threePct: number;
    ftPct: number;
    mpg: number;
  };
  gamesPlayed: number;
  tournamentStats: TournamentStat[];
  allGames: GameStatsSummary[];
  careerHighs: CareerHighs;
  awards: PlayerAward[];
}

// === SERVICE FUNCTIONS ===

/**
 * Groups game stats by tournament and calculates averages
 */
export function buildTournamentStats(games: GameStatsSummary[]): TournamentStat[] {
  const tournamentMap = new Map<string, { name: string; games: GameStatsSummary[] }>();
  
  for (const game of games) {
    if (game.gameStatus !== 'completed') continue;
    const key = game.tournamentName || 'Unknown Tournament';
    if (!tournamentMap.has(key)) {
      tournamentMap.set(key, { name: key, games: [] });
    }
    tournamentMap.get(key)!.games.push(game);
  }

  return Array.from(tournamentMap.entries()).map(([_, tournamentData]) => {
    const count = tournamentData.games.length;
    const totals = aggregateGameTotals(tournamentData.games);
    return calculateTournamentAverages(tournamentData.name, count, totals);
  });
}

/** Aggregate raw totals from games */
function aggregateGameTotals(games: GameStatsSummary[]) {
  return games.reduce((acc, g) => ({
    pts: acc.pts + g.points,
    reb: acc.reb + g.rebounds,
    ast: acc.ast + g.assists,
    stl: acc.stl + g.steals,
    blk: acc.blk + g.blocks,
    tov: acc.tov + g.turnovers,
    min: acc.min + g.minutesPlayed,
    fgm: acc.fgm + g.fieldGoalsMade,
    fga: acc.fga + g.fieldGoalsAttempted,
    tpm: acc.tpm + g.threePointersMade,
    tpa: acc.tpa + g.threePointersAttempted,
    ftm: acc.ftm + g.freeThrowsMade,
    fta: acc.fta + g.freeThrowsAttempted,
  }), { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, min: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 });
}

/** Calculate per-game averages from totals */
function calculateTournamentAverages(
  name: string, 
  count: number, 
  totals: ReturnType<typeof aggregateGameTotals>
): TournamentStat {
  return {
    tournamentId: '',
    tournamentName: name,
    gamesPlayed: count,
    ppg: count > 0 ? totals.pts / count : 0,
    rpg: count > 0 ? totals.reb / count : 0,
    apg: count > 0 ? totals.ast / count : 0,
    spg: count > 0 ? totals.stl / count : 0,
    bpg: count > 0 ? totals.blk / count : 0,
    topg: count > 0 ? totals.tov / count : 0,
    mpg: count > 0 ? totals.min / count : 0,
    fgPct: totals.fga > 0 ? (totals.fgm / totals.fga) * 100 : 0,
    threePct: totals.tpa > 0 ? (totals.tpm / totals.tpa) * 100 : 0,
    ftPct: totals.fta > 0 ? (totals.ftm / totals.fta) * 100 : 0,
    fgm: totals.fgm,
    fga: totals.fga,
    tpm: totals.tpm,
    tpa: totals.tpa,
    ftm: totals.ftm,
    fta: totals.fta,
  };
}

/**
 * Builds career highs from game stats
 */
export function buildCareerHighs(games: GameStatsSummary[]): CareerHighs {
  const completedGames = games.filter(g => g.gameStatus === 'completed');
  return {
    points: Math.max(0, ...completedGames.map(g => g.points)),
    rebounds: Math.max(0, ...completedGames.map(g => g.rebounds)),
    assists: Math.max(0, ...completedGames.map(g => g.assists)),
    blocks: Math.max(0, ...completedGames.map(g => g.blocks)),
    steals: Math.max(0, ...completedGames.map(g => g.steals)),
    threes: Math.max(0, ...completedGames.map(g => g.threePointersMade)),
    ftm: Math.max(0, ...completedGames.map(g => g.freeThrowsMade)),
  };
}

/**
 * Counts awards by type
 */
export function countAwards(awardsData: { awardType: string }[]): PlayerAward[] {
  const counts = { potg: 0, hustle: 0 };
  for (const award of awardsData) {
    if (award.awardType === 'player_of_the_game') counts.potg++;
    else if (award.awardType === 'hustle_player') counts.hustle++;
  }
  
  const result: PlayerAward[] = [];
  if (counts.potg > 0) result.push({ type: 'potg', count: counts.potg });
  if (counts.hustle > 0) result.push({ type: 'hustle', count: counts.hustle });
  return result;
}

