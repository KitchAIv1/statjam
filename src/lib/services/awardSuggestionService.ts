/**
 * AwardSuggestionService - Auto-suggest Awards Based on Stats
 * 
 * PURPOSE: Calculate and suggest Player of the Game and Hustle Player
 * based on game statistics
 * 
 * ✅ OPTIMIZED: Supports both async (fetches data) and sync (pre-fetched data) modes
 * Follows .cursorrules: <200 lines service
 */

import { TeamStatsService, PlayerStats } from './teamStatsService';

export interface AwardSuggestion {
  playerId: string;
  playerName: string;
  score: number;
  reasoning: string;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
  };
}

export class AwardSuggestionService {
  /**
   * Suggest Player of the Game based on impact score
   * Impact = (points * 2) + rebounds + assists + (steals * 1.5) + (blocks * 1.5) - (turnovers * 0.5)
   */
  static async suggestPlayerOfTheGame(
    gameId: string,
    teamId: string
  ): Promise<AwardSuggestion | null> {
    try {
      // Fetch team stats
      const teamStats = await TeamStatsService.aggregateTeamStats(gameId, teamId);
      const teamRoster = await import('@/lib/services/teamServiceV3').then(m => 
        m.TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, gameId)
      );
      
      const playerIds = teamRoster.map(p => p.id);
      const playerStats = await TeamStatsService.aggregatePlayerStats(gameId, teamId, playerIds);

      if (playerStats.length === 0) {
        return null;
      }

      // Calculate impact score for each player
      const suggestions = playerStats.map(player => {
        const impactScore = 
          (player.points * 2) +
          player.rebounds +
          player.assists +
          (player.steals * 1.5) +
          (player.blocks * 1.5) -
          (player.turnovers * 0.5);

        return {
          playerId: player.playerId,
          playerName: player.playerName,
          score: impactScore,
          reasoning: this.generatePlayerOfGameReasoning(player),
          stats: {
            points: player.points,
            rebounds: player.rebounds,
            assists: player.assists,
            steals: player.steals,
            blocks: player.blocks,
            turnovers: player.turnovers
          }
        };
      });

      // Sort by score descending
      suggestions.sort((a, b) => b.score - a.score);

      return suggestions[0] || null;
    } catch (error: any) {
      console.error('❌ AwardSuggestionService: Failed to suggest Player of the Game:', error);
      return null;
    }
  }

  /**
   * Suggest Hustle Player based on hustle score
   * Hustle = rebounds + (steals * 2) + (blocks * 2) + (offensiveRebounds * 1.5)
   */
  static async suggestHustlePlayer(
    gameId: string,
    teamId: string
  ): Promise<AwardSuggestion | null> {
    try {
      const teamRoster = await import('@/lib/services/teamServiceV3').then(m => 
        m.TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, gameId)
      );
      
      const playerIds = teamRoster.map(p => p.id);
      const playerStats = await TeamStatsService.aggregatePlayerStats(gameId, teamId, playerIds);

      if (playerStats.length === 0) {
        return null;
      }

      // Calculate hustle score for each player
      // Note: We don't have offensive rebounds separately, so using total rebounds
      const suggestions = playerStats.map(player => {
        const hustleScore = 
          player.rebounds +
          (player.steals * 2) +
          (player.blocks * 2);

        return {
          playerId: player.playerId,
          playerName: player.playerName,
          score: hustleScore,
          reasoning: this.generateHustlePlayerReasoning(player),
          stats: {
            points: player.points,
            rebounds: player.rebounds,
            assists: player.assists,
            steals: player.steals,
            blocks: player.blocks,
            turnovers: player.turnovers
          }
        };
      });

      // Sort by score descending
      suggestions.sort((a, b) => b.score - a.score);

      return suggestions[0] || null;
    } catch (error: any) {
      console.error('❌ AwardSuggestionService: Failed to suggest Hustle Player:', error);
      return null;
    }
  }

  /**
   * Generate reasoning text for Player of the Game
   */
  private static generatePlayerOfGameReasoning(player: PlayerStats): string {
    const parts: string[] = [];
    
    if (player.points > 0) parts.push(`${player.points} points`);
    if (player.rebounds > 0) parts.push(`${player.rebounds} rebounds`);
    if (player.assists > 0) parts.push(`${player.assists} assists`);
    if (player.steals > 0) parts.push(`${player.steals} steals`);
    if (player.blocks > 0) parts.push(`${player.blocks} blocks`);

    if (parts.length === 0) return 'No stats recorded';
    return parts.join(', ');
  }

  /**
   * Generate reasoning text for Hustle Player
   */
  private static generateHustlePlayerReasoning(player: PlayerStats): string {
    const parts: string[] = [];
    
    if (player.rebounds > 0) parts.push(`${player.rebounds} rebounds`);
    if (player.steals > 0) parts.push(`${player.steals} steals`);
    if (player.blocks > 0) parts.push(`${player.blocks} blocks`);

    if (parts.length === 0) return 'No hustle stats recorded';
    return parts.join(', ');
  }

  /**
   * Suggest both awards for a winning team
   */
  static async suggestBothAwards(
    gameId: string,
    winningTeamId: string
  ): Promise<{
    playerOfTheGame: AwardSuggestion | null;
    hustlePlayer: AwardSuggestion | null;
  }> {
    const [playerOfTheGame, hustlePlayer] = await Promise.all([
      this.suggestPlayerOfTheGame(gameId, winningTeamId),
      this.suggestHustlePlayer(gameId, winningTeamId)
    ]);

    return { playerOfTheGame, hustlePlayer };
  }

  /**
   * ✅ OPTIMIZED: Suggest both awards using PRE-FETCHED player stats
   * Eliminates duplicate API calls when caller already has the data
   */
  static suggestBothAwardsFromStats(
    playerStats: PlayerStats[]
  ): {
    playerOfTheGame: AwardSuggestion | null;
    hustlePlayer: AwardSuggestion | null;
  } {
    if (playerStats.length === 0) {
      return { playerOfTheGame: null, hustlePlayer: null };
    }

    // Calculate Player of the Game (impact score)
    const pogSuggestions = playerStats.map(player => ({
      playerId: player.playerId,
      playerName: player.playerName,
      score: (player.points * 2) + player.rebounds + player.assists +
             (player.steals * 1.5) + (player.blocks * 1.5) - (player.turnovers * 0.5),
      reasoning: this.generatePlayerOfGameReasoning(player),
      stats: {
        points: player.points, rebounds: player.rebounds, assists: player.assists,
        steals: player.steals, blocks: player.blocks, turnovers: player.turnovers
      }
    })).sort((a, b) => b.score - a.score);

    // Calculate Hustle Player (hustle score)
    const hustleSuggestions = playerStats.map(player => ({
      playerId: player.playerId,
      playerName: player.playerName,
      score: player.rebounds + (player.steals * 2) + (player.blocks * 2),
      reasoning: this.generateHustlePlayerReasoning(player),
      stats: {
        points: player.points, rebounds: player.rebounds, assists: player.assists,
        steals: player.steals, blocks: player.blocks, turnovers: player.turnovers
      }
    })).sort((a, b) => b.score - a.score);

    return {
      playerOfTheGame: pogSuggestions[0] || null,
      hustlePlayer: hustleSuggestions[0] || null
    };
  }
}

