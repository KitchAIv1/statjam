/**
 * PublicGameStatsService
 * 
 * PURPOSE: Compute team/player stats from raw game_stats for public viewers
 * Used by game-viewer API route to bypass RLS for coach games
 * 
 * Single responsibility: Stats aggregation for public game viewing
 * 
 * @module PublicGameStatsService
 */

export interface ComputedTeamStats {
  teamStats: {
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    turnovers: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    teamFouls: number;
    fieldGoalPercentage: number;
    threePointPercentage: number;
    freeThrowPercentage: number;
  };
  players: {
    playerId: string;
    playerName: string;
    isCustomPlayer: boolean;
    profilePhotoUrl: string | null;
    jerseyNumber: string | null;
    minutes: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    plusMinus: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
  }[];
}

/**
 * Compute team stats from raw game_stats (for coach games public view)
 */
export function computeTeamStats(
  stats: any[], 
  teamId: string, 
  isCoachGame: boolean,
  usersMap: Map<string, any>,
  customPlayersMap: Map<string, any>
): ComputedTeamStats {
  // Filter stats for this team (coach games use is_opponent_stat flag)
  const teamStats = stats.filter(s => {
    if (isCoachGame) {
      return !s.is_opponent_stat;
    }
    return s.team_id === teamId;
  });

  // Aggregate team totals
  let fieldGoalsMade = 0, fieldGoalsAttempted = 0;
  let threePointersMade = 0, threePointersAttempted = 0;
  let freeThrowsMade = 0, freeThrowsAttempted = 0;
  let turnovers = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0, teamFouls = 0;

  // Player stats aggregation
  const playerStatsMap = new Map<string, any>();

  for (const stat of teamStats) {
    const playerId = stat.player_id || stat.custom_player_id;
    if (!playerId) continue;

    // Initialize player if not exists
    if (!playerStatsMap.has(playerId)) {
      const userInfo = usersMap.get(playerId);
      const customInfo = customPlayersMap.get(playerId);
      const isCustom = !!stat.custom_player_id || !!customInfo;
      
      playerStatsMap.set(playerId, {
        playerId,
        playerName: userInfo?.name || customInfo?.name || `Player ${playerId.substring(0, 8)}`,
        isCustomPlayer: isCustom,
        profilePhotoUrl: userInfo?.profile_photo_url || userInfo?.avatar_url || customInfo?.profile_photo_url || null,
        jerseyNumber: customInfo?.jersey_number || null,
        minutes: 0,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
        plusMinus: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0
      });
    }

    const playerStats = playerStatsMap.get(playerId)!;
    const statType = stat.stat_type;
    const modifier = stat.modifier;

    // Aggregate based on stat type
    if (statType === 'field_goal' || statType === 'two_pointer') {
      if (modifier === 'made') {
        fieldGoalsMade++;
        playerStats.fieldGoalsMade++;
        playerStats.points += 2;
      }
      fieldGoalsAttempted++;
      playerStats.fieldGoalsAttempted++;
    } else if (statType === 'three_pointer' || statType === '3_pointer') {
      if (modifier === 'made') {
        fieldGoalsMade++;
        threePointersMade++;
        playerStats.fieldGoalsMade++;
        playerStats.threePointersMade++;
        playerStats.points += 3;
      }
      fieldGoalsAttempted++;
      threePointersAttempted++;
      playerStats.fieldGoalsAttempted++;
      playerStats.threePointersAttempted++;
    } else if (statType === 'free_throw') {
      if (modifier === 'made') {
        freeThrowsMade++;
        playerStats.freeThrowsMade++;
        playerStats.points += 1;
      }
      freeThrowsAttempted++;
      playerStats.freeThrowsAttempted++;
    } else if (statType === 'rebound') {
      rebounds++;
      playerStats.rebounds++;
    } else if (statType === 'assist') {
      assists++;
      playerStats.assists++;
    } else if (statType === 'steal') {
      steals++;
      playerStats.steals++;
    } else if (statType === 'block') {
      blocks++;
      playerStats.blocks++;
    } else if (statType === 'turnover') {
      turnovers++;
      playerStats.turnovers++;
    } else if (statType === 'foul') {
      teamFouls++;
      playerStats.fouls++;
    }
  }

  // Calculate percentages
  const fieldGoalPercentage = fieldGoalsAttempted > 0 ? Math.round((fieldGoalsMade / fieldGoalsAttempted) * 100) : 0;
  const threePointPercentage = threePointersAttempted > 0 ? Math.round((threePointersMade / threePointersAttempted) * 100) : 0;
  const freeThrowPercentage = freeThrowsAttempted > 0 ? Math.round((freeThrowsMade / freeThrowsAttempted) * 100) : 0;

  // Sort players by points (descending)
  const players = Array.from(playerStatsMap.values()).sort((a, b) => b.points - a.points);

  return {
    teamStats: {
      fieldGoalsMade,
      fieldGoalsAttempted,
      threePointersMade,
      threePointersAttempted,
      freeThrowsMade,
      freeThrowsAttempted,
      turnovers,
      rebounds,
      assists,
      steals,
      blocks,
      teamFouls,
      fieldGoalPercentage,
      threePointPercentage,
      freeThrowPercentage
    },
    players
  };
}

/**
 * Compute opponent stats for coach games (is_opponent_stat = true)
 * Team-level stats only, no individual players
 */
export function computeOpponentStats(stats: any[]): ComputedTeamStats {
  const opponentStats = stats.filter(s => s.is_opponent_stat === true);

  let fieldGoalsMade = 0, fieldGoalsAttempted = 0;
  let threePointersMade = 0, threePointersAttempted = 0;
  let freeThrowsMade = 0, freeThrowsAttempted = 0;
  let turnovers = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0, teamFouls = 0;

  for (const stat of opponentStats) {
    const statType = stat.stat_type;
    const modifier = stat.modifier;

    if (statType === 'field_goal' || statType === 'two_pointer') {
      if (modifier === 'made') fieldGoalsMade++;
      fieldGoalsAttempted++;
    } else if (statType === 'three_pointer' || statType === '3_pointer') {
      if (modifier === 'made') {
        fieldGoalsMade++;
        threePointersMade++;
      }
      fieldGoalsAttempted++;
      threePointersAttempted++;
    } else if (statType === 'free_throw') {
      if (modifier === 'made') freeThrowsMade++;
      freeThrowsAttempted++;
    } else if (statType === 'rebound') {
      rebounds++;
    } else if (statType === 'assist') {
      assists++;
    } else if (statType === 'steal') {
      steals++;
    } else if (statType === 'block') {
      blocks++;
    } else if (statType === 'turnover') {
      turnovers++;
    } else if (statType === 'foul') {
      teamFouls++;
    }
  }

  const fieldGoalPercentage = fieldGoalsAttempted > 0 ? Math.round((fieldGoalsMade / fieldGoalsAttempted) * 100) : 0;
  const threePointPercentage = threePointersAttempted > 0 ? Math.round((threePointersMade / threePointersAttempted) * 100) : 0;
  const freeThrowPercentage = freeThrowsAttempted > 0 ? Math.round((freeThrowsMade / freeThrowsAttempted) * 100) : 0;

  return {
    teamStats: {
      fieldGoalsMade,
      fieldGoalsAttempted,
      threePointersMade,
      threePointersAttempted,
      freeThrowsMade,
      freeThrowsAttempted,
      turnovers,
      rebounds,
      assists,
      steals,
      blocks,
      teamFouls,
      fieldGoalPercentage,
      threePointPercentage,
      freeThrowPercentage
    },
    players: [] // No individual player stats for opponent in coach mode
  };
}

