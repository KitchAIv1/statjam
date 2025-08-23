import { useState, useEffect } from 'react';
import { GameService } from '@/lib/services/gameService';

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

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 useTournamentGameStatus: Fetching games for tournament:', tournamentId);
      
      const games = await GameService.getGamesByTournament(tournamentId);
      const count = games?.length || 0;
      
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
    }
  };

  useEffect(() => {
    fetchGameStatus();
  }, [tournamentId]);

  return {
    hasGames,
    gameCount,
    loading,
    error,
    refetch: fetchGameStatus
  };
}
