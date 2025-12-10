/**
 * 🏀 LIGHTWEIGHT LIVE GAME COUNT HOOK
 * 
 * Purpose: For list pages that only need to know which tournaments have live games
 * Optimization: Skips score calculation, team names, and game stats queries
 * 
 * Use this for: TournamentsListPage (public tournament list)
 * Use useLiveGamesHybrid for: Game viewers, trackers (need full game data)
 */

import { useState, useEffect, useCallback } from 'react';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { logger } from '@/lib/utils/logger';

interface LiveGameBasic {
  id: string;
  tournament_id: string;
  status: string;
}

interface LiveGameCountResult {
  /** Map of tournament_id -> live game count */
  liveGameCountByTournament: Map<string, number>;
  /** Array of tournament IDs that have live games */
  tournamentsWithLiveGames: string[];
  /** Total count of all live games */
  totalLiveGames: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Lightweight hook that only fetches live game counts per tournament
 * ~90% faster than useLiveGamesHybrid (skips 11+ game_stats queries)
 */
export function useLiveGameCount(): LiveGameCountResult {
  const [liveGameCountByTournament, setLiveGameCountByTournament] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveGameCounts = useCallback(async () => {
    try {
      setError(null);
      logger.debug('🏀 useLiveGameCount: Fetching live game counts (lightweight)...');

      // Single query - just get game IDs and tournament IDs
      const gamesData = await hybridSupabaseService.query<LiveGameBasic>(
        'games',
        'id,tournament_id,status',
        {
          'or': '(status.eq.live,status.eq.LIVE,status.eq.in_progress,status.eq.IN_PROGRESS,status.eq.overtime,status.eq.OVERTIME,is_clock_running.eq.true)',
          'limit': '100'
        }
      );

      if (!gamesData || gamesData.length === 0) {
        logger.debug('📝 useLiveGameCount: No live games found');
        setLiveGameCountByTournament(new Map());
        setLoading(false);
        return;
      }

      // Filter out completed games (safety check)
      const liveGamesOnly = gamesData.filter((game) => {
        const status = String(game.status || '').toLowerCase();
        return status !== 'completed';
      });

      // Group by tournament_id and count
      const counts = new Map<string, number>();
      liveGamesOnly.forEach(game => {
        if (game.tournament_id) {
          counts.set(game.tournament_id, (counts.get(game.tournament_id) || 0) + 1);
        }
      });

      logger.debug('✅ useLiveGameCount: Found', liveGamesOnly.length, 'live games across', counts.size, 'tournaments');
      setLiveGameCountByTournament(counts);
      setLoading(false);
    } catch (err) {
      logger.error('❌ useLiveGameCount: Error fetching live games:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch live games');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveGameCounts();

    // Refresh every 30 seconds (lightweight, so OK to poll more frequently)
    const interval = setInterval(fetchLiveGameCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveGameCounts]);

  return {
    liveGameCountByTournament,
    tournamentsWithLiveGames: Array.from(liveGameCountByTournament.keys()),
    totalLiveGames: Array.from(liveGameCountByTournament.values()).reduce((a, b) => a + b, 0),
    loading,
    error,
  };
}
