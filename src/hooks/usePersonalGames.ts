/**
 * usePersonalGames Hook - Data Management for Personal Player Stat Tracker
 * 
 * Provides CRUD operations, loading states, and caching for personal games.
 * Follows existing hook patterns from the codebase (similar to usePlayerDashboardData).
 */

import { useState, useEffect, useCallback } from 'react';
import { PersonalGamesService, PersonalGame, PersonalGameInput, PersonalGamesListResponse } from '@/lib/services/personalGamesService';
import { notify } from '@/lib/services/notificationService';

export interface UsePersonalGamesOptions {
  limit?: number;
  autoLoad?: boolean;
}

export interface UsePersonalGamesReturn {
  // Data
  games: PersonalGamesListResponse['games'];
  totalGames: number;
  hasMore: boolean;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  loadGames: (offset?: number) => Promise<void>;
  createGame: (gameData: PersonalGameInput) => Promise<PersonalGame | null>;
  updateGame: (gameId: string, updates: Partial<PersonalGameInput>) => Promise<PersonalGame | null>;
  deleteGame: (gameId: string) => Promise<boolean>;
  refreshGames: () => Promise<void>;
  loadMoreGames: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  getGameById: (gameId: string) => PersonalGame | undefined;
}

export function usePersonalGames(
  playerId: string | null,
  options: UsePersonalGamesOptions = {}
): UsePersonalGamesReturn {
  const { limit = 20, autoLoad = true } = options;
  
  // State
  const [games, setGames] = useState<PersonalGamesListResponse['games']>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load games with pagination
   */
  const loadGames = useCallback(async (offset: number = 0) => {
    if (!playerId) {
      console.warn('usePersonalGames: No player ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🎮 usePersonalGames: Loading games', { playerId, offset, limit });
      
      const response = await PersonalGamesService.getPersonalGames(playerId, {
        limit,
        offset
      });
      
      if (offset === 0) {
        // Fresh load - replace all games
        setGames(response.games);
        setCurrentOffset(0);
      } else {
        // Load more - append to existing games
        setGames(prevGames => [...prevGames, ...response.games]);
        setCurrentOffset(offset);
      }
      
      setTotalGames(response.total);
      setHasMore(response.has_more);
      
      console.log('✅ usePersonalGames: Games loaded successfully', {
        count: response.games.length,
        total: response.total,
        hasMore: response.has_more
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load personal games';
      console.error('❌ usePersonalGames: Error loading games:', err);
      setError(errorMessage);
      notify.error('Failed to load games', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [playerId, limit]);

  /**
   * Load more games (pagination)
   */
  const loadMoreGames = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextOffset = currentOffset + limit;
    await loadGames(nextOffset);
  }, [hasMore, loading, currentOffset, limit, loadGames]);

  /**
   * Refresh games (reload from beginning)
   */
  const refreshGames = useCallback(async () => {
    await loadGames(0);
  }, [loadGames]);

  /**
   * Create a new personal game
   */
  const createGame = useCallback(async (gameData: PersonalGameInput): Promise<PersonalGame | null> => {
    if (!playerId) {
      notify.error('Authentication required', 'Please sign in to save games');
      return null;
    }

    try {
      setCreating(true);
      setError(null);
      
      console.log('🎮 usePersonalGames: Creating game', gameData);
      
      const newGame = await PersonalGamesService.createPersonalGame(playerId, gameData);
      
      // Add the new game to the beginning of the list (most recent first)
      const gameWithStats = {
        ...newGame,
        stats: PersonalGamesService.calculateGameStats(newGame)
      };
      
      setGames(prevGames => [gameWithStats, ...prevGames]);
      setTotalGames(prev => prev + 1);
      
      notify.success('Game saved!', 'Your personal game has been recorded');
      
      console.log('✅ usePersonalGames: Game created successfully', newGame.id);
      
      return newGame;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save game';
      console.error('❌ usePersonalGames: Error creating game:', err);
      setError(errorMessage);
      notify.error('Failed to save game', errorMessage);
      return null;
    } finally {
      setCreating(false);
    }
  }, [playerId]);

  /**
   * Update an existing personal game
   */
  const updateGame = useCallback(async (
    gameId: string, 
    updates: Partial<PersonalGameInput>
  ): Promise<PersonalGame | null> => {
    try {
      setUpdating(true);
      setError(null);
      
      console.log('🎮 usePersonalGames: Updating game', { gameId, updates });
      
      const updatedGame = await PersonalGamesService.updatePersonalGame(gameId, updates);
      
      // Update the game in the list
      const gameWithStats = {
        ...updatedGame,
        stats: PersonalGamesService.calculateGameStats(updatedGame)
      };
      
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === gameId ? gameWithStats : game
        )
      );
      
      notify.success('Game updated!', 'Your changes have been saved');
      
      console.log('✅ usePersonalGames: Game updated successfully', gameId);
      
      return updatedGame;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update game';
      console.error('❌ usePersonalGames: Error updating game:', err);
      setError(errorMessage);
      notify.error('Failed to update game', errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Delete a personal game
   */
  const deleteGame = useCallback(async (gameId: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setError(null);
      
      console.log('🎮 usePersonalGames: Deleting game', gameId);
      
      await PersonalGamesService.deletePersonalGame(gameId);
      
      // Remove the game from the list
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      setTotalGames(prev => Math.max(0, prev - 1));
      
      notify.success('Game deleted', 'The game has been removed from your history');
      
      console.log('✅ usePersonalGames: Game deleted successfully', gameId);
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete game';
      console.error('❌ usePersonalGames: Error deleting game:', err);
      setError(errorMessage);
      notify.error('Failed to delete game', errorMessage);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Get a specific game by ID from the current list
   */
  const getGameById = useCallback((gameId: string) => {
    return games.find(game => game.id === gameId);
  }, [games]);

  /**
   * Auto-load games on mount if playerId is available
   */
  useEffect(() => {
    if (autoLoad && playerId && games.length === 0) {
      console.log('🎮 usePersonalGames: Auto-loading games for player', playerId);
      loadGames(0);
    }
  }, [autoLoad, playerId, games.length, loadGames]);

  /**
   * Reset state when player changes
   */
  useEffect(() => {
    if (!playerId) {
      setGames([]);
      setTotalGames(0);
      setHasMore(false);
      setCurrentOffset(0);
      setError(null);
    }
  }, [playerId]);

  return {
    // Data
    games,
    totalGames,
    hasMore,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error state
    error,
    
    // Actions
    loadGames,
    createGame,
    updateGame,
    deleteGame,
    refreshGames,
    loadMoreGames,
    
    // Utilities
    clearError,
    getGameById
  };
}

/**
 * Hook for managing a single personal game (for editing)
 */
export function usePersonalGame(gameId: string | null) {
  const [game, setGame] = useState<(PersonalGame & { stats: any }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError(null);
      
      const gameData = await PersonalGamesService.getPersonalGame(gameId);
      setGame(gameData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game';
      setError(errorMessage);
      console.error('❌ usePersonalGame: Error loading game:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      loadGame();
    } else {
      setGame(null);
      setError(null);
    }
  }, [gameId, loadGame]);

  return {
    game,
    loading,
    error,
    reload: loadGame
  };
}
