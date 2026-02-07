'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameViewerV3APIResponse } from '@/providers/GameViewerV3Provider';

interface UseGameViewerV3Return {
  gameData: GameViewerV3APIResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setGameData: React.Dispatch<React.SetStateAction<GameViewerV3APIResponse | null>>;
}

/**
 * Fetches game viewer data from the consolidated API route.
 * Single API call that returns all necessary data (batched queries server-side).
 */
export function useGameViewerV3(gameId: string): UseGameViewerV3Return {
  const [gameData, setGameData] = useState<GameViewerV3APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameData = useCallback(async () => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/game-viewer/${gameId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch game data: ${response.status}`);
      }

      const responseData: GameViewerV3APIResponse = await response.json();
      setGameData(responseData);
      
      console.log(`📺 GameViewerV3: Loaded game ${gameId.substring(0, 8)} with ${responseData.stats?.length || 0} stats`);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.error('❌ GameViewerV3: Fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Initial fetch
  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  const refetch = useCallback(async () => {
    console.log('🔄 GameViewerV3: Manual refetch triggered');
    await fetchGameData();
  }, [fetchGameData]);

  return {
    gameData,
    loading,
    error,
    refetch,
    setGameData,
  };
}
