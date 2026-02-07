/**
 * GameViewerStatsService
 * Pure computation functions for game viewer stats.
 * NO database calls - operates on pre-fetched data only.
 */

import { GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';
import { computePlayerMinutes, computePlayerPlusMinus } from './GameViewerTimeStatsService';

export interface PlayerBoxScore {
  playerId: string;
  playerName: string;
  profilePhotoUrl?: string;
  jerseyNumber?: number;
  isCustomPlayer: boolean;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  rebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  minutes: number;
  plusMinus: number;
}

export interface TeamBoxScore {
  teamId: string;
  teamName: string;
  logoUrl?: string;
  totalPoints: number;
  players: PlayerBoxScore[];
}

type GameStat = GameViewerV3APIResponse['stats'][0];
type UserRecord = GameViewerV3APIResponse['users'][0];
type CustomPlayerRecord = GameViewerV3APIResponse['customPlayers'][0];

/** Compute box score for a single player from stats array */
export function computePlayerBoxScore(
  stats: GameStat[],
  playerId: string,
  isCustomPlayer: boolean,
  playerInfo: { name: string; profilePhotoUrl?: string; jerseyNumber?: number },
  minutes: number = 0,
  plusMinus: number = 0
): PlayerBoxScore {
  // ✅ FIX: Exclude opponent stats (is_opponent_stat = true) for correct player totals
  const playerStats = stats.filter((s) =>
    (isCustomPlayer ? s.custom_player_id === playerId : s.player_id === playerId) &&
    s.is_opponent_stat !== true
  );

  const boxScore: PlayerBoxScore = {
    playerId,
    playerName: playerInfo.name,
    profilePhotoUrl: playerInfo.profilePhotoUrl,
    jerseyNumber: playerInfo.jerseyNumber,
    isCustomPlayer,
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    rebounds: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    fouls: 0,
    minutes,
    plusMinus,
  };

  for (const stat of playerStats) {
    const isMade = stat.modifier === 'made';
    
    switch (stat.stat_type) {
      case 'field_goal':
        // ✅ NBA-style: FG includes all field goals (2PT + 3PT)
        boxScore.fieldGoalsAttempted++;
        if (isMade) { boxScore.fieldGoalsMade++; boxScore.points += 2; }
        break;
      case 'three_pointer':
        // ✅ NBA-style: 3PT also counts toward total FG
        boxScore.fieldGoalsAttempted++;
        boxScore.threePointersAttempted++;
        if (isMade) { 
          boxScore.fieldGoalsMade++; 
          boxScore.threePointersMade++; 
          boxScore.points += 3; 
        }
        break;
      case 'free_throw':
        boxScore.freeThrowsAttempted++;
        if (isMade) { boxScore.freeThrowsMade++; boxScore.points += 1; }
        break;
      case 'rebound':
        boxScore.rebounds++;
        if (stat.modifier === 'offensive') boxScore.offensiveRebounds++;
        else boxScore.defensiveRebounds++;
        break;
      case 'assist': boxScore.assists++; break;
      case 'steal': boxScore.steals++; break;
      case 'block': boxScore.blocks++; break;
      case 'turnover': boxScore.turnovers++; break;
      case 'foul': boxScore.fouls++; break;
    }
  }

  return boxScore;
}

/** Compute full team box score including all players */
export function computeTeamBoxScore(
  gameData: GameViewerV3APIResponse,
  teamId: string
): TeamBoxScore {
  const team = gameData.teams.find((t) => t.id === teamId);
  const teamPlayers = gameData.teamPlayers.filter((tp) => tp.team_id === teamId);
  const teamStats = gameData.stats.filter((s) => s.team_id === teamId);

  const usersMap = new Map(gameData.users.map((u) => [u.id, u]));
  const customPlayersMap = new Map(gameData.customPlayers.map((cp) => [cp.id, cp]));

  // Collect all unique player IDs first (for minutes/plusMinus calculation)
  const allPlayerIds: string[] = [];
  const processedPlayerIds = new Set<string>();

  // From roster
  for (const tp of teamPlayers) {
    const playerId = tp.custom_player_id || tp.player_id;
    if (playerId && !processedPlayerIds.has(playerId)) {
      processedPlayerIds.add(playerId);
      allPlayerIds.push(playerId);
    }
  }

  // From stats (players not in roster)
  for (const stat of teamStats) {
    const playerId = stat.custom_player_id || stat.player_id;
    if (playerId && !processedPlayerIds.has(playerId)) {
      processedPlayerIds.add(playerId);
      allPlayerIds.push(playerId);
    }
  }

  // Compute minutes and plus/minus for all players at once
  const minutesMap = computePlayerMinutes(gameData, teamId, allPlayerIds);
  const plusMinusMap = computePlayerPlusMinus(gameData, teamId, allPlayerIds);

  // Reset for box score generation
  processedPlayerIds.clear();
  const playerBoxScores: PlayerBoxScore[] = [];

  // First, process players from team roster
  for (const tp of teamPlayers) {
    const isCustom = !!tp.custom_player_id;
    const playerId = tp.custom_player_id || tp.player_id;
    if (!playerId) continue;
    processedPlayerIds.add(playerId);

    const playerRecord = isCustom ? customPlayersMap.get(playerId) : usersMap.get(playerId);
    const playerInfo = {
      name: playerRecord?.name || 'Unknown',
      profilePhotoUrl: playerRecord?.profile_photo_url,
      jerseyNumber: isCustom ? (playerRecord as CustomPlayerRecord)?.jersey_number : tp.jersey_number,
    };

    const boxScore = computePlayerBoxScore(
      teamStats, playerId, isCustom, playerInfo,
      minutesMap.get(playerId) || 0,
      plusMinusMap.get(playerId) || 0
    );
    playerBoxScores.push(boxScore);
  }

  // Second, add players from stats who aren't in roster (substitutes, etc.)
  for (const stat of teamStats) {
    const isCustom = !!stat.custom_player_id;
    const playerId = stat.custom_player_id || stat.player_id;
    if (!playerId || processedPlayerIds.has(playerId)) continue;
    processedPlayerIds.add(playerId);

    const playerRecord = isCustom ? customPlayersMap.get(playerId) : usersMap.get(playerId);
    const playerInfo = {
      name: playerRecord?.name || 'Unknown',
      profilePhotoUrl: playerRecord?.profile_photo_url,
      jerseyNumber: isCustom ? (playerRecord as CustomPlayerRecord)?.jersey_number : undefined,
    };

    const boxScore = computePlayerBoxScore(
      teamStats, playerId, isCustom, playerInfo,
      minutesMap.get(playerId) || 0,
      plusMinusMap.get(playerId) || 0
    );
    playerBoxScores.push(boxScore);
  }

  // Sort by points descending
  playerBoxScores.sort((a, b) => b.points - a.points);

  const totalPoints = playerBoxScores.reduce((sum, p) => sum + p.points, 0);

  return {
    teamId,
    teamName: team?.name || 'Unknown Team',
    logoUrl: team?.logo_url,
    totalPoints,
    players: playerBoxScores,
  };
}

/** Get player name by ID from game data */
export function getPlayerName(
  gameData: GameViewerV3APIResponse,
  playerId: string | undefined,
  customPlayerId: string | undefined
): string {
  if (customPlayerId) {
    const cp = gameData.customPlayers.find((p) => p.id === customPlayerId);
    return cp?.name || 'Unknown';
  }
  if (playerId) {
    const user = gameData.users.find((u) => u.id === playerId);
    return user?.name || 'Unknown';
  }
  return 'Unknown';
}

/** Get player photo URL by ID from game data */
export function getPlayerPhoto(
  gameData: GameViewerV3APIResponse,
  playerId: string | undefined,
  customPlayerId: string | undefined
): string | undefined {
  if (customPlayerId) {
    const cp = gameData.customPlayers.find((p) => p.id === customPlayerId);
    return cp?.profile_photo_url ?? undefined;
  }
  if (playerId) {
    const user = gameData.users.find((u) => u.id === playerId);
    return user?.profile_photo_url ?? undefined;
  }
  return undefined;
}

// Re-export time-based stats functions from separate module
// Re-export time-based stats functions from separate module
export { computePlayerMinutes, computePlayerPlusMinus } from './GameViewerTimeStatsService';
