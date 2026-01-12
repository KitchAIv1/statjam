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
  isCustomPlayer: boolean; // ✅ Track if player is from custom_players table
  profilePhotoUrl?: string; // ✅ Player photo for UI display
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  plusMinus: number;
  // ✅ NBA-style shooting stats
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
}

/**
 * ✅ OPTIMIZATION: Shared game context to eliminate duplicate queries
 * Fetched ONCE per aggregatePlayerStats call, passed to internal methods
 */
interface GameContext {
  gameId: string;
  teamId: string;
  isCoachGame: boolean;
  quarterLengthMinutes: number;
  quarterLengthSeconds: number;
  periodsPerGame: number;  // ✅ FIX: For completed games full duration calculation
  currentGameState: {
    quarter: number;
    clockMinutes: number;
    clockSeconds: number;
    status?: string;
  };
  teamAId: string | null;
  teamBId: string | null;
  substitutions: any[];
  allGameStats: any[];  // Scoring stats for plus/minus calculation
  playersWithAnyStats: Set<string>;  // ✅ OPTIMIZATION: Player IDs with ANY stat (for DNP detection)
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
   * ✅ OPTIMIZATION: Fetch game context ONCE for reuse across internal methods
   * Eliminates 6x duplicate games queries, 3x substitutions queries, 2x game_stats queries
   */
  private static async fetchGameContext(gameId: string, teamId: string): Promise<GameContext> {
    console.log('🚀 TeamStatsService: Fetching game context (OPTIMIZED - single fetch)');
    
    // ✅ PARALLEL FETCH: Get all shared data in one round-trip
    const [gameData, substitutions, scoringStats, allTeamStats] = await Promise.all([
      // Game data with all needed fields (including periods_per_game for completed games)
      this.makeAuthenticatedRequest<any>('games', {
        'select': 'id,is_coach_game,quarter_length_minutes,quarter,game_clock_minutes,game_clock_seconds,status,team_a_id,team_b_id,tournament_id,periods_per_game,tournaments(ruleset,ruleset_config)',
        'id': `eq.${gameId}`
      }),
      // All substitutions for this team
      this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,custom_player_in_id,custom_player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'order': 'created_at.asc'
      }),
      // Scoring stats for plus/minus calculation
      this.makeAuthenticatedRequest<any>('game_stats', {
        'select': 'player_id,custom_player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,is_opponent_stat',
        'game_id': `eq.${gameId}`,
        'stat_type': 'in.(field_goal,two_pointer,three_pointer,3_pointer,free_throw)',
        'modifier': 'eq.made',
        'order': 'quarter.asc,game_time_minutes.desc,game_time_seconds.desc'
      }),
      // ✅ OPTIMIZATION: Lightweight query for DNP detection (just player IDs)
      // ✅ FIX: Use authenticated request for coach games (RLS requires auth)
      this.makeAuthenticatedRequest<any>('game_stats', {
        'select': 'player_id,custom_player_id',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`
      })
    ]);
    
    // ✅ Build Set of player IDs who have ANY stat (for DNP detection)
    const playersWithAnyStats = new Set<string>();
    for (const stat of allTeamStats) {
      const pid = stat.player_id || stat.custom_player_id;
      if (pid) playersWithAnyStats.add(pid);
    }
    console.log(`📊 TeamStatsService: Found ${playersWithAnyStats.size} players with stats (DNP detection)`);

    const game = gameData[0] || {};
    const isCoachGame = game.is_coach_game === true;
    
    // Determine quarter length
    let quarterLengthMinutes = 12; // Default
    if (isCoachGame) {
      quarterLengthMinutes = game.quarter_length_minutes > 0 ? game.quarter_length_minutes : 8;
    } else if (game.quarter_length_minutes > 0) {
      quarterLengthMinutes = game.quarter_length_minutes;
    } else if (game.tournaments?.ruleset_config?.clockRules?.quarterLengthMinutes) {
      quarterLengthMinutes = game.tournaments.ruleset_config.clockRules.quarterLengthMinutes;
    } else if (game.tournaments?.ruleset === 'FIBA') {
      quarterLengthMinutes = 10;
    } else if (game.tournaments?.ruleset === 'NCAA') {
      quarterLengthMinutes = 20;
    }

    const periodsPerGame = game.periods_per_game || 4;  // Default 4 quarters
    
    const context: GameContext = {
      gameId,
      teamId,
      isCoachGame,
      quarterLengthMinutes,
      quarterLengthSeconds: quarterLengthMinutes * 60,
      periodsPerGame,  // ✅ FIX: For completed games full duration calculation
      currentGameState: {
        quarter: game.quarter || 1,
        clockMinutes: game.game_clock_minutes ?? quarterLengthMinutes,
        clockSeconds: game.game_clock_seconds ?? 0,
        status: game.status
      },
      teamAId: game.team_a_id || null,
      teamBId: game.team_b_id || null,
      substitutions,
      allGameStats: scoringStats,
      playersWithAnyStats  // ✅ OPTIMIZATION: Pre-computed for DNP detection
    };

    console.log(`✅ TeamStatsService: Game context fetched - ${isCoachGame ? 'Coach' : 'Tournament'} game, ${quarterLengthMinutes}min quarters, ${substitutions.length} subs, ${scoringStats.length} scoring events, ${playersWithAnyStats.size} players with stats`);
    return context;
  }

  /**
   * Aggregate team statistics from game_stats table
   */
  static async aggregateTeamStats(gameId: string, teamId: string): Promise<TeamStats> {
    try {
      console.log('🏀 TeamStatsService: Aggregating team stats for game:', gameId, 'team:', teamId);

      // ✅ First check if this is a coach game and if we're fetching opponent (team_b) stats
      const gameData = await this.makeAuthenticatedRequest<any>('games', {
        'select': 'is_coach_game,team_a_id,team_b_id,team_a_fouls,team_b_fouls',
        'id': `eq.${gameId}`
      });
      
      const game = gameData[0];
      const isCoachGame = game?.is_coach_game === true;
      const isOpponentTeam = isCoachGame && game?.team_b_id === teamId;

      let gameStats;
      if (isOpponentTeam) {
        // ✅ Coach mode opponent: Fetch stats where is_opponent_stat = true
        console.log('📊 TeamStatsService: Fetching opponent stats (is_opponent_stat = true)');
        gameStats = await this.makeAuthenticatedRequest<any>('game_stats', {
          'select': 'stat_type,stat_value,modifier,quarter',
          'game_id': `eq.${gameId}`,
          'is_opponent_stat': 'eq.true'
        });
      } else {
        // ✅ Normal mode or coach mode team: Fetch team stats excluding opponent
        gameStats = await this.makeAuthenticatedRequest<any>('game_stats', {
          'select': 'stat_type,stat_value,modifier,quarter',
          'game_id': `eq.${gameId}`,
          'team_id': `eq.${teamId}`,
          'is_opponent_stat': 'eq.false'
        });
      }

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
      let totalFouls = 0; // ✅ FIX: Aggregate from game_stats, not games table

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
          case 'foul':
            // ✅ FIX: Aggregate ALL fouls from game_stats (not just current quarter from games table)
            totalFouls += statValue;
            break;
        }
      });

      // ✅ FIX: Use aggregated fouls from game_stats (totalFouls) instead of games table
      // games.team_a_fouls/team_b_fouls only tracks CURRENT QUARTER fouls for bonus tracking
      const teamFouls = totalFouls;

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
   * Get quarter length from game's stored setting or tournament ruleset
   * ✅ Priority 1: quarter_length_minutes (preserved original setting)
   * ✅ Priority 2: Tournament ruleset config
   * ✅ Priority 3: Standard ruleset defaults (NBA=12, FIBA=10, NCAA=20)
   * 
   * ✅ FIX (Dec 2024): Coach games use simple query without tournament JOIN
   * to avoid NULL tournament issues causing fallback to 12 min
   */
  private static async getQuarterLengthMinutes(gameId: string): Promise<number> {
    try {
      // ✅ STEP 1: Simple query to check if coach game and get quarter_length_minutes
      // This avoids tournament JOIN issues for coach games (dummy tournament has NULL ruleset)
      const basicGameData = await this.makeRequest<any>('games', {
        'select': 'is_coach_game,quarter_length_minutes',
        'id': `eq.${gameId}`
      });

      if (basicGameData.length > 0) {
        const basicGame = basicGameData[0];
        
        // ✅ COACH GAME PATH: Direct access to quarter_length_minutes (no tournament JOIN)
        if (basicGame.is_coach_game === true) {
          if (basicGame.quarter_length_minutes && basicGame.quarter_length_minutes > 0) {
            console.log(`📊 TeamStatsService: Coach game, using quarter_length_minutes: ${basicGame.quarter_length_minutes} min`);
            return basicGame.quarter_length_minutes;
          }
          // Coach game without setting - default to 8 min (Youth/Rec default)
          console.log('📊 TeamStatsService: Coach game without quarter_length_minutes, defaulting to 8 min');
          return 8;
        }
        
        // ✅ TOURNAMENT GAME PATH: Check quarter_length_minutes first (Priority 1)
        if (basicGame.quarter_length_minutes && basicGame.quarter_length_minutes > 0) {
          console.log(`📊 TeamStatsService: Using quarter_length_minutes: ${basicGame.quarter_length_minutes} min`);
          return basicGame.quarter_length_minutes;
        }
      }

      // ✅ STEP 2: For tournament games without quarter_length_minutes, fetch ruleset
      const gameData = await this.makeAuthenticatedRequest<any>('games', {
        'select': 'tournament_id,tournaments(ruleset,ruleset_config)',
        'id': `eq.${gameId}`
      });

      if (gameData.length > 0) {
        const game = gameData[0];
        
        if (game.tournaments) {
          const ruleset = game.tournaments.ruleset || 'NBA';
          const rulesetConfig = game.tournaments.ruleset_config || {};
          
          // ✅ Priority 2: Custom ruleset override
          if (rulesetConfig?.clockRules?.quarterLengthMinutes) {
            console.log(`📊 TeamStatsService: Using ruleset_config: ${rulesetConfig.clockRules.quarterLengthMinutes} min`);
            return rulesetConfig.clockRules.quarterLengthMinutes;
          }
          
          // ✅ Priority 3: Standard ruleset defaults
          switch (ruleset) {
            case 'FIBA': 
              console.log('📊 TeamStatsService: Using FIBA default: 10 min');
              return 10;
            case 'NCAA': 
              console.log('📊 TeamStatsService: Using NCAA default: 20 min');
              return 20;
            case 'NBA':
            default: 
              console.log('📊 TeamStatsService: Using NBA default: 12 min');
              return 12;
          }
        }
        
        // Fallback
        console.log('📊 TeamStatsService: No tournament, defaulting to 12 min');
        return 12;
      }
      
      return 12; // Default fallback
    } catch (error) {
      console.warn('⚠️ TeamStatsService: Could not fetch quarter length, defaulting to 12');
      return 12;
    }
  }

  /**
   * Calculate stint duration in seconds (handles cross-quarter stints correctly)
   */
  private static calculateStintSeconds(
    startQuarter: number,
    startGameClock: number,  // seconds remaining when stint started
    endQuarter: number,
    endGameClock: number,    // seconds remaining when stint ended
    quarterLengthSeconds: number
  ): number {
    if (startQuarter === endQuarter) {
      // Same quarter: simple subtraction (clock counts down)
      return Math.max(0, startGameClock - endGameClock);
    }
    
    // Cross-quarter calculation:
    // 1. Time remaining in start quarter (from stint start to end of quarter)
    const startQuarterTime = startGameClock;
    
    // 2. Full quarters between start and end
    const fullQuarters = Math.max(0, endQuarter - startQuarter - 1);
    const fullQuartersTime = fullQuarters * quarterLengthSeconds;
    
    // 3. Time elapsed in end quarter (from start of quarter to current clock)
    const endQuarterTime = quarterLengthSeconds - endGameClock;
    
    return startQuarterTime + fullQuartersTime + endQuarterTime;
  }

  /**
   * Calculate actual player minutes on floor using substitution game clock times
   * ✅ FIX: Now uses dynamic quarter length and handles cross-quarter stints
   * ✅ OPTIMIZATION: Accepts optional context to avoid duplicate queries
   */
  private static async calculatePlayerMinutes(
    gameId: string, 
    teamId: string, 
    playerIds: string[],
    context?: GameContext  // ✅ OPTIMIZATION: Optional pre-fetched context
  ): Promise<Map<string, number>> {
    try {
      console.log('⏱️ TeamStatsService: Calculating actual player minutes from substitution times');

      // ✅ OPTIMIZATION: Use context if provided, otherwise fetch
      const quarterLengthMinutes = context?.quarterLengthMinutes ?? await this.getQuarterLengthMinutes(gameId);
      const quarterLengthSeconds = quarterLengthMinutes * 60;
      console.log(`📊 TeamStatsService: Using quarter length: ${quarterLengthMinutes} minutes ${context ? '(from context)' : '(fetched)'}`);

      // ✅ OPTIMIZATION: Use context substitutions if provided
      const substitutions = context?.substitutions ?? await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,custom_player_in_id,custom_player_out_id,quarter,game_time_minutes,game_time_seconds,created_at',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'order': 'created_at.asc'
      });

      console.log(`📊 TeamStatsService: Found ${substitutions.length} substitutions for minutes calculation`);

      const playerMinutes = new Map<string, number>();
      playerIds.forEach(playerId => playerMinutes.set(playerId, 0));

      // ✅ OPTIMIZATION: Use context game state if provided
      let currentGameState = context?.currentGameState ?? { quarter: 1, clockMinutes: quarterLengthMinutes, clockSeconds: 0 };
      if (!context) {
        try {
          const gameData = await this.makeAuthenticatedRequest<any>('games', {
            'select': 'quarter,game_clock_minutes,game_clock_seconds,status',
            'id': `eq.${gameId}`
          });
          if (gameData.length > 0) {
            currentGameState = {
              quarter: gameData[0].quarter || 1,
              clockMinutes: gameData[0].game_clock_minutes ?? quarterLengthMinutes,
              clockSeconds: gameData[0].game_clock_seconds ?? 0
            };
          }
        } catch (e) {
          console.warn('⚠️ Could not fetch current game state for minutes calculation');
        }
      }

      if (substitutions.length === 0) {
        // No substitutions - calculate from current game clock
        // ✅ v1.2.0: Check stats to determine who played (not array index)
        console.log('📝 TeamStatsService: No substitutions found, calculating from game clock');
        
        const { quarter, clockMinutes, clockSeconds } = currentGameState;
        
        // Calculate elapsed time using dynamic quarter length
        const quarterTimeElapsed = quarterLengthSeconds - (clockMinutes * 60 + clockSeconds);
        const totalTimeElapsed = ((quarter - 1) * quarterLengthSeconds) + quarterTimeElapsed;
        const minutesElapsed = totalTimeElapsed / 60;
        
        console.log(`📊 TeamStatsService: Q${quarter}, clock ${clockMinutes}:${clockSeconds.toString().padStart(2, '0')}, elapsed: ${minutesElapsed.toFixed(1)} min`);
        
        // Fetch stats to determine who actually played
        let playersWithStats = new Set<string>();
        try {
          const gameStats = await this.makeRequest<any>('game_stats', {
            'select': 'player_id,custom_player_id',
            'game_id': `eq.${gameId}`,
            'team_id': `eq.${teamId}`
          });
          for (const stat of gameStats) {
            const pid = stat.player_id || stat.custom_player_id;
            if (pid) playersWithStats.add(pid);
          }
        } catch (e) {
          console.warn('⚠️ Could not fetch game stats for no-sub minutes calculation');
        }
        
        playerIds.forEach((playerId) => {
          // Only players who have stats = actually played
          const minutes = playersWithStats.has(playerId) ? Math.round(minutesElapsed) : 0;
          playerMinutes.set(playerId, minutes);
        });
        
        return playerMinutes;
      }

      // ✅ FIX: Infer starters from substitution data
      // If a player's first action is "OUT", they started the game
      const inferredStarters = new Set<string>();
      const playerFirstAction = new Map<string, 'IN' | 'OUT'>();
      const playersInSubs = new Set<string>(); // Track all players who appear in any sub
      
      for (const sub of substitutions) {
        const playerInId = sub.player_in_id || sub.custom_player_in_id;
        const playerOutId = sub.player_out_id || sub.custom_player_out_id;
        
        // Track all players who appear in substitutions
        if (playerInId) playersInSubs.add(playerInId);
        if (playerOutId) playersInSubs.add(playerOutId);
        
        // Record first action for each player (only if not already recorded)
        if (playerOutId && !playerFirstAction.has(playerOutId)) {
          playerFirstAction.set(playerOutId, 'OUT');
          inferredStarters.add(playerOutId); // First action is OUT = they started
        }
        if (playerInId && !playerFirstAction.has(playerInId)) {
          playerFirstAction.set(playerInId, 'IN');
          // First action is IN = they did NOT start (came off bench)
        }
      }
      
      // ✅ FIX v2: Players who NEVER appear in substitutions need stat check
      // Only count as "played full game" if they have at least 1 game stat action
      // DNP bench players (no subs + no stats) = 0 minutes
      // ✅ OPTIMIZATION: Use pre-fetched playersWithAnyStats from context if available
      let playersWithStats: Set<string>;
      if (context?.playersWithAnyStats) {
        playersWithStats = context.playersWithAnyStats;
        console.log(`📊 TeamStatsService: Using ${playersWithStats.size} players from context (DNP detection optimized)`);
      } else {
        // Fallback: fetch if no context (backward compatibility)
        playersWithStats = new Set<string>();
        try {
          const gameStats = await this.makeRequest<any>('game_stats', {
            'select': 'player_id,custom_player_id',
            'game_id': `eq.${gameId}`,
            'team_id': `eq.${teamId}`
          });
          for (const stat of gameStats) {
            const pid = stat.player_id || stat.custom_player_id;
            if (pid) playersWithStats.add(pid);
          }
        } catch (e) {
          console.warn('⚠️ Could not fetch game stats for DNP detection');
        }
      }
      
      // ✅ v1.2.0 FIX: Only use stats to determine if player played (not array index)
      playerIds.forEach((playerId) => {
        if (!playersInSubs.has(playerId)) {
          // Never appeared in substitutions - only count as starter if they have stats
          if (playersWithStats.has(playerId)) {
            // Has stats but no subs = starter who played full game
            inferredStarters.add(playerId);
          }
          // No subs + no stats = DNP (0 minutes)
        }
      });
      
      console.log(`📊 TeamStatsService: Inferred ${inferredStarters.size} starters from substitution data`);

      // ✅ FIX: Calculate floor time with quarter-aware logic
      for (const playerId of playerIds) {
        let totalSeconds = 0;
        let isOnCourt = false;
        let stintStartQuarter = 1;
        let stintStartGameClock = quarterLengthSeconds; // Game clock when stint started

        // ✅ FIX: Use inferred starters instead of array position
        const isStarter = inferredStarters.has(playerId);
        if (isStarter) {
          isOnCourt = true;
          stintStartQuarter = 1;
          stintStartGameClock = quarterLengthSeconds;
        }

        // Process substitutions chronologically
        for (const sub of substitutions) {
          const subQuarter = sub.quarter || 1;
          const subGameClock = (sub.game_time_minutes * 60) + sub.game_time_seconds;
          
          const playerInId = sub.player_in_id || sub.custom_player_in_id;
          const playerOutId = sub.player_out_id || sub.custom_player_out_id;
          
          if (playerInId === playerId && !isOnCourt) {
            // Player coming in
            stintStartQuarter = subQuarter;
            stintStartGameClock = subGameClock;
            isOnCourt = true;
          } else if (playerOutId === playerId && isOnCourt) {
            // Player going out - calculate this stint
            const stintSeconds = this.calculateStintSeconds(
              stintStartQuarter, stintStartGameClock,
              subQuarter, subGameClock,
              quarterLengthSeconds
            );
            totalSeconds += stintSeconds;
            isOnCourt = false;
          }
        }

        // ✅ FIX: Handle player still on court using CURRENT game state
        if (isOnCourt) {
          const currentClock = currentGameState.clockMinutes * 60 + currentGameState.clockSeconds;
          const stintSeconds = this.calculateStintSeconds(
            stintStartQuarter, stintStartGameClock,
            currentGameState.quarter, currentClock,
            quarterLengthSeconds
          );
          totalSeconds += stintSeconds;
        }

        // ✅ v1.2.0: Ensure players who played show at least 1 minute (not 0 due to rounding)
        // DNP players (0 seconds) still show 0 minutes
        const totalMinutes = totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0;
        playerMinutes.set(playerId, totalMinutes);
      }

      console.log('✅ TeamStatsService: Player minutes calculated successfully');
      return playerMinutes;

    } catch (error: any) {
      console.error('❌ TeamStatsService: Failed to calculate player minutes:', error);
      // Fallback: 0 minutes for all
      const fallbackMinutes = new Map<string, number>();
      playerIds.forEach(playerId => fallbackMinutes.set(playerId, 0));
      return fallbackMinutes;
    }
  }

  /**
   * Calculate plus/minus for players (NBA-standard calculation)
   * 
   * CORRECT LOGIC: Plus/minus = team points scored while player is on court − opponent points scored while player is on court
   * 
   * ✅ v1.1.0 (Nov 27, 2025): 
   * - Dynamic quarter length support (NBA/FIBA/NCAA/CUSTOM)
   * - Coach Mode is_opponent_stat support
   * - Game time ordering (not created_at)
   * - Current game state cap for ongoing games
   * ✅ OPTIMIZATION: Accepts optional context to avoid duplicate queries
   */
  private static async calculatePlusMinusForPlayers(
    gameId: string, 
    teamId: string, 
    playerIds: string[],
    context?: GameContext  // ✅ OPTIMIZATION: Optional pre-fetched context
  ): Promise<Map<string, number>> {
    try {
      console.log('📊 TeamStatsService: Calculating NBA-standard plus/minus (v1.1.0)');

      const playerPlusMinus = new Map<string, number>();
      
      // ✅ OPTIMIZATION: Use context if provided
      const quarterLengthMinutes = context?.quarterLengthMinutes ?? await this.getQuarterLengthMinutes(gameId);
      const quarterLengthSeconds = quarterLengthMinutes * 60;
      console.log(`📊 Plus/Minus: Using ${quarterLengthMinutes}-min quarters ${context ? '(from context)' : '(fetched)'}`);

      // ✅ OPTIMIZATION: Use context game state if provided
      // ✅ FIX: For completed games, use full game duration (clock data may be stale)
      let currentGameTimeSeconds = Infinity;
      if (context) {
        const { quarter, clockMinutes, clockSeconds, status } = context.currentGameState;
        
        if (status === 'completed') {
          // Completed games: use full game duration regardless of clock values
          // Clock data may be stale (e.g., showing Q1 6:47 for a finished game)
          currentGameTimeSeconds = context.periodsPerGame * quarterLengthSeconds;
          console.log(`📊 Plus/Minus: Current game time = ${currentGameTimeSeconds}s (COMPLETED - full ${context.periodsPerGame} periods × ${quarterLengthMinutes}min)`);
        } else {
          // Live/in-progress games: calculate from current clock
          currentGameTimeSeconds = this.convertGameTimeToSecondsWithLength(
            quarter, clockMinutes, clockSeconds, quarterLengthSeconds
          );
          console.log(`📊 Plus/Minus: Current game time = ${currentGameTimeSeconds}s (from context)`);
        }
      } else {
        try {
          const gameState = await this.makeAuthenticatedRequest<any>('games', {
            'select': 'quarter,game_clock_minutes,game_clock_seconds,status,team_a_id,team_b_id,is_coach_game',
            'id': `eq.${gameId}`
          });
          if (gameState.length > 0) {
            const g = gameState[0];
            const currentQuarter = g.quarter || 1;
            const clockMinutes = g.game_clock_minutes ?? quarterLengthMinutes;
            const clockSeconds = g.game_clock_seconds ?? 0;
            currentGameTimeSeconds = this.convertGameTimeToSecondsWithLength(
              currentQuarter, clockMinutes, clockSeconds, quarterLengthSeconds
            );
            console.log(`📊 Plus/Minus: Current game time = ${currentGameTimeSeconds}s (Q${currentQuarter} ${clockMinutes}:${clockSeconds.toString().padStart(2, '0')})`);
          }
        } catch (e) {
          console.warn('⚠️ Plus/Minus: Could not fetch current game state');
        }
      }
      
      // ✅ OPTIMIZATION: Use context substitutions if provided
      const substitutions = context?.substitutions ?? await this.makeRequest<any>('game_substitutions', {
        'select': 'player_in_id,player_out_id,custom_player_in_id,custom_player_out_id,quarter,game_time_minutes,game_time_seconds',
        'game_id': `eq.${gameId}`,
        'order': 'quarter.asc,game_time_minutes.desc,game_time_seconds.desc'
      });

      console.log(`📊 Plus/Minus: Found ${substitutions.length} substitutions`);

      // ✅ OPTIMIZATION: Use context scoring stats if provided
      const allScoringStats = context?.allGameStats ?? await this.makeAuthenticatedRequest<any>('game_stats', {
        'select': 'player_id,team_id,stat_type,stat_value,modifier,quarter,game_time_minutes,game_time_seconds,is_opponent_stat',
        'game_id': `eq.${gameId}`,
        'stat_type': 'in.(field_goal,two_pointer,three_pointer,3_pointer,free_throw)',
        'modifier': 'eq.made',
        'order': 'quarter.asc,game_time_minutes.desc,game_time_seconds.desc'
      });

      console.log(`📊 Plus/Minus: Found ${allScoringStats.length} scoring events`);

      // ✅ OPTIMIZATION: Use context team IDs if provided
      const isCoachGame = context?.isCoachGame ?? false;
      const teamAId = context?.teamAId;
      const teamBId = context?.teamBId;
      
      // Only fetch game if we don't have context
      if (!context) {
        const game = await this.makeAuthenticatedRequest<any>('games', {
          'select': 'team_a_id,team_b_id,is_coach_game',
          'id': `eq.${gameId}`
        });

        // ✅ Graceful fallback: If RLS blocks game fetch (admin viewing other coach's game),
        // return 0 plus/minus for all players instead of throwing error
        if (game.length === 0) {
          console.warn('⚠️ TeamStatsService: Could not fetch game for plus/minus (RLS), returning 0 for all players');
          const fallbackMap = new Map<string, number>();
          playerIds.forEach(playerId => fallbackMap.set(playerId, 0));
          return fallbackMap;
        }
      }

      const opponentTeamId = teamAId === teamId ? teamBId : teamAId;
      console.log(`📊 Plus/Minus: Team ${teamId.substring(0, 8)} vs Opponent ${opponentTeamId?.substring(0, 8) || 'N/A'} (Coach Mode: ${isCoachGame})`);

      // ✅ Step 6: Build player on-court timeline with quarter-aware seconds
      // ✅ v1.2.0 (Dec 30, 2025): Fixed starter detection & duplicate sub handling
      
      // Sort substitutions by game time (not created_at) to handle retroactive entries
      const sortedSubs = [...substitutions].sort((a: any, b: any) => {
        const aTime = this.convertGameTimeToSecondsWithLength(
          a.quarter, a.game_time_minutes, a.game_time_seconds, quarterLengthSeconds
        );
        const bTime = this.convertGameTimeToSecondsWithLength(
          b.quarter, b.game_time_minutes, b.game_time_seconds, quarterLengthSeconds
        );
        return aTime - bTime;
      });

      // ✅ FIX 1: Detect actual starters from substitution data
      // Starters = players whose FIRST sub action is OUT (they were on court from the start)
      const starterIds = new Set<string>();
      const playerFirstAction = new Map<string, 'in' | 'out'>();
      
      sortedSubs.forEach((sub: any) => {
        const playerInId = sub.player_in_id || sub.custom_player_in_id;
        const playerOutId = sub.player_out_id || sub.custom_player_out_id;
        
        // First action is OUT = starter (was on court from beginning)
        if (playerOutId && playerIds.includes(playerOutId) && !playerFirstAction.has(playerOutId)) {
          playerFirstAction.set(playerOutId, 'out');
          starterIds.add(playerOutId);
        }
        // First action is IN = bench player (came off bench)
        if (playerInId && playerIds.includes(playerInId) && !playerFirstAction.has(playerInId)) {
          playerFirstAction.set(playerInId, 'in');
        }
      });

      // Players with NO subs who have ANY stat = starters who played full game
      // Players with NO subs and NO stats = DNP (Did Not Play)
      // ✅ FIX: Use playersWithAnyStats (not just scoring) - same as minutes calculation
      playerIds.forEach(playerId => {
        if (!playerFirstAction.has(playerId)) {
          // Check if player has ANY stat (rebounds, assists, etc.) not just scoring
          const playerPlayed = context?.playersWithAnyStats?.has(playerId) || 
            allScoringStats.some((stat: any) => stat.player_id === playerId || stat.custom_player_id === playerId);
          if (playerPlayed) {
            starterIds.add(playerId); // Has stats but no subs = played full game as starter
          }
          // Else: DNP - don't add to starters
        }
      });

      console.log(`📊 Plus/Minus: Detected ${starterIds.size} starters from sub data`);

      // ✅ FIX 2: Initialize timeline based on actual starters (not array index)
      const playerTimeline = new Map<string, Array<{ start: number; end: number | null }>>();
      const currentlyOnCourt = new Set<string>(); // Track actual on-court state
      
      playerIds.forEach(playerId => {
        if (starterIds.has(playerId)) {
          playerTimeline.set(playerId, [{ start: 0, end: null }]);
          currentlyOnCourt.add(playerId);
        } else {
          playerTimeline.set(playerId, []);
        }
      });

      // ✅ FIX 3: Process substitutions with state validation (prevent duplicates)
      sortedSubs.forEach((sub: any) => {
        const subTime = this.convertGameTimeToSecondsWithLength(
          sub.quarter, sub.game_time_minutes, sub.game_time_seconds, quarterLengthSeconds
        );
        
        // ✅ CUSTOM PLAYER SUPPORT: Check both regular and custom player IDs
        const playerInId = sub.player_in_id || sub.custom_player_in_id;
        const playerOutId = sub.player_out_id || sub.custom_player_out_id;
        
        // Player going out - only if they're actually on court (prevents duplicate OUTs)
        if (playerOutId && playerIds.includes(playerOutId) && currentlyOnCourt.has(playerOutId)) {
          const timeline = playerTimeline.get(playerOutId)!;
          const lastStint = timeline[timeline.length - 1];
          if (lastStint && lastStint.end === null) {
            lastStint.end = subTime;
          }
          currentlyOnCourt.delete(playerOutId);
        }
        
        // Player coming in - only if they're NOT already on court (prevents duplicate INs)
        if (playerInId && playerIds.includes(playerInId) && !currentlyOnCourt.has(playerInId)) {
          const timeline = playerTimeline.get(playerInId)!;
          timeline.push({ start: subTime, end: null });
          currentlyOnCourt.add(playerInId);
        }
      });

      // ✅ Step 7: Calculate plus/minus for each player
      for (const playerId of playerIds) {
        const timeline = playerTimeline.get(playerId) || [];
        let teamPoints = 0;
        let opponentPoints = 0;

        // For each scoring event, check if player was on court
        allScoringStats.forEach((stat: any) => {
          const statTime = this.convertGameTimeToSecondsWithLength(
            stat.quarter, stat.game_time_minutes, stat.game_time_seconds, quarterLengthSeconds
          );
          
          // ✅ Cap to current game time (don't count future events for ongoing games)
          if (statTime > currentGameTimeSeconds) return;
          
          // Determine point value
          const statType = stat.stat_type;
          let points = stat.stat_value;
          if (!points) {
            if (statType === '3_pointer' || statType === 'three_pointer') {
              points = 3;
            } else if (statType === 'free_throw') {
              points = 1;
            } else {
              points = 2; // field_goal, two_pointer
            }
          }
          
          // Check if player was on court during this scoring event
          // ✅ Cap stint.end to current game time for "still on court" players
          const wasOnCourt = timeline.some(stint => {
            const stintEnd = stint.end === null ? currentGameTimeSeconds : stint.end;
            return statTime >= stint.start && statTime <= stintEnd;
          });

          if (wasOnCourt) {
            // ✅ Coach Mode: is_opponent_stat means opponent scored (count against team)
            if (isCoachGame && stat.is_opponent_stat === true) {
              opponentPoints += points;
            } else if (stat.team_id === teamId) {
              teamPoints += points;
            } else if (stat.team_id === opponentTeamId) {
              opponentPoints += points;
            }
          }
        });

        const plusMinus = teamPoints - opponentPoints;
        playerPlusMinus.set(playerId, plusMinus);
        
        console.log(`📊 Plus/Minus: ${playerId.substring(0, 8)} = ${teamPoints} (team) - ${opponentPoints} (opp) = ${plusMinus > 0 ? '+' : ''}${plusMinus}`);
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
   * Helper: Convert game time to total elapsed seconds (dynamic quarter length)
   * 
   * Game clock counts down, so we invert to get elapsed time from game start.
   * Example (12-min quarters): Q2 at 8:00 remaining = 12 + 4 = 16 minutes elapsed
   */
  private static convertGameTimeToSecondsWithLength(
    quarter: number, 
    minutes: number, 
    seconds: number, 
    quarterLengthSeconds: number
  ): number {
    // Time elapsed in previous quarters
    const previousQuartersSeconds = (quarter - 1) * quarterLengthSeconds;
    // Time elapsed in current quarter (invert because clock counts down)
    const currentQuarterElapsed = quarterLengthSeconds - (minutes * 60 + seconds);
    return previousQuartersSeconds + currentQuarterElapsed;
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
      // ✅ FIX: Exclude opponent stats (is_opponent_stat = false) for correct player totals
      const gameStats = await this.makeAuthenticatedRequest<any>('game_stats', {
        'select': 'player_id,custom_player_id,stat_type,stat_value,modifier,quarter',
        'game_id': `eq.${gameId}`,
        'team_id': `eq.${teamId}`,
        'is_opponent_stat': 'eq.false'
      });

      console.log(`📊 TeamStatsService: Found ${gameStats.length} stats for team`);

      // Fetch regular player names and photos from users table
      const playersResponse = await this.makeRequest<any>('users', {
        'select': 'id,name,email,profile_photo_url',
        'id': `in.(${playerIds.join(',')})`
      });

      // Fetch custom player names and photos from custom_players table
      let customPlayersResponse: any[] = [];
      try {
        customPlayersResponse = await this.makeAuthenticatedRequest<any>('custom_players', {
          'select': 'id,name,team_id,profile_photo_url',
          'team_id': `eq.${teamId}`
        });
        console.log(`📊 TeamStatsService: Found ${customPlayersResponse.length} custom players`);
      } catch (error) {
        console.log('⚠️ TeamStatsService: No custom_players table or no custom players found');
      }

      // Build combined players map (name) and photos map
      const playersMap = new Map(
        playersResponse.map((p: any) => [
          p.id,
          p.name || p.email?.split('@')[0] || `Player ${p.id.substring(0, 8)}`
        ])
      );
      const playerPhotosMap = new Map<string, string | undefined>(
        playersResponse.map((p: any) => [p.id, p.profile_photo_url])
      );

      // Add custom players to map and track their IDs
      const customPlayerIds = new Set<string>();
      customPlayersResponse.forEach((p: any) => {
        playersMap.set(p.id, p.name || `Custom Player ${p.id.substring(0, 8)}`);
        playerPhotosMap.set(p.id, p.profile_photo_url);
        customPlayerIds.add(p.id);
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

      // ✅ OPTIMIZATION: Fetch game context ONCE, pass to internal methods
      // This eliminates 6x duplicate games queries, 3x substitutions queries
      const gameContext = await this.fetchGameContext(gameId, teamId);

      // ✅ OPTIMIZATION: Pass context to avoid redundant fetches
      // Calculate accurate player minutes from substitutions (use finalPlayerIdsArray to include custom players)
      const playerMinutesMap = await this.calculatePlayerMinutes(gameId, teamId, finalPlayerIdsArray, gameContext);

      // Calculate plus/minus for players (use finalPlayerIdsArray to include custom players)
      const playerPlusMinusMap = await this.calculatePlusMinusForPlayers(gameId, teamId, finalPlayerIdsArray, gameContext);

      // Aggregate stats per player
      const playerStatsMap = new Map<string, any>();

      finalPlayerIdsArray.forEach(playerId => {
        playerStatsMap.set(playerId, {
          playerId,
          playerName: playersMap.get(playerId) || `Player ${playerId.substring(0, 8)}`,
          isCustomPlayer: customPlayerIds.has(playerId), // ✅ Track custom player status
          profilePhotoUrl: playerPhotosMap.get(playerId), // ✅ Include player photo
          minutes: playerMinutesMap.get(playerId) || 0,
          points: 0,
          rebounds: 0,
          assists: 0,
          steals: 0,
          blocks: 0,
          turnovers: 0,
          fouls: 0,
          plusMinus: playerPlusMinusMap.get(playerId) || 0,
          quartersPlayed: new Set(),
          // ✅ NBA-style shooting stats
          fieldGoalsMade: 0,
          fieldGoalsAttempted: 0,
          threePointersMade: 0,
          threePointersAttempted: 0,
          freeThrowsMade: 0,
          freeThrowsAttempted: 0
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
            // FG includes 2PT (and historically field_goal)
            playerStats.fieldGoalsAttempted += 1;
            if (modifier === 'made') {
              playerStats.points += 2;
              playerStats.fieldGoalsMade += 1;
            }
            break;
          case 'three_pointer':
            // 3PT counts as both 3PT and FG attempted
            playerStats.threePointersAttempted += 1;
            playerStats.fieldGoalsAttempted += 1;
            if (modifier === 'made') {
              playerStats.points += 3;
              playerStats.threePointersMade += 1;
              playerStats.fieldGoalsMade += 1;
            }
            break;
          case 'free_throw':
            playerStats.freeThrowsAttempted += 1;
            if (modifier === 'made') {
              playerStats.points += 1;
              playerStats.freeThrowsMade += 1;
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
        // Calculate shooting percentages (avoid division by zero)
        const fgPct = player.fieldGoalsAttempted > 0 
          ? (player.fieldGoalsMade / player.fieldGoalsAttempted) * 100 
          : 0;
        const threePct = player.threePointersAttempted > 0 
          ? (player.threePointersMade / player.threePointersAttempted) * 100 
          : 0;
        const ftPct = player.freeThrowsAttempted > 0 
          ? (player.freeThrowsMade / player.freeThrowsAttempted) * 100 
          : 0;

        return {
          playerId: player.playerId,
          playerName: player.playerName,
          isCustomPlayer: player.isCustomPlayer, // ✅ Pass through custom player flag
          profilePhotoUrl: player.profilePhotoUrl, // ✅ Pass through player photo
          minutes: player.minutes,
          points: player.points,
          rebounds: player.rebounds,
          assists: player.assists,
          steals: player.steals,
          blocks: player.blocks,
          turnovers: player.turnovers,
          fouls: player.fouls,
          plusMinus: player.plusMinus,
          // ✅ NBA-style shooting stats
          fieldGoalsMade: player.fieldGoalsMade,
          fieldGoalsAttempted: player.fieldGoalsAttempted,
          fieldGoalPercentage: Math.round(fgPct * 10) / 10, // Round to 1 decimal
          threePointersMade: player.threePointersMade,
          threePointersAttempted: player.threePointersAttempted,
          threePointPercentage: Math.round(threePct * 10) / 10,
          freeThrowsMade: player.freeThrowsMade,
          freeThrowsAttempted: player.freeThrowsAttempted,
          freeThrowPercentage: Math.round(ftPct * 10) / 10
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
