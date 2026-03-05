/**
 * GameAwardsService - Service for Managing Game Awards
 * 
 * PURPOSE: Save and fetch Player of the Game and Hustle Player awards
 * - Save awards when game is completed
 * - Fetch awards for display in various components
 * - Support retroactive award assignment
 * - ✅ SUPPORTS CUSTOM PLAYERS (Nov 2025)
 * 
 * Follows .cursorrules: <200 lines service
 */

import { authServiceV2 } from './authServiceV2';

export interface GameAwards {
  playerOfTheGameId: string | null;
  hustlePlayerId: string | null;
  // ✅ NEW: Custom player support
  customPlayerOfTheGameId: string | null;
  customHustlePlayerId: string | null;
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

// Default stats object
const DEFAULT_STATS = { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };

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

  private static getHeaders(accessToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'apikey': this.SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json'
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }

  /**
   * Save awards for a game
   * ✅ UPDATED: Supports both regular and custom players
   */
  static async saveGameAwards(
    gameId: string,
    awards: {
      playerOfTheGameId: string;
      hustlePlayerId: string;
      isPlayerOfGameCustom?: boolean;  // ✅ NEW: Flag for custom player
      isHustlePlayerCustom?: boolean;  // ✅ NEW: Flag for custom player
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

      // ✅ Build update payload based on player types
      const gameUpdatePayload: Record<string, any> = {
        awards_selected_at: new Date().toISOString(),
        awards_selected_by: userId,
        // Clear all award columns first to ensure clean state
        player_of_the_game_id: null,
        custom_player_of_the_game_id: null,
        hustle_player_of_the_game_id: null,
        custom_hustle_player_of_the_game_id: null
      };

      // Set Player of the Game in correct column
      if (awards.isPlayerOfGameCustom) {
        gameUpdatePayload.custom_player_of_the_game_id = awards.playerOfTheGameId;
        console.log('📝 GameAwardsService: Player of Game is CUSTOM player');
      } else {
        gameUpdatePayload.player_of_the_game_id = awards.playerOfTheGameId;
        console.log('📝 GameAwardsService: Player of Game is REGULAR player');
      }

      // Set Hustle Player in correct column
      if (awards.isHustlePlayerCustom) {
        gameUpdatePayload.custom_hustle_player_of_the_game_id = awards.hustlePlayerId;
        console.log('📝 GameAwardsService: Hustle Player is CUSTOM player');
      } else {
        gameUpdatePayload.hustle_player_of_the_game_id = awards.hustlePlayerId;
        console.log('📝 GameAwardsService: Hustle Player is REGULAR player');
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
        body: JSON.stringify(gameUpdatePayload)
      });

      if (!gameResponse.ok) {
        const errorText = await gameResponse.text();
        throw new Error(`Failed to save awards: ${gameResponse.status} - ${errorText}`);
      }

      // ✅ Insert into history table (with custom player support)
      const historyUrl = `${this.SUPABASE_URL}/rest/v1/game_awards_history`;
      const historyData = [
        {
          game_id: gameId,
          player_id: awards.isPlayerOfGameCustom ? null : awards.playerOfTheGameId,
          custom_player_id: awards.isPlayerOfGameCustom ? awards.playerOfTheGameId : null,
          award_type: 'player_of_the_game',
          selected_by: userId,
          is_auto_suggested: awards.isAutoSuggested || false
        },
        {
          game_id: gameId,
          player_id: awards.isHustlePlayerCustom ? null : awards.hustlePlayerId,
          custom_player_id: awards.isHustlePlayerCustom ? awards.hustlePlayerId : null,
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
   * ✅ UPDATED: Returns both regular and custom player IDs
   */
  static async getGameAwards(gameId: string): Promise<GameAwards | null> {
    try {
      const accessToken = this.getAccessToken();
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // ✅ Include custom player columns
      const url = `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=player_of_the_game_id,hustle_player_of_the_game_id,custom_player_of_the_game_id,custom_hustle_player_of_the_game_id,awards_selected_at,awards_selected_by`;

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
        // ✅ NEW: Custom player IDs
        customPlayerOfTheGameId: game.custom_player_of_the_game_id,
        customHustlePlayerId: game.custom_hustle_player_of_the_game_id,
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
   * ✅ UPDATED: Supports both regular and custom players
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
      profilePhotoUrl?: string | null;  // ✅ Added photo URL
      isCustomPlayer?: boolean;
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
      profilePhotoUrl?: string | null;  // ✅ Added photo URL
      isCustomPlayer?: boolean;
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

      // ✅ Query includes both regular AND custom player award columns
      const url = `${this.SUPABASE_URL}/rest/v1/games?tournament_id=eq.${tournamentId}&status=eq.completed&or=(player_of_the_game_id.not.is.null,hustle_player_of_the_game_id.not.is.null,custom_player_of_the_game_id.not.is.null,custom_hustle_player_of_the_game_id.not.is.null)&select=id,start_time,home_score,away_score,team_a_id,team_b_id,player_of_the_game_id,hustle_player_of_the_game_id,custom_player_of_the_game_id,custom_hustle_player_of_the_game_id&order=start_time.desc&limit=${limit}`;

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

      // Fetch team names
      const teamIds = [...new Set([
        ...games.map((g: any) => g.team_a_id),
        ...games.map((g: any) => g.team_b_id)
      ].filter(Boolean))];
      
      // ✅ Separate regular player IDs and custom player IDs
      const regularPlayerIds = [...new Set([
        ...games.map((g: any) => g.player_of_the_game_id).filter(Boolean),
        ...games.map((g: any) => g.hustle_player_of_the_game_id).filter(Boolean)
      ].filter(Boolean))];

      const customPlayerIds = [...new Set([
        ...games.map((g: any) => g.custom_player_of_the_game_id).filter(Boolean),
        ...games.map((g: any) => g.custom_hustle_player_of_the_game_id).filter(Boolean)
      ].filter(Boolean))];

      // ✅ Fetch teams, regular players, AND custom players in parallel (now includes profile_photo_url)
      const [teamsResponse, playersResponse, customPlayersResponse] = await Promise.all([
        teamIds.length > 0 ? fetch(
          `${this.SUPABASE_URL}/rest/v1/teams?id=in.(${teamIds.join(',')})&select=id,name`,
          { headers }
        ).then(r => r.json()) : Promise.resolve([]),
        regularPlayerIds.length > 0 ? fetch(
          `${this.SUPABASE_URL}/rest/v1/users?id=in.(${regularPlayerIds.join(',')})&select=id,name,profile_photo_url`,
          { headers }
        ).then(r => r.json()) : Promise.resolve([]),
        customPlayerIds.length > 0 ? fetch(
          `${this.SUPABASE_URL}/rest/v1/custom_players?id=in.(${customPlayerIds.join(',')})&select=id,name,profile_photo_url`,
          { headers }
        ).then(r => r.json()) : Promise.resolve([])
      ]);

      const teamsMap = new Map((teamsResponse || []).map((t: any) => [t.id, t.name]));
      const playersMap = new Map((playersResponse || []).map((p: any) => [p.id, { name: p.name, profilePhotoUrl: p.profile_photo_url }]));
      const customPlayersMap = new Map((customPlayersResponse || []).map((p: any) => [p.id, { name: p.name, profilePhotoUrl: p.profile_photo_url }]));

      // ✅ FIX: Fetch game_stats per-game in parallel (avoids PostgREST 1000 row limit)
      // Same pattern as useTournamentMatchups
      const scoresByGameId = new Map<string, { teamAScore: number; teamBScore: number }>();
      
      await Promise.all(games.map(async (game: any) => {
        try {
          const statsUrl = `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=eq.${game.id}&select=game_id,team_id,stat_value,modifier,is_opponent_stat`;
          const statsResponse = await fetch(statsUrl, { headers });
          
          if (!statsResponse.ok) {
            scoresByGameId.set(game.id, { teamAScore: 0, teamBScore: 0 });
            return;
          }
          
          const gameStats = await statsResponse.json();
          let teamAScore = 0, teamBScore = 0;
          
          for (const stat of gameStats) {
            if (stat.modifier !== 'made') continue;
            const points = stat.stat_value || 0;
            
            // ✅ Handle is_opponent_stat for coach mode consistency
            if (stat.is_opponent_stat) {
              teamBScore += points;
            } else if (stat.team_id === game.team_a_id) {
              teamAScore += points;
            } else if (stat.team_id === game.team_b_id) {
              teamBScore += points;
            }
          }
          
          scoresByGameId.set(game.id, { teamAScore, teamBScore });
        } catch (e) {
          console.warn(`Failed to fetch game_stats for game ${game.id}:`, e);
          scoresByGameId.set(game.id, { teamAScore: 0, teamBScore: 0 });
        }
      }));

      // ✅ Batched stats fetch: two parallel queries for award winners only (replaces N×getPlayerGameStats)
      const awardGameIds = games.map((g: any) => g.id);
      const awardRegularPlayerIds = [...new Set([
        ...games.map((g: any) => g.player_of_the_game_id).filter(Boolean),
        ...games.map((g: any) => g.hustle_player_of_the_game_id).filter(Boolean)
      ])];
      const awardCustomPlayerIds = [...new Set([
        ...games.map((g: any) => g.custom_player_of_the_game_id).filter(Boolean),
        ...games.map((g: any) => g.custom_hustle_player_of_the_game_id).filter(Boolean)
      ])];

      const [regularStatsRows, customStatsRows] = await Promise.all([
        awardRegularPlayerIds.length > 0
          ? fetch(
              `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${awardGameIds.join(',')})&player_id=in.(${awardRegularPlayerIds.join(',')})&select=game_id,player_id,custom_player_id,stat_type,stat_value,modifier`,
              { headers }
            ).then(r => r.ok ? r.json() : []).catch(() => [])
          : Promise.resolve([]),
        awardCustomPlayerIds.length > 0
          ? fetch(
              `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${awardGameIds.join(',')})&custom_player_id=in.(${awardCustomPlayerIds.join(',')})&select=game_id,player_id,custom_player_id,stat_type,stat_value,modifier`,
              { headers }
            ).then(r => r.ok ? r.json() : []).catch(() => [])
          : Promise.resolve([])
      ]);

      // Build lookup: key = `${playerId}_${gameId}` -> { points, rebounds, assists, steals, blocks }
      // points = sum of stat_value where modifier === 'made'; rebounds/assists/steals/blocks = row counts for that stat_type
      const awardStatsMap = new Map<string, { points: number; rebounds: number; assists: number; steals: number; blocks: number }>();
      const allStatsRows = [...(regularStatsRows || []), ...(customStatsRows || [])];
      for (const row of allStatsRows) {
        const playerKey = row.player_id ?? row.custom_player_id;
        if (!playerKey || !row.game_id) continue;
        const mapKey = `${playerKey}_${row.game_id}`;
        const existing = awardStatsMap.get(mapKey) ?? { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
        if (row.modifier === 'made') {
          existing.points += Number(row.stat_value) || 0;
        }
        if (row.stat_type === 'rebound') existing.rebounds += 1;
        if (row.stat_type === 'assist') existing.assists += 1;
        if (row.stat_type === 'steal') existing.steals += 1;
        if (row.stat_type === 'block') existing.blocks += 1;
        awardStatsMap.set(mapKey, existing);
      }

      const awardsWithStats = games.map((game: any) => {
        // ✅ FIX: Use calculated scores from game_stats (source of truth)
        const calculatedScores = scoresByGameId.get(game.id) || { teamAScore: 0, teamBScore: 0 };
        const { teamAScore, teamBScore } = calculatedScores;
        const potgId = game.player_of_the_game_id || game.custom_player_of_the_game_id;
        const isPotgCustom = !!game.custom_player_of_the_game_id;
        const hustleId = game.hustle_player_of_the_game_id || game.custom_hustle_player_of_the_game_id;
        const isHustleCustom = !!game.custom_hustle_player_of_the_game_id;

        const potgStats = potgId ? (awardStatsMap.get(`${potgId}_${game.id}`) ?? { ...DEFAULT_STATS }) : { ...DEFAULT_STATS };
        const hustleStats = hustleId ? (awardStatsMap.get(`${hustleId}_${game.id}`) ?? { ...DEFAULT_STATS }) : { ...DEFAULT_STATS };

        // ✅ Get player info including photo URL
        const potgPlayerInfo = isPotgCustom ? customPlayersMap.get(potgId) : playersMap.get(potgId);
        const hustlePlayerInfo = isHustleCustom ? customPlayersMap.get(hustleId) : playersMap.get(hustleId);

        return {
          gameId: game.id, gameDate: game.start_time,
          teamAName: teamsMap.get(game.team_a_id) || 'Team A',
          teamBName: teamsMap.get(game.team_b_id) || 'Team B',
          teamAScore, teamBScore,
          playerOfTheGame: potgId ? {
            id: potgId,
            name: potgPlayerInfo?.name || (isPotgCustom ? 'Custom Player' : 'Unknown Player'),
            profilePhotoUrl: potgPlayerInfo?.profilePhotoUrl || null,
            isCustomPlayer: isPotgCustom, stats: potgStats
          } : null,
          hustlePlayer: hustleId ? {
            id: hustleId,
            name: hustlePlayerInfo?.name || (isHustleCustom ? 'Custom Player' : 'Unknown Player'),
            profilePhotoUrl: hustlePlayerInfo?.profilePhotoUrl || null,
            isCustomPlayer: isHustleCustom, stats: hustleStats
          } : null
        };
      });

      return awardsWithStats;
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to fetch tournament awards:', error);
      return [];
    }
  }

  /**
   * Get all awards for a specific player
   * ✅ UPDATED: Supports both regular and custom players
   */
  static async getPlayerAwards(playerId: string, isCustomPlayer: boolean = false): Promise<PlayerAward[]> {
    try {
      const accessToken = this.getAccessToken();
      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // ✅ Query games where player won an award (check both regular and custom columns)
      let url: string;
      if (isCustomPlayer) {
        url = `${this.SUPABASE_URL}/rest/v1/games?or=(custom_player_of_the_game_id.eq.${playerId},custom_hustle_player_of_the_game_id.eq.${playerId})&select=id,start_time,team_a_id,team_b_id,home_score,away_score,custom_player_of_the_game_id,custom_hustle_player_of_the_game_id&order=start_time.desc`;
      } else {
        url = `${this.SUPABASE_URL}/rest/v1/games?or=(player_of_the_game_id.eq.${playerId},hustle_player_of_the_game_id.eq.${playerId})&select=id,start_time,team_a_id,team_b_id,home_score,away_score,player_of_the_game_id,hustle_player_of_the_game_id&order=start_time.desc`;
      }

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

      const { PlayerGameStatsService } = await import('./playerGameStatsService');

      // Fetch all player game stats once (cached, efficient)
      const allPlayerGameStats = await PlayerGameStatsService.getPlayerGameStats(playerId, isCustomPlayer);

      const awardsWithStats = await Promise.all(games.map(async (game: any) => {
        const teamIds = [game.team_a_id, game.team_b_id].filter(Boolean);

        // Fetch team names
        const teamsResp = await fetch(`${this.SUPABASE_URL}/rest/v1/teams?id=in.(${teamIds.join(',')})&select=id,name`, { headers }).then(r => r.json());
        const teamNames = new Map<string, string>((teamsResp || []).map((t: any) => [t.id, t.name]));

        // Determine opponent from game stats (already has opponentId)
        const gameStats = allPlayerGameStats.find(g => g.gameId === game.id);
        const opponentName = gameStats?.opponent || teamNames.get(teamIds[1]) || 'Opponent';

        // Get stats for this specific game
        let stats = { ...DEFAULT_STATS };
        if (gameStats) {
          stats = {
            points: gameStats.points,
            rebounds: gameStats.rebounds,
            assists: gameStats.assists,
            steals: gameStats.steals,
            blocks: gameStats.blocks
          };
        }

        const potgCol = isCustomPlayer ? 'custom_player_of_the_game_id' : 'player_of_the_game_id';
        const awardType: 'player_of_the_game' | 'hustle_player' = game[potgCol] === playerId ? 'player_of_the_game' : 'hustle_player';

        return { gameId: game.id, gameDate: game.start_time, opponentName, awardType, stats };
      }));

      return awardsWithStats;
    } catch (error: any) {
      console.error('❌ GameAwardsService: Failed to fetch player awards:', error);
      return [];
    }
  }
}

