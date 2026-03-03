/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';
import { ensureSupabaseSession } from '@/lib/supabase';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

// Types for game stats aggregation
export interface GameStatsSummary {
  gameId: string;
  gameDate: string;
  opponent: string;
  opponentId: string;
  tournamentName: string;
  isHome: boolean;
  result: 'W' | 'L' | 'N/A' | 'LIVE';
  finalScore: string; // "85-78" or "LIVE" for ongoing games
  gameStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  minutesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

interface RawGameStat {
  game_id: string;
  stat_type: string;
  stat_value: number;
  modifier: string | null;
  quarter: number;
}

interface GameInfo {
  id: string;
  created_at: string;
  start_time: string | null;
  team_a_id: string;
  team_b_id: string;
  home_score: number;
  away_score: number;
  tournament_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  quarter: number | null;
  game_clock_minutes: number | null;
  game_clock_seconds: number | null;
  quarter_length_minutes: number | null;
  tournaments: {
    name: string;
  };
  team_a: {
    id: string;
    name: string;
  };
  team_b: {
    id: string;
    name: string;
  };
}

/**
 * Calculate stint duration in seconds (handles cross-quarter stints).
 * Mirrors GameViewerTimeStatsService.calculateStintSeconds exactly.
 */
function calculateStintSeconds(
  startQuarter: number,
  startGameClock: number,
  endQuarter: number,
  endGameClock: number,
  quarterLengthSeconds: number
): number {
  if (startQuarter === endQuarter) {
    return Math.max(0, startGameClock - endGameClock);
  }
  const startQuarterTime = startGameClock;
  const fullQuarters = Math.max(0, endQuarter - startQuarter - 1);
  const fullQuartersTime = fullQuarters * quarterLengthSeconds;
  const endQuarterTime = quarterLengthSeconds - endGameClock;
  return startQuarterTime + fullQuartersTime + endQuarterTime;
}

export class PlayerGameStatsService {
  /**
   * Fetch all game stats for a player and aggregate by game
   * Supports both regular players (from users table) and custom players (from custom_players table)
   * 
   * ⚡ PERFORMANCE OPTIMIZATION:
   * - Caches results for 5 minutes to avoid duplicate queries
   * - Limits to last 50 games for faster queries
   * - Uses efficient query ordering
   */
  static async getPlayerGameStats(playerId: string, isCustomPlayer: boolean = false): Promise<GameStatsSummary[]> {
    try {
      // ✅ CRITICAL: Ensure authenticated session before querying
      // This ensures RLS policies work correctly in both local dev and production
      if (typeof window !== 'undefined') {
        await ensureSupabaseSession();
      }

      // ⚡ Check cache first (5 min TTL) - use separate cache key for custom players
      const cacheKey = isCustomPlayer 
        ? `custom_player_game_stats_${playerId}` 
        : CacheKeys.playerGameStats(playerId);
      const cached = cache.get<GameStatsSummary[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Step 1: Get all raw stats for this player from game_stats table
      // ⚡ OPTIMIZATION: Limit to last 50 games for faster queries
      // Query by player_id for regular players, custom_player_id for custom players
      const statsQuery = supabase
        .from('game_stats')
        .select('game_id, stat_type, stat_value, modifier, quarter')
        .order('created_at', { ascending: false })
        .limit(2000); // ⚡ Limit: ~40 stats per game × 50 games

      if (isCustomPlayer) {
        statsQuery.eq('custom_player_id', playerId);
      } else {
        statsQuery.eq('player_id', playerId);
      }

      const { data: rawStats, error: statsError } = await statsQuery;

      if (statsError) {
        logger.error('❌ PlayerGameStatsService: Error fetching game_stats:', statsError);
        return [];
      }

      if (!rawStats || rawStats.length === 0) {
        return [];
      }

      // Step 2: Get unique game IDs
      const gameIds = [...new Set(rawStats.map(s => s.game_id))];
      
      logger.debug('🔍 PlayerGameStatsService: Found', gameIds.length, 'unique game IDs from stats', isCustomPlayer ? '(custom player)' : '(regular player)');
      logger.debug('🔍 PlayerGameStatsService: Game IDs:', gameIds);

      // ⚡ OPTIMIZATION: Parallel queries (Step 3, 4 & 5 run simultaneously)
      // ✅ CRITICAL: Ensure authenticated session for RLS to work correctly
      // RLS will filter games based on player_has_game_stats_official() function
      // This respects is_official_team flags (practice games filtered, official games shown)
      const [gamesResult, teamPlayersResult, allGameStatsResult, subsResult] = await Promise.all([
        // Step 3: Fetch game info for all games
        // ✅ FILTER: Only tournament games (is_coach_game = false)
        // Coach mode games should not appear in player profiles/stats
        supabase
          .from('games')
          .select(`
            id,
            created_at,
            start_time,
            team_a_id,
            team_b_id,
            home_score,
            away_score,
            tournament_id,
            status,
            quarter,
            game_clock_minutes,
            game_clock_seconds,
            quarter_length_minutes,
            tournaments (name),
            team_a:teams!team_a_id (id, name),
            team_b:teams!team_b_id (id, name)
          `)
          .in('id', gameIds)
          .eq('is_coach_game', false), // ✅ Exclude coach mode games from player profiles
        
        // Step 4: Get player's team assignments to determine home/away
        // For custom players, query team_players by custom_player_id
        isCustomPlayer
          ? supabase
              .from('team_players')
              .select('team_id')
              .eq('custom_player_id', playerId)
          : supabase
              .from('team_players')
              .select('team_id')
              .eq('player_id', playerId),

        // Step 5: ✅ FIX - Fetch ALL game_stats for score calculation (source of truth)
        supabase
          .from('game_stats')
          .select('game_id, team_id, stat_value, modifier, is_opponent_stat')
          .in('game_id', gameIds),

        // Step 6: Fetch substitutions for accurate minutes calculation (matches game viewer)
        supabase
          .from('game_substitutions')
          .select('game_id, team_id, player_in_id, custom_player_in_id, player_out_id, custom_player_out_id, quarter, game_time_minutes, game_time_seconds, created_at')
          .in('game_id', gameIds)
      ]);

      const { data: games, error: gamesError } = gamesResult;
      const { data: teamPlayers, error: teamError } = teamPlayersResult;
      const { data: allGameStats } = allGameStatsResult;
      const { data: allSubstitutions } = subsResult;

      logger.debug('🔍 PlayerGameStatsService: Fetched', games?.length || 0, 'games from database');
      logger.debug('🔍 PlayerGameStatsService: Requested', gameIds.length, 'games, received', games?.length || 0);
      
      // ✅ DEBUG: Log missing game IDs (RLS might be filtering them)
      if (games && games.length < gameIds.length) {
        const fetchedGameIds = new Set(games.map(g => g.id));
        const missingGameIds = gameIds.filter(id => !fetchedGameIds.has(id));
        logger.warn('⚠️ PlayerGameStatsService: RLS may be filtering games. Missing game IDs:', missingGameIds);
        logger.warn('⚠️ This could be due to RLS policies restricting game access in production');
      }
      
      logger.debug('🔍 PlayerGameStatsService: Games data:', games);

      if (gamesError) {
        logger.error('❌ PlayerGameStatsService: Error fetching game info:', gamesError);
        logger.error('❌ Error code:', gamesError.code);
        logger.error('❌ Error message:', gamesError.message);
        logger.error('❌ Error details:', gamesError.details);
        return [];
      }

      if (!games || games.length === 0) {
        // ✅ Changed to debug - this is expected for coach mode games (RLS filtering)
        logger.debug('🔍 PlayerGameStatsService: No games returned from query (after status filter) - expected for coach mode');
        return [];
      }

      if (teamError) {
        logger.error('❌ Error fetching player teams:', teamError);
        return [];
      }

      const playerTeamIds = teamPlayers?.map(tp => tp.team_id) || [];

      // ✅ FIX: Pre-calculate scores from game_stats (source of truth)
      const scoresByGameId = new Map<string, { teamAScore: number; teamBScore: number }>();
      for (const game of games) {
        const gameStatsForGame = (allGameStats || []).filter((s: any) => s.game_id === game.id);
        let teamAScore = 0, teamBScore = 0;
        
        for (const stat of gameStatsForGame) {
          if (stat.modifier !== 'made') continue;
          const points = stat.stat_value || 0;
          
          // Handle is_opponent_stat for coach mode
          if (stat.is_opponent_stat) {
            teamBScore += points;
          } else if (stat.team_id === game.team_a_id) {
            teamAScore += points;
          } else if (stat.team_id === game.team_b_id) {
            teamBScore += points;
          }
        }
        
        scoresByGameId.set(game.id, { teamAScore, teamBScore });
      }

      // Step 6: Aggregate stats by game
      const gameStatsSummaries = gameIds.map(gameId => {
        const gameStats = rawStats.filter(s => s.game_id === gameId) as RawGameStat[];
        const gameInfo = games.find(g => g.id === gameId) as GameInfo | undefined;

        if (!gameInfo) {
          return null;
        }

        // Determine if player is on team A or B
        const isTeamA = playerTeamIds.includes(gameInfo.team_a_id);
        const isTeamB = playerTeamIds.includes(gameInfo.team_b_id);
        const isHome = isTeamA; // Assuming team_a is home
        const playerTeam = isTeamA ? gameInfo.team_a : gameInfo.team_b;
        const opponentTeam = isTeamA ? gameInfo.team_b : gameInfo.team_a;
        
        // ✅ FIX: Use calculated scores from game_stats (source of truth)
        const calculatedScores = scoresByGameId.get(gameId) || { teamAScore: 0, teamBScore: 0 };
        const playerScore = isTeamA ? calculatedScores.teamAScore : calculatedScores.teamBScore;
        const opponentScore = isTeamA ? calculatedScores.teamBScore : calculatedScores.teamAScore;

        // ✅ Calculate result based on game status
        let result: 'W' | 'L' | 'N/A' | 'LIVE' = 'N/A';
        let finalScore: string = `${playerScore}-${opponentScore}`;
        
        if (gameInfo.status === 'in_progress') {
          // Game is ongoing - show LIVE
          result = 'LIVE';
          finalScore = 'LIVE';
        } else if (gameInfo.status === 'completed') {
          // Game is finished - calculate W/L
          if (playerScore > opponentScore) result = 'W';
          else if (playerScore < opponentScore) result = 'L';
          else result = 'N/A'; // Tie
        } else if (gameInfo.status === 'scheduled') {
          // Game hasn't started - show N/A
          result = 'N/A';
          finalScore = '-';
        } else {
          // Cancelled or other status
          result = 'N/A';
          finalScore = '-';
        }

        // Aggregate stats
        const stats = this.aggregateGameStats(gameStats);

        // Compute accurate minutes from substitution data (matches game viewer)
        const playerTeamId = isTeamA ? gameInfo.team_a_id : gameInfo.team_b_id;
        const minutesPlayed = this.computeMinutesForPlayer(
          playerId, playerTeamId, gameInfo,
          allSubstitutions || [], gameStats.length > 0
        );

        return {
          gameId,
          gameDate: gameInfo.start_time || gameInfo.created_at,
          opponent: opponentTeam?.name || 'Unknown',
          opponentId: opponentTeam?.id || '',
          tournamentName: gameInfo.tournaments?.name || 'Unknown Tournament',
          isHome,
          result,
          finalScore,
          gameStatus: gameInfo.status,
          minutesPlayed,
          ...stats
        } as GameStatsSummary;
      }).filter(Boolean) as GameStatsSummary[];

      // ⚡ Cache results for 5 minutes
      cache.set(cacheKey, gameStatsSummaries, CacheTTL.playerGameStats);

      return gameStatsSummaries;

    } catch (error) {
      logger.error('❌ PlayerGameStatsService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Compute minutes for a single player in a single game.
   * Uses substitution data for accuracy (matches game viewer box score logic).
   */
  private static computeMinutesForPlayer(
    playerId: string,
    teamId: string,
    gameInfo: GameInfo,
    substitutions: any[],
    playerHasStats: boolean
  ): number {
    const quarterLengthMin = gameInfo.quarter_length_minutes || 8;
    const quarterLengthSeconds = quarterLengthMin * 60;

    // Determine game state (for closing open stints)
    let stateQuarter: number;
    let stateClockMin: number;
    let stateClockSec: number;

    if (gameInfo.status === 'completed') {
      stateQuarter = gameInfo.quarter || 4;
      stateClockMin = 0;
      stateClockSec = 0;
    } else {
      stateQuarter = gameInfo.quarter || 1;
      stateClockMin = gameInfo.game_clock_minutes ?? quarterLengthMin;
      stateClockSec = gameInfo.game_clock_seconds ?? 0;
    }

    const teamSubs = substitutions
      .filter((s: any) => s.team_id === teamId && s.game_id === gameInfo.id)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // No substitutions: all players with stats get total elapsed time
    if (teamSubs.length === 0) {
      if (!playerHasStats) return 0;
      const quarterTimeElapsed = quarterLengthSeconds - (stateClockMin * 60 + stateClockSec);
      const totalTimeElapsed = ((stateQuarter - 1) * quarterLengthSeconds) + quarterTimeElapsed;
      return Math.max(1, Math.round(totalTimeElapsed / 60));
    }

    // Infer if player is a starter
    const playerFirstAction = new Map<string, 'IN' | 'OUT'>();
    const playersInSubs = new Set<string>();

    for (const sub of teamSubs) {
      const pIn = sub.player_in_id || sub.custom_player_in_id;
      const pOut = sub.player_out_id || sub.custom_player_out_id;
      if (pIn) playersInSubs.add(pIn);
      if (pOut) playersInSubs.add(pOut);
      if (pOut && !playerFirstAction.has(pOut)) playerFirstAction.set(pOut, 'OUT');
      if (pIn && !playerFirstAction.has(pIn)) playerFirstAction.set(pIn, 'IN');
    }

    const isStarter = playerFirstAction.get(playerId) === 'OUT' ||
      (!playersInSubs.has(playerId) && playerHasStats);

    // Calculate floor time from substitution stints
    let totalSeconds = 0;
    let isOnCourt = isStarter;
    let stintStartQuarter = 1;
    let stintStartGameClock = quarterLengthSeconds;

    for (const sub of teamSubs) {
      const subQuarter = sub.quarter || 1;
      const subGameClock = ((sub.game_time_minutes ?? quarterLengthMin) * 60) + (sub.game_time_seconds ?? 0);
      const pIn = sub.player_in_id || sub.custom_player_in_id;
      const pOut = sub.player_out_id || sub.custom_player_out_id;

      if (pIn === playerId && !isOnCourt) {
        stintStartQuarter = subQuarter;
        stintStartGameClock = subGameClock;
        isOnCourt = true;
      } else if (pOut === playerId && isOnCourt) {
        totalSeconds += calculateStintSeconds(
          stintStartQuarter, stintStartGameClock,
          subQuarter, subGameClock,
          quarterLengthSeconds
        );
        isOnCourt = false;
      }
    }

    // Close open stint with current game state
    if (isOnCourt) {
      const currentClock = stateClockMin * 60 + stateClockSec;
      totalSeconds += calculateStintSeconds(
        stintStartQuarter, stintStartGameClock,
        stateQuarter, currentClock,
        quarterLengthSeconds
      );
    }

    return totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0;
  }

  /**
   * Aggregate raw stats into box score format
   */
  private static aggregateGameStats(gameStats: RawGameStat[]) {
    // Initialize counters
    let points = 0;
    let rebounds = 0;
    let assists = 0;
    let steals = 0;
    let blocks = 0;
    let turnovers = 0;
    let fouls = 0;

    let fieldGoalsMade = 0;
    let fieldGoalsAttempted = 0;
    let threePointersMade = 0;
    let threePointersAttempted = 0;
    let freeThrowsMade = 0;
    let freeThrowsAttempted = 0;

    // Aggregate stats
    gameStats.forEach(stat => {
      const statType = stat.stat_type;
      const modifier = stat.modifier;
      const value = stat.stat_value;

      // Points from made shots
      if (modifier === 'made') {
        points += value;

        if (statType === 'field_goal' || statType === 'two_pointer') {
          fieldGoalsMade++;
          fieldGoalsAttempted++;
        } else if (statType === 'three_pointer') {
          threePointersMade++;
          threePointersAttempted++;
          fieldGoalsMade++; // 3-pointers also count as field goals
          fieldGoalsAttempted++;
        } else if (statType === 'free_throw') {
          freeThrowsMade++;
          freeThrowsAttempted++;
        }
      }

      // Missed shots
      if (modifier === 'missed') {
        if (statType === 'field_goal' || statType === 'two_pointer') {
          fieldGoalsAttempted++;
        } else if (statType === 'three_pointer') {
          threePointersAttempted++;
          fieldGoalsAttempted++;
        } else if (statType === 'free_throw') {
          freeThrowsAttempted++;
        }
      }

      // Non-shooting stats
      if (statType === 'rebound') rebounds += value;
      if (statType === 'assist') assists += value;
      if (statType === 'steal') steals += value;
      if (statType === 'block') blocks += value;
      if (statType === 'turnover') turnovers += value;
      if (statType === 'foul') fouls += value;
    });

    // Calculate percentages
    const fieldGoalPercentage = fieldGoalsAttempted > 0
      ? Math.round((fieldGoalsMade / fieldGoalsAttempted) * 100)
      : 0;

    const threePointPercentage = threePointersAttempted > 0
      ? Math.round((threePointersMade / threePointersAttempted) * 100)
      : 0;

    const freeThrowPercentage = freeThrowsAttempted > 0
      ? Math.round((freeThrowsMade / freeThrowsAttempted) * 100)
      : 0;

    return {
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fouls,
      fieldGoalsMade,
      fieldGoalsAttempted,
      threePointersMade,
      threePointersAttempted,
      freeThrowsMade,
      freeThrowsAttempted,
      fieldGoalPercentage,
      threePointPercentage,
      freeThrowPercentage
    };
  }
}
