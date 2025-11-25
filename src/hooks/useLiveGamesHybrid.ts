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
  
  for (const stat of stats) {
    // Only count made shots
    if (stat.modifier !== 'made') continue;
    
    // Use stat_value from database (already contains correct points)
    const points = stat.stat_value || 0;
    
    // Check is_opponent_stat flag for coach mode
    if (stat.is_opponent_stat) {
      // Opponent stats go to team B score
      awayScore += points;
    } else if (stat.team_id === teamAId) {
      homeScore += points;
    } else if (stat.team_id === teamBId) {
      awayScore += points;
    }
  }
  
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

      console.log('🏀 useLiveGamesHybrid: Fetching live games with hybrid service...');

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
        console.log('📝 useLiveGamesHybrid: No live games found');
        setGames([]);
        setLoading(false);
        return;
      }

      // Step 2: Get team names
      const teamIds = [...new Set([
        ...gamesData.map(g => g.team_a_id),
        ...gamesData.map(g => g.team_b_id)
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
      const tournamentIds = [...new Set(gamesData.map(g => g.tournament_id))].filter(Boolean);
      
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

      // Step 5: ✅ CRITICAL FIX: Calculate scores from game_stats (source of truth)
      // Fetch stats for all games in parallel for efficiency
      const gameIds = gamesData.map(g => g.id);
      let allStats: any[] = [];
      
      if (gameIds.length > 0) {
        try {
          // Batch fetch all stats for all games in a single query
          const statsData = await hybridSupabaseService.query<any>(
            'game_stats',
            'game_id,team_id,stat_type,stat_value,modifier,is_opponent_stat',
            {
              'game_id': `in.(${gameIds.join(',')})`,
              'order': 'created_at.asc'
            }
          );
          
          allStats = statsData || [];
          console.log(`✅ useLiveGamesHybrid: Fetched ${allStats.length} stats for ${gameIds.length} games`);
        } catch (statsError) {
          console.error('❌ useLiveGamesHybrid: Error fetching stats for score calculation:', statsError);
          // Continue with database scores as fallback
        }
      }
      
      // Group stats by game_id for efficient lookup
      const statsByGameId = new Map<string, any[]>();
      for (const stat of allStats) {
        if (!statsByGameId.has(stat.game_id)) {
          statsByGameId.set(stat.game_id, []);
        }
        statsByGameId.get(stat.game_id)!.push(stat);
      }

      // Step 6: Enrich games with calculated scores
      const enrichedGames: LiveGame[] = await Promise.all(
        gamesData.map(async (game) => {
          const gameStats = statsByGameId.get(game.id) || [];
          
          // Calculate scores from stats (source of truth)
          let calculatedScores = { homeScore: game.home_score || 0, awayScore: game.away_score || 0 };
          
          if (gameStats.length > 0 && game.team_a_id && game.team_b_id) {
            try {
              calculatedScores = await calculateScoresFromStats(
                game.id,
                game.team_a_id,
                game.team_b_id,
                gameStats
              );
            } catch (error) {
              console.error(`❌ useLiveGamesHybrid: Error calculating scores for game ${game.id}:`, error);
              // Fallback to database scores on error
            }
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
          console.log('🔄 useLiveGamesHybrid: Game count changed:', prevGames.length, '→', enrichedGames.length);
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
          console.log('🔇 useLiveGamesHybrid: No meaningful changes, skipping update');
          return prevGames; // Keep same reference
        }
        
        console.log('🔄 useLiveGamesHybrid: Meaningful changes detected, updating UI');
        return enrichedGames;
      });
      console.log(`✅ useLiveGamesHybrid: Loaded ${enrichedGames.length} live games`);

    } catch (e: any) {
      console.error('❌ useLiveGamesHybrid: Error:', e);
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
    console.log('🏀 useLiveGamesHybrid: Setting up NBA-level real-time subscriptions...');

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
        console.log('🔔 useLiveGamesHybrid: Real-time game update received:', payload);
        
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
        console.log('🔔 useLiveGamesHybrid: Real-time stat update received:', payload);
        
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
      console.log('🧹 useLiveGamesHybrid: Cleaning up subscriptions...');
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
        console.log('🔄 useLiveGamesHybrid: Backup polling triggered');
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
