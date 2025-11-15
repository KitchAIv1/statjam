/**
 * GameAwardsService - Service for Managing Game Awards
 * 
 * PURPOSE: Save and fetch Player of the Game and Hustle Player awards
 * - Save awards when game is completed
 * - Fetch awards for display in various components
 * - Support retroactive award assignment
 * 
 * Follows .cursorrules: <200 lines service
 */

import { authServiceV2 } from './authServiceV2';

export interface GameAwards {
  playerOfTheGameId: string | null;
  hustlePlayerId: string | null;
  awardsSelectedAt: string | null;
  awardsSelectedBy: string | null;
}

export interface PlayerAward {
  gameId: string;
  gameDate: string;
  opponentName: string;
  awardType: 'player_of_the_game' | 'hustle_player';
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
}

export class GameAwardsService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  private static getUserId(): string | null {
    const session = authServiceV2.getSession();
    return session.user?.id || null;
  }

  /**
   * Save awards for a game
   */
  static async saveGameAwards(
    gameId: string,
    awards: {
      playerOfTheGameId: string;
      hustlePlayerId: string;
      isAutoSuggested?: boolean;
    }
  ): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // Get current user ID from authServiceV2 (source of truth)
      const userId = this.getUserId();
      if (!userId) {
        throw new Error('User ID not found - please ensure you are logged in');
      }

      // Update games table
      const gameUrl = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`;
      const gameResponse = await fetch(gameUrl, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          player_of_the_game_id: awards.playerOfTheGameId,
          hustle_player_of_the_game_id: awards.hustlePlayerId,
          awards_selected_at: new Date().toISOString(),
          awards_selected_by: userId
        })
      });

      if (!gameResponse.ok) {
        const errorText = await gameResponse.text();
        throw new Error(`Failed to save awards: ${gameResponse.status} - ${errorText}`);
      }

      // Insert into history table
      const historyUrl = `${this.SUPABASE_URL}/rest/v1/game_awards_history`;
      const historyData = [
        {
          game_id: gameId,
          player_id: awards.playerOfTheGameId,
          award_type: 'player_of_the_game',
          selected_by: userId,
          is_auto_suggested: awards.isAutoSuggested || false
        },
        {
          game_id: gameId,
          player_id: awards.hustlePlayerId,
          award_type: 'hustle_player',
          selected_by: userId,
          is_auto_suggested: awards.isAutoSuggested || false
        }
      ];

      const historyResponse = await fetch(historyUrl, {
        method: 'POST',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(historyData)
      });

      if (!historyResponse.ok) {
        // Log but don't fail - history is optional
        console.warn('Failed to save award history:', await historyResponse.text());
      }

      console.log('✅ GameAwardsService: Awards saved successfully');
      return true;
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to save awards:', error);
      throw error;
    }
  }

  /**
   * Get awards for a specific game
   */
  static async getGameAwards(gameId: string): Promise<GameAwards | null> {
    try {
      const accessToken = this.getAccessToken();
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=player_of_the_game_id,hustle_player_of_the_game_id,awards_selected_at,awards_selected_by`;

      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch awards: ${response.status}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        return null;
      }

      const game = data[0];
      return {
        playerOfTheGameId: game.player_of_the_game_id,
        hustlePlayerId: game.hustle_player_of_the_game_id,
        awardsSelectedAt: game.awards_selected_at,
        awardsSelectedBy: game.awards_selected_by
      };
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to fetch awards:', error);
      return null;
    }
  }

  /**
   * Get recent game awards for a tournament
   */
  static async getTournamentAwards(tournamentId: string, limit: number = 5): Promise<Array<{
    gameId: string;
    gameDate: string;
    teamAName: string;
    teamBName: string;
    teamAScore: number;
    teamBScore: number;
    playerOfTheGame: {
      id: string;
      name: string;
      stats: {
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
      };
    } | null;
    hustlePlayer: {
      id: string;
      name: string;
      stats: {
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
      };
    } | null;
  }>> {
    try {
      const accessToken = this.getAccessToken();
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // Query completed games with awards for this tournament
      const url = `${this.SUPABASE_URL}/rest/v1/games?tournament_id=eq.${tournamentId}&status=eq.completed&or=(player_of_the_game_id.not.is.null,hustle_player_of_the_game_id.not.is.null)&select=id,start_time,home_score,away_score,team_a_id,team_b_id,player_of_the_game_id,hustle_player_of_the_game_id&order=start_time.desc&limit=${limit}`;

      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch tournament awards: ${response.status}`);
      }

      const games = await response.json();
      
      if (!games || games.length === 0) {
        return [];
      }

      // Fetch team names and player names
      const teamIds = [...new Set([
        ...games.map((g: any) => g.team_a_id),
        ...games.map((g: any) => g.team_b_id)
      ].filter(Boolean))];
      
      const playerIds = [...new Set([
        ...games.map((g: any) => g.player_of_the_game_id).filter(Boolean),
        ...games.map((g: any) => g.hustle_player_of_the_game_id).filter(Boolean)
      ].filter(Boolean))];

      // Fetch teams and players in parallel
      const [teamsResponse, playersResponse] = await Promise.all([
        teamIds.length > 0 ? fetch(
          `${this.SUPABASE_URL}/rest/v1/teams?id=in.(${teamIds.join(',')})&select=id,name`,
          { headers }
        ).then(r => r.json()) : Promise.resolve([]),
        playerIds.length > 0 ? fetch(
          `${this.SUPABASE_URL}/rest/v1/users?id=in.(${playerIds.join(',')})&select=id,name`,
          { headers }
        ).then(r => r.json()) : Promise.resolve([])
      ]);

      const teamsMap = new Map((teamsResponse || []).map((t: any) => [t.id, t.name]));
      const playersMap = new Map((playersResponse || []).map((p: any) => [p.id, p.name]));

      // ✅ Fetch game-specific stats for each award winner
      const { TeamStatsService } = await import('./teamStatsService');
      const { TeamServiceV3 } = await import('./teamServiceV3');

      const awardsWithStats = await Promise.all(games.map(async (game: any) => {
        // Determine winning team
        const teamAScore = game.home_score || 0;
        const teamBScore = game.away_score || 0;
        const winningTeamId = teamAScore > teamBScore ? game.team_a_id : game.team_b_id;

        // Fetch team roster and aggregate stats for the winning team
        let playerOfTheGameStats = {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0
        };
        let hustlePlayerStats = {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0
        };

        if (winningTeamId && (game.player_of_the_game_id || game.hustle_player_of_the_game_id)) {
          try {
            const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(winningTeamId, game.id);
            const rosterPlayerIds = teamRoster.map(p => p.id);
            const playerStats = await TeamStatsService.aggregatePlayerStats(game.id, winningTeamId, rosterPlayerIds);

            // Find stats for Player of the Game
            if (game.player_of_the_game_id) {
              const potgStats = playerStats.find(p => p.playerId === game.player_of_the_game_id);
              if (potgStats) {
                playerOfTheGameStats = {
                  points: potgStats.points,
                  rebounds: potgStats.rebounds,
                  assists: potgStats.assists,
                  steals: potgStats.steals,
                  blocks: potgStats.blocks
                };
              }
            }

            // Find stats for Hustle Player
            if (game.hustle_player_of_the_game_id) {
              const hustleStats = playerStats.find(p => p.playerId === game.hustle_player_of_the_game_id);
              if (hustleStats) {
                hustlePlayerStats = {
                  points: hustleStats.points,
                  rebounds: hustleStats.rebounds,
                  assists: hustleStats.assists,
                  steals: hustleStats.steals,
                  blocks: hustleStats.blocks
                };
              }
            }
          } catch (error) {
            console.error(`Failed to fetch stats for game ${game.id}:`, error);
            // Continue with default stats if fetch fails
          }
        }

        return {
          gameId: game.id,
          gameDate: game.start_time,
          teamAName: teamsMap.get(game.team_a_id) || 'Team A',
          teamBName: teamsMap.get(game.team_b_id) || 'Team B',
          teamAScore: teamAScore,
          teamBScore: teamBScore,
          playerOfTheGame: game.player_of_the_game_id ? {
            id: game.player_of_the_game_id,
            name: playersMap.get(game.player_of_the_game_id) || 'Unknown Player',
            stats: playerOfTheGameStats
          } : null,
          hustlePlayer: game.hustle_player_of_the_game_id ? {
            id: game.hustle_player_of_the_game_id,
            name: playersMap.get(game.hustle_player_of_the_game_id) || 'Unknown Player',
            stats: hustlePlayerStats
          } : null
        };
      }));

      return awardsWithStats;
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to fetch tournament awards:', error);
      return [];
    }
  }

  /**
   * Get all awards for a specific player
   */
  static async getPlayerAwards(playerId: string): Promise<PlayerAward[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // Query games where player won an award
      const url = `${this.SUPABASE_URL}/rest/v1/games?or=(player_of_the_game_id.eq.${playerId},hustle_player_of_the_game_id.eq.${playerId})&select=id,start_time,team_a_id,team_b_id,home_score,away_score,player_of_the_game_id,hustle_player_of_the_game_id&order=start_time.desc`;

      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch player awards: ${response.status}`);
      }

      const games = await response.json();
      
      if (!games || games.length === 0) {
        return [];
      }

      // ✅ Fetch game-specific stats for each award
      const { TeamStatsService } = await import('./teamStatsService');
      const { TeamServiceV3 } = await import('./teamServiceV3');

      const awardsWithStats = await Promise.all(games.map(async (game: any) => {
        // Determine which team the player was on
        const teamIds = [game.team_a_id, game.team_b_id].filter(Boolean);
        let playerTeamId: string | null = null;
        let opponentName = 'Opponent';

        // Fetch team names
        const teamNamesResponse = await fetch(
          `${this.SUPABASE_URL}/rest/v1/teams?id=in.(${teamIds.join(',')})&select=id,name`,
          { headers }
        ).then(r => r.json());
        const teamNamesMap = new Map((teamNamesResponse || []).map((t: any) => [t.id, t.name]));

        // Determine player's team and opponent
        for (const teamId of teamIds) {
          try {
            const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, game.id);
            if (teamRoster.some(p => p.id === playerId)) {
              playerTeamId = teamId;
              // Set opponent name
              const opponentTeamId = teamIds.find(id => id !== teamId);
              opponentName = teamNamesMap.get(opponentTeamId || '') || 'Opponent';
              break;
            }
          } catch (error) {
            console.error(`Failed to check team ${teamId} for player:`, error);
          }
        }

        // Fetch player stats for this game
        let gameStats = {
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0
        };

        if (playerTeamId) {
          try {
            const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(playerTeamId, game.id);
            const rosterPlayerIds = teamRoster.map(p => p.id);
            const playerStats = await TeamStatsService.aggregatePlayerStats(game.id, playerTeamId, rosterPlayerIds);
            const playerStat = playerStats.find(p => p.playerId === playerId);
            
            if (playerStat) {
              gameStats = {
                points: playerStat.points,
                rebounds: playerStat.rebounds,
                assists: playerStat.assists,
                steals: playerStat.steals,
                blocks: playerStat.blocks
              };
            }
          } catch (error) {
            console.error(`Failed to fetch stats for game ${game.id}:`, error);
          }
        }

        return {
          gameId: game.id,
          gameDate: game.start_time,
          opponentName: opponentName,
          awardType: game.player_of_the_game_id === playerId 
            ? 'player_of_the_game' as const 
            : 'hustle_player' as const,
          stats: gameStats
        };
      }));

      return awardsWithStats;
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to fetch player awards:', error);
      return [];
    }
  }
}

