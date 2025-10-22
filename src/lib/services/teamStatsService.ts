/**
 * TeamStatsService - Raw HTTP Service for Team Statistics Aggregation
 * 
 * APPROACH: Direct HTTP requests to Supabase REST API (bypasses broken client)
 * - Uses same raw HTTP approach as GameServiceV3 and TeamServiceV3
 * - No Supabase client dependency
 * - Direct authentication with access tokens
 * - Reliable, fast, enterprise-grade
 * 
 * PURPOSE: Aggregate team and player statistics from game_stats table
 * for the Team Stats Tab component in live game viewer.
 */

export interface TeamStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  turnovers: number;
  rebounds: number;
  assists: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  plusMinus: number; // Simplified to 0 for MVP
}

export class TeamStatsService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Get access token from authServiceV2 localStorage
   */
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Convert HTTP status codes to user-friendly error messages
   */
  private static getUserFriendlyError(status: number, errorText: string): string {
    switch (status) {
      case 401:
        return 'Authentication required - please log in';
      case 403:
        return 'Access denied - insufficient permissions';
      case 404:
        return 'Game or team not found';
      case 500:
        return 'Server error - please try again later';
      default:
        return `Request failed: ${errorText}`;
    }
  }

  /**
   * Make authenticated HTTP request to Supabase REST API with automatic token refresh
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {},
    retryCount: number = 0
  ): Promise<T[]> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token found - user not authenticated');
    }

    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    console.log(`🌐 TeamStatsService: Raw HTTP request to ${table}`, { url, params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    // Handle authentication errors with automatic token refresh
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TeamStatsService: HTTP ${response.status}:`, errorText);
      
      // Check if it's an authentication error and we haven't retried yet
      if ((response.status === 401 || response.status === 403) && retryCount === 0) {
        console.log('🔐 TeamStatsService: Authentication error detected, attempting token refresh...');
        
        try {
          // Import authServiceV2 dynamically to avoid circular dependencies
          const { authServiceV2 } = await import('@/lib/services/authServiceV2');
          const session = authServiceV2.getSession();
          
          if (session.refreshToken) {
            const { data, error } = await authServiceV2.refreshToken(session.refreshToken);
            
            if (data && !error) {
              console.log('✅ TeamStatsService: Token refreshed, retrying request...');
              // Retry the request with the new token
              return this.makeRequest(table, params, retryCount + 1);
            } else {
              console.error('❌ TeamStatsService: Token refresh failed:', error);
            }
          } else {
            console.error('❌ TeamStatsService: No refresh token available');
          }
        } catch (refreshError) {
          console.error('❌ TeamStatsService: Error during token refresh:', refreshError);
        }
      }
      
      // Throw user-friendly error message based on status code
      const userMessage = this.getUserFriendlyError(response.status, errorText);
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log(`✅ TeamStatsService: Successfully fetched ${data.length} records from ${table}`);
    return data;
  }

  /**
   * Aggregate team statistics from game_stats table
   */
  static async aggregateTeamStats(gameId: string, teamId: string): Promise<TeamStats> {
    try {
      console.log('🏀 TeamStatsService: Aggregating team stats for game:', gameId, 'team:', teamId);

      // Fetch all game stats for this team
      const gameStats = await this.makeRequest<any>('game_stats', {
        'select': 'stat_type,stat_value,modifier,quarter',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`
      });

      console.log(`📊 TeamStatsService: Found ${gameStats.length} stats for team ${teamId}`);

      // Initialize counters
      let fieldGoalsMade = 0;
      let fieldGoalsAttempted = 0;
      let threePointersMade = 0;
      let threePointersAttempted = 0;
      let freeThrowsMade = 0;
      let freeThrowsAttempted = 0;
      let turnovers = 0;
      let rebounds = 0;
      let assists = 0;

      // Aggregate stats
      gameStats.forEach(stat => {
        const statType = stat.stat_type;
        const modifier = stat.modifier;
        const value = stat.stat_value || 1;

        switch (statType) {
          case 'field_goal':
          case 'two_pointer':
            if (modifier === 'made') {
              fieldGoalsMade += value;
              fieldGoalsAttempted += value;
            } else if (modifier === 'missed') {
              fieldGoalsAttempted += value;
            }
            break;
          case 'three_pointer':
            if (modifier === 'made') {
              threePointersMade += value;
              threePointersAttempted += value;
              fieldGoalsMade += value; // 3-pointers also count as field goals
              fieldGoalsAttempted += value;
            } else if (modifier === 'missed') {
              threePointersAttempted += value;
              fieldGoalsAttempted += value;
            }
            break;
          case 'free_throw':
            if (modifier === 'made') {
              freeThrowsMade += value;
              freeThrowsAttempted += value;
            } else if (modifier === 'missed') {
              freeThrowsAttempted += value;
            }
            break;
          case 'rebound':
            rebounds += value;
            break;
          case 'assist':
            assists += value;
            break;
          case 'turnover':
            turnovers += value;
            break;
        }
      });

      // Calculate percentages
      const fieldGoalPercentage = fieldGoalsAttempted > 0 
        ? Math.round((fieldGoalsMade / fieldGoalsAttempted) * 1000) / 10 
        : 0;
      const threePointPercentage = threePointersAttempted > 0 
        ? Math.round((threePointersMade / threePointersAttempted) * 1000) / 10 
        : 0;
      const freeThrowPercentage = freeThrowsAttempted > 0 
        ? Math.round((freeThrowsMade / freeThrowsAttempted) * 1000) / 10 
        : 0;

      const teamStats: TeamStats = {
        fieldGoalsMade,
        fieldGoalsAttempted,
        threePointersMade,
        threePointersAttempted,
        freeThrowsMade,
        freeThrowsAttempted,
        turnovers,
        rebounds,
        assists,
        fieldGoalPercentage,
        threePointPercentage,
        freeThrowPercentage
      };

      console.log('✅ TeamStatsService: Team stats aggregated successfully', teamStats);
      return teamStats;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to aggregate team stats:', error);
      throw new Error(`Failed to load team statistics: ${error.message}`);
    }
  }

  /**
   * Calculate accurate player minutes based on substitution timestamps
   */
  private static async calculatePlayerMinutes(gameId: string, teamId: string, playerIds: string[]): Promise<Map<string, number>> {
    try {
      console.log('⏱️ TeamStatsService: Calculating player minutes from substitutions');

      // Fetch all substitutions for this game and team
      const substitutions = await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'order': 'created_at.asc'
      });

      console.log(`📊 TeamStatsService: Found ${substitutions.length} substitutions for minutes calculation`);

      const playerMinutes = new Map<string, number>();
      
      // Initialize all players with 0 minutes
      playerIds.forEach(playerId => {
        playerMinutes.set(playerId, 0);
      });

      if (substitutions.length === 0) {
        // No substitutions - assume all players played full game
        // This is a fallback - in real NBA games there are always substitutions
        console.log('📝 TeamStatsService: No substitutions found, using fallback minutes calculation');
        return playerMinutes;
      }

      // For each player, calculate their on-court time
      for (const playerId of playerIds) {
        let totalMinutes = 0;
        let currentStintStart: Date | null = null;
        let isOnCourt = false;

        // Process substitutions chronologically
        for (const sub of substitutions) {
          const subTime = new Date(sub.created_at);
          
          if (sub.player_in_id === playerId) {
            // Player coming in
            if (!isOnCourt) {
              currentStintStart = subTime;
              isOnCourt = true;
            }
          } else if (sub.player_out_id === playerId) {
            // Player going out
            if (isOnCourt && currentStintStart) {
              const stintMinutes = (subTime.getTime() - currentStintStart.getTime()) / (1000 * 60);
              totalMinutes += stintMinutes;
              currentStintStart = null;
              isOnCourt = false;
            }
          }
        }

        // Handle case where player is still on court (no final SUB OUT)
        if (isOnCourt && currentStintStart) {
          const currentTime = new Date();
          const stintMinutes = (currentTime.getTime() - currentStintStart.getTime()) / (1000 * 60);
          totalMinutes += stintMinutes;
        }

        // Handle case where player started on court (no initial SUB IN)
        // If player has no SUB IN events, assume they started on court
        const hasSubIn = substitutions.some(sub => sub.player_in_id === playerId);
        if (!hasSubIn) {
          // Player started on court - calculate from game start to first SUB OUT or current time
          const firstSubOut = substitutions.find(sub => sub.player_out_id === playerId);
          if (firstSubOut) {
            const gameStart = new Date(substitutions[0].created_at); // Approximate game start
            const subOutTime = new Date(firstSubOut.created_at);
            const minutesFromStart = (subOutTime.getTime() - gameStart.getTime()) / (1000 * 60);
            totalMinutes += minutesFromStart;
          } else {
            // Player never subbed out - played entire game
            const gameStart = new Date(substitutions[0].created_at);
            const currentTime = new Date();
            const fullGameMinutes = (currentTime.getTime() - gameStart.getTime()) / (1000 * 60);
            totalMinutes += fullGameMinutes;
          }
        }

        playerMinutes.set(playerId, Math.round(totalMinutes * 10) / 10); // Round to 1 decimal
      }

      console.log('✅ TeamStatsService: Player minutes calculated successfully');
      return playerMinutes;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to calculate player minutes:', error);
      // Return fallback minutes (quarters * 10) if calculation fails
      const fallbackMinutes = new Map<string, number>();
      playerIds.forEach(playerId => {
        fallbackMinutes.set(playerId, 10); // Fallback to 10 minutes
      });
      return fallbackMinutes;
    }
  }

  /**
   * Calculate plus/minus for players based on score differential while on court
   */
  private static async calculatePlusMinusForPlayers(gameId: string, teamId: string, playerIds: string[]): Promise<Map<string, number>> {
    try {
      console.log('📊 TeamStatsService: Calculating plus/minus from score differential');

      // Fetch all substitutions for this game and team
      const substitutions = await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'order': 'created_at.asc'
      });

      // Fetch all scoring stats for the game
      const scoringStats = await this.makeRequest<any>('game_stats', {
        'select': 'player_id,team_id,stat_type,stat_value,modifier,created_at',
        'game_id': `eq.${gameId}`,
        'stat_type': `in.(field_goal,three_pointer,free_throw)`,
        'modifier': `eq.made`,
        'order': 'created_at.asc'
      });

      console.log(`📊 TeamStatsService: Found ${substitutions.length} substitutions and ${scoringStats.length} scoring events`);

      const playerPlusMinus = new Map<string, number>();
      
      // Initialize all players with 0 plus/minus
      playerIds.forEach(playerId => {
        playerPlusMinus.set(playerId, 0);
      });

      if (substitutions.length === 0 || scoringStats.length === 0) {
        console.log('📝 TeamStatsService: No substitutions or scoring events found, plus/minus remains 0');
        return playerPlusMinus;
      }

      // For each player, calculate their plus/minus
      for (const playerId of playerIds) {
        let plusMinus = 0;
        let isOnCourt = false;
        let stintStartTime: Date | null = null;

        // Process events chronologically (substitutions and scoring)
        const allEvents = [
          ...substitutions.map(sub => ({ ...sub, type: 'substitution', player_in_id: sub.player_in_id, player_out_id: sub.player_out_id })),
          ...scoringStats.map(stat => ({ ...stat, type: 'scoring' }))
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        for (const event of allEvents) {
          const eventTime = new Date(event.created_at);

          if (event.type === 'substitution') {
            if (event.player_in_id === playerId) {
              // Player coming in
              if (!isOnCourt) {
                stintStartTime = eventTime;
                isOnCourt = true;
              }
            } else if (event.player_out_id === playerId) {
              // Player going out
              if (isOnCourt && stintStartTime) {
                // Calculate plus/minus for this stint
                const stintPlusMinus = this.calculateStintPlusMinus(stintStartTime, eventTime, scoringStats, teamId);
                plusMinus += stintPlusMinus;
                stintStartTime = null;
                isOnCourt = false;
              }
            }
          }
        }

        // Handle case where player is still on court (no final SUB OUT)
        if (isOnCourt && stintStartTime) {
          const currentTime = new Date();
          const stintPlusMinus = this.calculateStintPlusMinus(stintStartTime, currentTime, scoringStats, teamId);
          plusMinus += stintPlusMinus;
        }

        // Handle case where player started on court (no initial SUB IN)
        const hasSubIn = substitutions.some(sub => sub.player_in_id === playerId);
        if (!hasSubIn) {
          // Player started on court - calculate from game start
          const gameStart = new Date(allEvents[0].created_at);
          const firstSubOut = substitutions.find(sub => sub.player_out_id === playerId);
          const endTime = firstSubOut ? new Date(firstSubOut.created_at) : new Date();
          const stintPlusMinus = this.calculateStintPlusMinus(gameStart, endTime, scoringStats, teamId);
          plusMinus += stintPlusMinus;
        }

        playerPlusMinus.set(playerId, Math.round(plusMinus));
      }

      console.log('✅ TeamStatsService: Plus/minus calculated successfully');
      return playerPlusMinus;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to calculate plus/minus:', error);
      // Return 0 for all players if calculation fails
      const fallbackPlusMinus = new Map<string, number>();
      playerIds.forEach(playerId => {
        fallbackPlusMinus.set(playerId, 0);
      });
      return fallbackPlusMinus;
    }
  }

  /**
   * Calculate plus/minus for a specific time period
   */
  private static calculateStintPlusMinus(startTime: Date, endTime: Date, scoringStats: any[], teamId: string): number {
    let teamPoints = 0;
    let opponentPoints = 0;

    for (const stat of scoringStats) {
      const statTime = new Date(stat.created_at);
      if (statTime >= startTime && statTime <= endTime) {
        const points = stat.stat_value || 0;
        if (stat.team_id === teamId) {
          teamPoints += points;
        } else {
          opponentPoints += points;
        }
      }
    }

    return teamPoints - opponentPoints;
  }

  /**
   * Aggregate player statistics from game_stats table
   */
  static async aggregatePlayerStats(gameId: string, teamId: string, playerIds: string[]): Promise<PlayerStats[]> {
    try {
      console.log('🏀 TeamStatsService: Aggregating player stats for game:', gameId, 'team:', teamId, 'players:', playerIds.length);

      if (playerIds.length === 0) {
        return [];
      }

      // Fetch all game stats for this team's players
      const gameStats = await this.makeRequest<any>('game_stats', {
        'select': 'player_id,stat_type,stat_value,modifier,quarter',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'player_id': `in.(${playerIds.join(',')})`
      });

      console.log(`📊 TeamStatsService: Found ${gameStats.length} stats for ${playerIds.length} players`);

      // Fetch player names
      const playersResponse = await this.makeRequest<any>('users', {
        'select': 'id,name,email',
        'id': `in.(${playerIds.join(',')})`
      });

      const playersMap = new Map(
        playersResponse.map((p: any) => [
          p.id,
          p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`
        ])
      );

      // Calculate accurate player minutes from substitutions
      const playerMinutesMap = await this.calculatePlayerMinutes(gameId, teamId, playerIds);

      // Calculate plus/minus for players
      const playerPlusMinusMap = await this.calculatePlusMinusForPlayers(gameId, teamId, playerIds);

      // Aggregate stats per player
      const playerStatsMap = new Map<string, any>();

      playerIds.forEach(playerId => {
        playerStatsMap.set(playerId, {
          playerId,
          playerName: playersMap.get(playerId) || `Player ${playerId.substring(0, 8)}`,
          minutes: playerMinutesMap.get(playerId) || 0,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          plusMinus: playerPlusMinusMap.get(playerId) || 0,
          quartersPlayed: new Set()
        });
      });

      // Process each stat
      gameStats.forEach(stat => {
        const playerId = stat.player_id;
        const playerStats = playerStatsMap.get(playerId);
        if (!playerStats) return;

        const statType = stat.stat_type;
        const modifier = stat.modifier;
        const value = stat.stat_value || 1;
        const quarter = stat.quarter;

        // Track quarters played for minutes calculation
        playerStats.quartersPlayed.add(quarter);

        switch (statType) {
          case 'field_goal':
          case 'two_pointer':
            if (modifier === 'made') {
              playerStats.points += 2;
            }
            break;
          case 'three_pointer':
            if (modifier === 'made') {
              playerStats.points += 3;
            }
            break;
          case 'free_throw':
            if (modifier === 'made') {
              playerStats.points += 1;
            }
            break;
          case 'rebound':
            playerStats.rebounds += value;
            break;
          case 'assist':
            playerStats.assists += value;
            break;
          case 'steal':
            playerStats.steals += value;
            break;
          case 'block':
            playerStats.blocks += value;
            break;
          case 'turnover':
            playerStats.turnovers += value;
            break;
        }
      });

      // Finalize stats (minutes already calculated from substitutions)
      const playerStats: PlayerStats[] = Array.from(playerStatsMap.values()).map(player => {
        return {
          playerId: player.playerId,
          playerName: player.playerName,
          minutes: player.minutes, // Already calculated from substitutions
          points: player.points,
          rebounds: player.rebounds,
          assists: player.assists,
          steals: player.steals,
          blocks: player.blocks,
          turnovers: player.turnovers,
          plusMinus: player.plusMinus // Will be calculated in next step
        };
      });

      console.log('✅ TeamStatsService: Player stats aggregated successfully', playerStats.length, 'players');
      return playerStats;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to aggregate player stats:', error);
      throw new Error(`Failed to load player statistics: ${error.message}`);
    }
  }
}
