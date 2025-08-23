import { useState, useEffect, useRef } from 'react';
import { GameService } from '@/lib/services/gameService';

// EMERGENCY FIX: Global cache and request deduplication
const gameStatusCache = new Map<string, { hasGames: boolean; count: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds
const pendingGameRequests = new Map<string, Promise<any[]>>();

interface TournamentGameStatus {
  hasGames: boolean;
  gameCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to track tournament game status
 * Used for determining Schedule button state and functionality
 */
export function useTournamentGameStatus(tournamentId: string): TournamentGameStatus {
  const [hasGames, setHasGames] = useState(false);
  const [gameCount, setGameCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGameStatus = async () => {
    if (!tournamentId) {
      setHasGames(false);
      setGameCount(0);
      return;
    }

    // EMERGENCY FIX: Check cache first
    const cacheKey = `games_${tournamentId}`;
    const cached = gameStatusCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🔍 useTournamentGameStatus: Using cached game status:', cached.count);
      setHasGames(cached.hasGames);
      setGameCount(cached.count);
      setLoading(false);
      return;
    }

    // EMERGENCY FIX: Check if request is already pending
    if (pendingGameRequests.has(cacheKey)) {
      console.log('🔍 useTournamentGameStatus: Request already pending, waiting...');
      try {
        const games = await pendingGameRequests.get(cacheKey)!;
        const count = games?.length || 0;
        setHasGames(count > 0);
        setGameCount(count);
        setLoading(false);
      } catch (err) {
        console.error('❌ useTournamentGameStatus: Error from pending request:', err);
        setError(err instanceof Error ? err.message : 'Failed to load games');
      }
      return;
    }

    setLoading(true);
    setError(null);

    // EMERGENCY FIX: Add request to pending map
    const gamePromise = GameService.getGamesByTournament(tournamentId);
    pendingGameRequests.set(cacheKey, gamePromise);

    try {
      console.log('🔍 useTournamentGameStatus: Fetching games for tournament:', tournamentId);
      
      const games = await gamePromise;
      const count = games?.length || 0;
      
      // Cache the result
      gameStatusCache.set(cacheKey, { hasGames: count > 0, count, timestamp: Date.now() });
      
      setHasGames(count > 0);
      setGameCount(count);
      
      console.log('✅ useTournamentGameStatus: Found', count, 'games for tournament');
    } catch (err) {
      console.error('❌ useTournamentGameStatus: Error fetching games:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
      setHasGames(false);
      setGameCount(0);
    } finally {
      setLoading(false);
      // Remove from pending requests
      pendingGameRequests.delete(cacheKey);
    }
  };

  useEffect(() => {
    // EMERGENCY FIX: Add debouncing to prevent rapid-fire calls
    const timeoutId = setTimeout(() => {
      fetchGameStatus();
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [tournamentId]);

  return {
    hasGames,
    gameCount,
    loading,
    error,
    refetch: fetchGameStatus
  };
}
