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
  teamFouls: number;
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
  fouls: number;
  plusMinus: number; // Simplified to 0 for MVP
}

export class TeamStatsService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /**
   * Get access token from authServiceV2 localStorage
   * NOTE: For public game viewing, we use anon key instead of user tokens
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
   * Make authenticated HTTP request to Supabase REST API (for coach-specific data)
   */
  private static async makeAuthenticatedRequest<T>(
    table: string, 
    params: Record<string, string> = {}
  ): Promise<T[]> {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const accessToken = this.getAccessToken();
    if (!accessToken) {
      // Fallback to public access if no token
      return this.makeRequest<T>(table, params);
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    console.log(`🔐 TeamStatsService: Authenticated HTTP request to ${table}`, { url, params });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`, // ← AUTHENTICATED ACCESS
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TeamStatsService: HTTP ${response.status}:`, errorText);
      const userMessage = this.getUserFriendlyError(response.status, errorText);
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log(`✅ TeamStatsService: Successfully fetched ${data.length} records from ${table} (authenticated)`);
    return data;
  }

  /**
   * Make public HTTP request to Supabase REST API (same pattern as Play by Play feed)
   */
  private static async makeRequest<T>(
    table: string, 
    params: Record<string, string> = {},
    retryCount: number = 0
  ): Promise<T[]> {
    if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

    // ✅ FIX: Use same public access pattern as Play by Play feed
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': this.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`, // ← PUBLIC ACCESS like Play by Play
        'Content-Type': 'application/json'
      }
    });

    // Handle HTTP errors (no auth retry needed for public access)
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ TeamStatsService: HTTP ${response.status}:`, errorText);
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

      // Fetch all game stats for this team (use authenticated for coach games)
      const gameStats = await this.makeAuthenticatedRequest<any>('game_stats', {
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
        // ✅ FIX: For counting shots, always use 1 (each row = 1 attempt)
        // stat_value is points scored (2 or 3), not shot count
        const shotCount = 1;
        const statValue = stat.stat_value || 1;

        switch (statType) {
          case 'field_goal':
          case 'two_pointer':
            if (modifier === 'made') {
              fieldGoalsMade += shotCount; // ✅ Count shots, not points
              fieldGoalsAttempted += shotCount;
            } else if (modifier === 'missed') {
              fieldGoalsAttempted += shotCount;
            }
            break;
          case 'three_pointer':
            if (modifier === 'made') {
              threePointersMade += shotCount; // ✅ Count shots, not points
              threePointersAttempted += shotCount;
              fieldGoalsMade += shotCount; // 3-pointers also count as field goals
              fieldGoalsAttempted += shotCount;
            } else if (modifier === 'missed') {
              threePointersAttempted += shotCount;
              fieldGoalsAttempted += shotCount;
            }
            break;
          case 'free_throw':
            if (modifier === 'made') {
              freeThrowsMade += shotCount; // ✅ Count shots, not points
              freeThrowsAttempted += shotCount;
            } else if (modifier === 'missed') {
              freeThrowsAttempted += shotCount;
            }
            break;
          case 'rebound':
            rebounds += statValue; // Use stat_value for non-shooting stats
            break;
          case 'assist':
            assists += statValue;
            break;
          case 'turnover':
            turnovers += statValue;
            break;
        }
      });

      // Fetch team fouls from games table
      let teamFouls = 0;
      try {
        const gameData = await this.makeAuthenticatedRequest<any>('games', {
          'select': 'team_a_id,team_b_id,team_a_fouls,team_b_fouls',
          'id': `eq.${gameId}`
        });

        if (gameData.length > 0) {
          const game = gameData[0];
          // Determine which team's fouls to use
          if (game.team_a_id === teamId) {
            teamFouls = game.team_a_fouls || 0;
          } else if (game.team_b_id === teamId) {
            teamFouls = game.team_b_fouls || 0;
          }
        }
      } catch (error) {
        console.warn('⚠️ TeamStatsService: Could not fetch team fouls, defaulting to 0:', error);
        teamFouls = 0;
      }

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
        teamFouls,
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
   * Calculate actual player minutes on floor using substitution game clock times
   */
  private static async calculatePlayerMinutes(gameId: string, teamId: string, playerIds: string[]): Promise<Map<string, number>> {
    try {
      console.log('⏱️ TeamStatsService: Calculating actual player minutes from substitution times');

      // Get all substitutions for this game and team
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
        // No substitutions - need to get current game state to calculate realistic minutes
        console.log('📝 TeamStatsService: No substitutions found, calculating from game clock');
        
        try {
          // Get current game state to determine how much time has elapsed (use authenticated for coach games)
          const gameData = await this.makeAuthenticatedRequest<any>('games', {
            'select': 'quarter,game_clock_minutes,game_clock_seconds',
            'id': `eq.${gameId}`
          });

          if (gameData.length > 0) {
            const game = gameData[0];
            const currentQuarter = game.quarter || 1;
            const clockMinutes = game.game_clock_minutes || 12;
            const clockSeconds = game.game_clock_seconds || 0;
            
            // Calculate elapsed time
            // Each quarter is 12 minutes, game clock counts down
            const quarterTimeElapsed = (12 * 60) - (clockMinutes * 60 + clockSeconds); // seconds
            const totalTimeElapsed = ((currentQuarter - 1) * 12 * 60) + quarterTimeElapsed; // seconds
            const minutesElapsed = totalTimeElapsed / 60;
            
            console.log(`📊 TeamStatsService: Game in Q${currentQuarter}, clock ${clockMinutes}:${clockSeconds.toString().padStart(2, '0')}, elapsed: ${minutesElapsed.toFixed(1)} minutes`);
            
            playerIds.forEach((playerId, index) => {
              // Assume first 5 players are starters who have been playing since start
              // Bench players have 0 minutes (no substitutions = no bench time)
              const minutes = index < 5 ? Math.round(minutesElapsed) : 0;
              playerMinutes.set(playerId, minutes);
            });
          } else {
            // Fallback if game data not found
            console.log('⚠️ TeamStatsService: Game data not found, using minimal fallback');
            playerIds.forEach((playerId, index) => {
              const minutes = index < 5 ? 5 : 0; // Minimal fallback
              playerMinutes.set(playerId, minutes);
            });
          }
        } catch (error) {
          console.error('❌ TeamStatsService: Error getting game state:', error);
          // Final fallback
          playerIds.forEach((playerId, index) => {
            const minutes = index < 5 ? 5 : 0; // Conservative fallback
            playerMinutes.set(playerId, minutes);
          });
        }
        
        return playerMinutes;
      }

      // ✅ CORRECT: Calculate actual floor time using game clock timestamps
      for (const playerId of playerIds) {
        let totalMinutes = 0;
        let isOnCourt = false;
        let stintStartTime = 0; // Game clock time when player entered (in seconds)

        // Assume starting 5 (first 5 players) start on court
        const isStarter = playerIds.indexOf(playerId) < 5;
        if (isStarter) {
          isOnCourt = true;
          stintStartTime = 12 * 60; // Start of game (12:00 = 720 seconds)
        }

        // Process substitutions chronologically
        for (const sub of substitutions) {
          const subGameTime = (sub.game_time_minutes * 60) + sub.game_time_seconds;
          
          if (sub.player_in_id === playerId) {
            // Player coming in
            if (!isOnCourt) {
              stintStartTime = subGameTime;
              isOnCourt = true;
              console.log(`🔄 Player ${playerId.substring(0, 8)} SUB IN at ${sub.game_time_minutes}:${sub.game_time_seconds.toString().padStart(2, '0')}`);
            }
          } else if (sub.player_out_id === playerId) {
            // Player going out
            if (isOnCourt) {
              // Calculate minutes played in this stint
              const stintMinutes = (stintStartTime - subGameTime) / 60; // Game clock counts down
              totalMinutes += stintMinutes;
              isOnCourt = false;
              console.log(`🔄 Player ${playerId.substring(0, 8)} SUB OUT at ${sub.game_time_minutes}:${sub.game_time_seconds.toString().padStart(2, '0')}, played ${stintMinutes.toFixed(1)} minutes this stint`);
            }
          }
        }

        // Handle case where player is still on court at end of available data
        if (isOnCourt) {
          // Assume game clock is at 0:00 if player still on court
          const stintMinutes = stintStartTime / 60;
          totalMinutes += stintMinutes;
          console.log(`🔄 Player ${playerId.substring(0, 8)} still on court, played ${stintMinutes.toFixed(1)} minutes in final stint`);
        }

        playerMinutes.set(playerId, Math.round(totalMinutes)); // Whole numbers only
        console.log(`📊 TeamStatsService: Player ${playerId.substring(0, 8)} total minutes: ${totalMinutes.toFixed(1)}`);
      }

      console.log('✅ TeamStatsService: Player minutes calculated successfully');
      return playerMinutes;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to calculate player minutes:', error);
      // Return fallback minutes based on quarters played
      const fallbackMinutes = new Map<string, number>();
      for (const playerId of playerIds) {
        try {
          const playerStats = await this.makeRequest<any>('game_stats', {
            'select': 'quarter',
            'game_id': `eq.${gameId}`,
            'player_id': `eq.${playerId}`
          });
          const quartersPlayed = new Set(playerStats.map((s: any) => s.quarter)).size;
          fallbackMinutes.set(playerId, quartersPlayed * 10);
        } catch {
          fallbackMinutes.set(playerId, 10); // Final fallback
        }
      }
      return fallbackMinutes;
    }
  }

  /**
   * Calculate plus/minus for players (NBA-standard calculation)
   * 
   * CORRECT LOGIC: Plus/minus = team points scored while player is on court − opponent points scored while player is on court
   */
  private static async calculatePlusMinusForPlayers(gameId: string, teamId: string, playerIds: string[]): Promise<Map<string, number>> {
    try {
      console.log('📊 TeamStatsService: Calculating NBA-standard plus/minus');

      const playerPlusMinus = new Map<string, number>();
      
      // Step 1: Get all substitutions to track when players were on court
      const substitutions = await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'order': 'created_at.asc'
      });

      console.log(`📊 TeamStatsService: Found ${substitutions.length} substitutions for plus/minus calculation`);

      // Step 2: Get all scoring events with timestamps
      const allScoringStats = await this.makeRequest<any>('game_stats', {
        'select': 'player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'stat_type': 'in.(field_goal,two_pointer,3_pointer,free_throw)',
        'modifier': 'eq.made',
        'order': 'created_at.asc'
      });

      console.log(`📊 TeamStatsService: Found ${allScoringStats.length} scoring events`);

      // Step 3: Get opponent team ID (use authenticated for coach games)
      const game = await this.makeAuthenticatedRequest<any>('games', {
        'select': 'team_a_id,team_b_id',
        'id': `eq.${gameId}`
      });

      if (game.length === 0) {
        throw new Error('Game not found');
      }

      const opponentTeamId = game[0].team_a_id === teamId ? game[0].team_b_id : game[0].team_a_id;
      console.log(`📊 TeamStatsService: Team ${teamId.substring(0, 8)} vs Opponent ${opponentTeamId.substring(0, 8)}`);

      // Step 4: Build player on-court timeline
      const playerTimeline = new Map<string, Array<{ start: number; end: number | null }>>();
      
      // Initialize all players (assume first 5 are starters)
      playerIds.forEach((playerId, index) => {
        const isStarter = index < 5;
        playerTimeline.set(playerId, isStarter ? [{ start: 0, end: null }] : []);
      });

      // Process substitutions to build timeline
      substitutions.forEach((sub: any) => {
        const subTime = this.convertGameTimeToSeconds(sub.quarter, sub.game_time_minutes, sub.game_time_seconds);
        
        // Player coming in
        if (sub.player_in_id && playerIds.includes(sub.player_in_id)) {
          const timeline = playerTimeline.get(sub.player_in_id) || [];
          timeline.push({ start: subTime, end: null });
          playerTimeline.set(sub.player_in_id, timeline);
        }
        
        // Player going out
        if (sub.player_out_id && playerIds.includes(sub.player_out_id)) {
          const timeline = playerTimeline.get(sub.player_out_id) || [];
          if (timeline.length > 0) {
            const lastStint = timeline[timeline.length - 1];
            if (lastStint.end === null) {
              lastStint.end = subTime;
            }
          }
          playerTimeline.set(sub.player_out_id, timeline);
        }
      });

      // Step 5: Calculate plus/minus for each player
      for (const playerId of playerIds) {
        const timeline = playerTimeline.get(playerId) || [];
        let teamPoints = 0;
        let opponentPoints = 0;

        // For each scoring event, check if player was on court
        allScoringStats.forEach((stat: any) => {
          const statTime = this.convertGameTimeToSeconds(stat.quarter, stat.game_time_minutes, stat.game_time_seconds);
          const points = stat.stat_value || (stat.stat_type === '3_pointer' ? 3 : stat.stat_type === 'free_throw' ? 1 : 2);
          
          // Check if player was on court during this scoring event
          const wasOnCourt = timeline.some(stint => 
            statTime >= stint.start && (stint.end === null || statTime <= stint.end)
          );

          if (wasOnCourt) {
            if (stat.team_id === teamId) {
              teamPoints += points;
            } else if (stat.team_id === opponentTeamId) {
              opponentPoints += points;
            }
          }
        });

        const plusMinus = teamPoints - opponentPoints;
        playerPlusMinus.set(playerId, plusMinus);
        
        console.log(`📊 TeamStatsService: Player ${playerId.substring(0, 8)} +/- = ${teamPoints} (team) - ${opponentPoints} (opp) = ${plusMinus}`);
      }

      console.log('✅ TeamStatsService: NBA-standard plus/minus calculated successfully');
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
   * Helper: Convert game time to seconds for timeline comparison
   */
  private static convertGameTimeToSeconds(quarter: number, minutes: number, seconds: number): number {
    // Convert to total game seconds (game clock counts down, so we invert)
    const quarterStartSeconds = (quarter - 1) * 12 * 60; // Each quarter is 12 minutes
    const timeIntoQuarter = (12 * 60) - (minutes * 60 + seconds); // Invert because clock counts down
    return quarterStartSeconds + timeIntoQuarter;
  }

  /**
   * Aggregate player statistics from game_stats table
   * Handles both regular players (from users table) and custom players (from custom_players table)
   */
  static async aggregatePlayerStats(gameId: string, teamId: string, playerIds: string[]): Promise<PlayerStats[]> {
    try {
      console.log('🏀 TeamStatsService: Aggregating player stats for game:', gameId, 'team:', teamId, 'players:', playerIds.length);

      if (playerIds.length === 0) {
        return [];
      }

      // Fetch all game stats for this team's players (including custom players, use authenticated for coach games)
      const gameStats = await this.makeAuthenticatedRequest<any>('game_stats', {
        'select': 'player_id,custom_player_id,stat_type,stat_value,modifier,quarter',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`
      });

      console.log(`📊 TeamStatsService: Found ${gameStats.length} stats for team`);

      // Fetch regular player names from users table
      const playersResponse = await this.makeRequest<any>('users', {
        'select': 'id,name,email',
        'id': `in.(${playerIds.join(',')})`
      });

      // Fetch custom player names from custom_players table
      let customPlayersResponse: any[] = [];
      try {
        customPlayersResponse = await this.makeAuthenticatedRequest<any>('custom_players', {
          'select': 'id,name,team_id',
          'team_id': `eq.${teamId}`
        });
        console.log(`📊 TeamStatsService: Found ${customPlayersResponse.length} custom players`);
      } catch (error) {
        console.log('⚠️ TeamStatsService: No custom_players table or no custom players found');
      }

      // Build combined players map
      const playersMap = new Map(
        playersResponse.map((p: any) => [
          p.id,
          p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`
        ])
      );

      // Add custom players to map
      customPlayersResponse.forEach((p: any) => {
        playersMap.set(p.id, p.name || `Custom Player ${p.id.substring(0, 8)}`);
      });

      // Build final player list:
      // 1. Start with roster playerIds (to show all players even with 0 stats)
      // 2. Add any additional players from game_stats (in case stats exist for players not in roster)
      const finalPlayerIds = new Set<string>(playerIds);
      
      // Add custom players from the team
      customPlayersResponse.forEach((p: any) => {
        finalPlayerIds.add(p.id);
      });
      
      // ❌ REMOVED: Don't blindly add all players from stats
      // This was including coach user IDs used as proxies for opponent stats
      // Only the roster playerIds and custom players should be shown
      // gameStats.forEach((stat: any) => {
      //   if (stat.player_id) finalPlayerIds.add(stat.player_id);
      //   if (stat.custom_player_id) finalPlayerIds.add(stat.custom_player_id);
      // });

      const finalPlayerIdsArray = Array.from(finalPlayerIds);
      console.log(`📊 TeamStatsService: Processing ${finalPlayerIdsArray.length} total players (roster: ${playerIds.length}, custom: ${customPlayersResponse.length}, from stats: ${gameStats.length > 0 ? 'yes' : 'no'})`);

      // Calculate accurate player minutes from substitutions (use finalPlayerIdsArray to include custom players)
      const playerMinutesMap = await this.calculatePlayerMinutes(gameId, teamId, finalPlayerIdsArray);

      // Calculate plus/minus for players (use finalPlayerIdsArray to include custom players)
      const playerPlusMinusMap = await this.calculatePlusMinusForPlayers(gameId, teamId, finalPlayerIdsArray);

      // Aggregate stats per player
      const playerStatsMap = new Map<string, any>();

      finalPlayerIdsArray.forEach(playerId => {
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
          fouls: 0,
          plusMinus: playerPlusMinusMap.get(playerId) || 0,
          quartersPlayed: new Set()
        });
      });

      // Process each stat (handle both player_id and custom_player_id)
      gameStats.forEach(stat => {
        const playerId = stat.player_id || stat.custom_player_id;
        if (!playerId) return;
        
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
          case 'foul':
            playerStats.fouls += value;
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
          fouls: player.fouls,
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
