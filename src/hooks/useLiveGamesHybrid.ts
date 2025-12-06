/**
 * 🏀 NBA-LEVEL LIVE GAMES HOOK
 * 
 * Hybrid approach combining:
 * - Raw HTTP queries for reliability (never hangs)
 * - WebSocket subscriptions for real-time updates
 * - Intelligent fallback to polling when WebSockets fail
 * 
 * Performance: NBA.com-level instant updates with enterprise reliability
 */

import { useState, useEffect, useCallback } from 'react';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { logger } from '@/lib/utils/logger';

interface LiveGame {
  id: string;
  status: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  team_a_id: string;
  team_b_id: string;
  tournament_id: string;
  team_a_name?: string;
  team_b_name?: string;
  tournament_name?: string;
  updated_at?: string;
}

/**
 * ✅ SCORE CALCULATION: Calculate scores from game_stats (source of truth)
 * Matches the logic used in useTracker and useGameViewerV2 for consistency
 */
async function calculateScoresFromStats(
  gameId: string,
  teamAId: string,
  teamBId: string,
  stats: any[]
): Promise<{ homeScore: number; awayScore: number }> {
  let homeScore = 0;
  let awayScore = 0;
  
  // Debug: Log what we're processing
  logger.debug(`🔍 calculateScoresFromStats: gameId=${gameId}, teamA=${teamAId}, teamB=${teamBId}, statsCount=${stats.length}`);
  
  for (const stat of stats) {
    // Only count made shots
    if (stat.modifier !== 'made') continue;
    
    // Use stat_value from database (already contains correct points)
    const points = stat.stat_value || 0;
    
    // Match by team_id
    if (stat.team_id === teamAId) {
      homeScore += points;
    } else if (stat.team_id === teamBId) {
      awayScore += points;
    } else {
      // Debug: Log unmatched stats
      logger.warn(`⚠️ Stat team_id ${stat.team_id} doesn't match teamA=${teamAId} or teamB=${teamBId}`);
    }
  }
  
  logger.debug(`📊 calculateScoresFromStats: gameId=${gameId} → home=${homeScore}, away=${awayScore}`);
  
  return { homeScore, awayScore };
}

export function useLiveGamesHybrid() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'polling' | 'error'>('polling');

  /**
   * 🚀 FETCH LIVE GAMES (Raw HTTP - Never Hangs)
   */
  const fetchLiveGames = useCallback(async () => {
    try {
      setError(null);

      logger.debug('🏀 useLiveGamesHybrid: Fetching live games with hybrid service...');

      // Step 1: Get live games using reliable raw HTTP
      const gamesData = await hybridSupabaseService.query<LiveGame>(
        'games',
        'id,status,quarter,game_clock_minutes,game_clock_seconds,is_clock_running,home_score,away_score,team_a_id,team_b_id,tournament_id,updated_at',
        {
          'or': '(status.eq.live,status.eq.LIVE,status.eq.in_progress,status.eq.IN_PROGRESS,status.eq.overtime,status.eq.OVERTIME,is_clock_running.eq.true)',
          'order': 'updated_at.desc',
          'limit': '24'
        }
      );

      if (!gamesData || gamesData.length === 0) {
        logger.debug('📝 useLiveGamesHybrid: No live games found');
        setGames([]);
        setLoading(false);
        return;
      }

      // ✅ FIX: Filter out completed games (even if is_clock_running=true due to race condition)
      // This ensures completed games never appear in "LIVE NOW" sections
      const liveGamesOnly = gamesData.filter((game) => {
        const status = String(game.status || '').toLowerCase();
        return status !== 'completed';
      });

      if (liveGamesOnly.length === 0) {
        logger.debug('📝 useLiveGamesHybrid: No live games found after filtering completed games');
        setGames([]);
        setLoading(false);
        return;
      }

      // Use filtered games for remaining processing
      const filteredGamesData = liveGamesOnly;

      // Step 2: Get team names
      const teamIds = [...new Set([
        ...filteredGamesData.map(g => g.team_a_id),
        ...filteredGamesData.map(g => g.team_b_id)
      ])].filter(Boolean);

      let teamsData: any[] = [];
      if (teamIds.length > 0) {
        teamsData = await hybridSupabaseService.query(
          'teams',
          'id,name',
          { 'id': `in.(${teamIds.join(',')})` }
        );
      }

      // Step 3: Get tournament names
      const tournamentIds = [...new Set(filteredGamesData.map(g => g.tournament_id))].filter(Boolean);
      
      let tournamentsData: any[] = [];
      if (tournamentIds.length > 0) {
        tournamentsData = await hybridSupabaseService.query(
          'tournaments',
          'id,name',
          { 'id': `in.(${tournamentIds.join(',')})` }
        );
      }

      // Step 4: Combine data
      const teamsMap = new Map(teamsData.map(t => [t.id, t.name]));
      const tournamentsMap = new Map(tournamentsData.map(t => [t.id, t.name]));

      // Step 5: ✅ SCALABLE FIX: Fetch stats per-game to avoid Supabase 1000 row limit
      // Each game's stats are fetched individually in parallel (bypasses 1000 limit)
      logger.debug(`🏀 useLiveGamesHybrid: Fetching stats for ${filteredGamesData.length} games (per-game queries)`);
      const enrichedGames: LiveGame[] = await Promise.all(
        filteredGamesData.map(async (game) => {
          let calculatedScores = { homeScore: game.home_score || 0, awayScore: game.away_score || 0 };
          
          try {
            // Fetch stats for THIS specific game only
            const gameStats = await hybridSupabaseService.query<any>(
              'game_stats',
              'game_id,team_id,stat_type,stat_value,modifier,is_opponent_stat',
              {
                'game_id': `eq.${game.id}`,
                'order': 'created_at.asc'
              }
            );
            
            if (gameStats && gameStats.length > 0 && game.team_a_id && game.team_b_id) {
              calculatedScores = await calculateScoresFromStats(
                game.id,
                game.team_a_id,
                game.team_b_id,
                gameStats
              );
            }
          } catch (statsError) {
            logger.error(`❌ useLiveGamesHybrid: Error fetching stats for game ${game.id}:`, statsError);
            // Fallback to database scores on error
          }
          
          return {
            ...game,
            team_a_name: teamsMap.get(game.team_a_id) || 'Unknown Team',
            team_b_name: teamsMap.get(game.team_b_id) || 'Unknown Team',
            tournament_name: tournamentsMap.get(game.tournament_id) || 'Unknown Tournament',
            // ✅ Use calculated scores instead of database scores
            home_score: calculatedScores.homeScore,
            away_score: calculatedScores.awayScore
          };
        })
      );

      // ✅ ANTI-FLICKER: Smart comparison (ignore timestamps, focus on scores/status)
      setGames(prevGames => {
        if (prevGames.length !== enrichedGames.length) {
          logger.debug('🔄 useLiveGamesHybrid: Game count changed:', prevGames.length, '→', enrichedGames.length);
          return enrichedGames;
        }
        
        // Compare key fields that matter for UI (ignore timestamps)
        let hasChanges = false;
        for (let i = 0; i < enrichedGames.length; i++) {
          const prev = prevGames[i];
          const curr = enrichedGames[i];
          
          if (!prev || 
              prev.id !== curr.id ||
              prev.home_score !== curr.home_score ||
              prev.away_score !== curr.away_score ||
              prev.status !== curr.status ||
              prev.quarter !== curr.quarter ||
              prev.game_clock_minutes !== curr.game_clock_minutes ||
              prev.game_clock_seconds !== curr.game_clock_seconds) {
            hasChanges = true;
            break;
          }
        }
        
        if (!hasChanges) {
          logger.debug('🔇 useLiveGamesHybrid: No meaningful changes, skipping update');
          return prevGames; // Keep same reference
        }
        
        logger.debug('🔄 useLiveGamesHybrid: Meaningful changes detected, updating UI');
        return enrichedGames;
      });
      logger.debug(`✅ useLiveGamesHybrid: Loaded ${enrichedGames.length} live games`);

    } catch (e: any) {
      logger.error('❌ useLiveGamesHybrid: Error:', e);
      setError(e?.message || 'Failed to load live games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔌 SET UP REAL-TIME SUBSCRIPTIONS (NBA-Level)
   */
  useEffect(() => {
    logger.debug('🏀 useLiveGamesHybrid: Setting up NBA-level real-time subscriptions...');

    // Initial fetch
    fetchLiveGames();

    // ✅ DEBOUNCING: Use ref to persist timeout ID across re-renders and cleanup
    const statsUpdateTimeoutRef = { current: null as NodeJS.Timeout | null };
    const DEBOUNCE_DELAY = 300; // 300ms debounce window

    // Set up real-time subscriptions for games table AND game_stats table
    // ✅ CRITICAL: Subscribe to both to recalculate scores when stats change
    const unsubscribeGames = hybridSupabaseService.subscribe(
      'games',
      'status=in.(live,LIVE,in_progress,IN_PROGRESS,overtime,OVERTIME)',
      (payload) => {
        logger.debug('🔔 useLiveGamesHybrid: Real-time game update received:', payload);
        
        // Update connection status
        setConnectionStatus('connected');
        
        // Refresh games data when any live game changes
        fetchLiveGames();
      },
      {
        fallbackToPolling: true, // 🏀 TRUE NBA-LEVEL: WebSocket-first with polling fallback
        pollingInterval: 30000, // ✅ REAL NBA-LEVEL: 30-second fallback (WebSockets handle real-time)
        maxReconnectAttempts: 5
      }
    );
    
    // ✅ CRITICAL FIX: Subscribe to game_stats updates to recalculate scores
    // Debounce to batch rapid stat updates
    const unsubscribeStats = hybridSupabaseService.subscribe(
      'game_stats',
      '*', // Subscribe to all game_stats (we'll filter by game_id in fetchLiveGames)
      (payload) => {
        logger.debug('🔔 useLiveGamesHybrid: Real-time stat update received:', payload);
        
        // Update connection status
        setConnectionStatus('connected');
        
        // Debounce score recalculation to batch rapid updates
        if (statsUpdateTimeoutRef.current) {
          clearTimeout(statsUpdateTimeoutRef.current);
          statsUpdateTimeoutRef.current = null;
        }
        
        statsUpdateTimeoutRef.current = setTimeout(() => {
          // Refresh games data to recalculate scores
          fetchLiveGames();
          statsUpdateTimeoutRef.current = null;
        }, DEBOUNCE_DELAY);
      },
      {
        fallbackToPolling: false, // Stats updates are handled by games subscription polling
        maxReconnectAttempts: 5
      }
    );
    
    const unsubscribe = () => {
      unsubscribeGames();
      unsubscribeStats();
      if (statsUpdateTimeoutRef.current) {
        clearTimeout(statsUpdateTimeoutRef.current);
        statsUpdateTimeoutRef.current = null;
      }
    };

    // Monitor connection status
    const statusInterval = setInterval(() => {
      const status = hybridSupabaseService.getConnectionStatus('games-status=in.(live,LIVE,in_progress,IN_PROGRESS,overtime,OVERTIME)');
      if (status === 'connected') {
        setConnectionStatus('connected');
      } else if (status === 'error') {
        setConnectionStatus('polling');
      }
    }, 5000);

    return () => {
      logger.debug('🧹 useLiveGamesHybrid: Cleaning up subscriptions...');
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [fetchLiveGames]);

  /**
   * 🔄 BACKUP POLLING (Safety Net)
   * Even with real-time, keep a slow polling backup
   */
  useEffect(() => {
    const backupInterval = setInterval(() => {
      // Only poll if we haven't received real-time updates recently
      if (connectionStatus !== 'connected') {
        logger.debug('🔄 useLiveGamesHybrid: Backup polling triggered');
        fetchLiveGames();
      }
    }, 10000); // 10 seconds backup polling

    return () => clearInterval(backupInterval);
  }, [fetchLiveGames, connectionStatus]);

  return {
    games,
    loading,
    error,
    connectionStatus,
    refetch: fetchLiveGames
  };
}
