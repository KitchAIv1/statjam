import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { GameService } from '@/lib/services/gameService';
import { OfflineSyncService } from '@/lib/services/offlineSyncService';
import { Game, PlayerGameStats } from '@/lib/types/game';

interface UseGameStateReturn {
  // Game state
  currentGame: Game | null;
  isLoading: boolean;
  error: string | null;
  
  // Game actions
  startGame: () => Promise<void>;
  updateClock: (minutes: number, seconds: number, isRunning: boolean) => Promise<void>;
  recordStat: (statData: any) => Promise<void>;
  recordSubstitution: (subData: any) => Promise<void>;
  
  // Offline status
  isOnline: boolean;
  offlineQueueStatus: { pending: number; total: number };
  
  // Refresh data
  refreshGame: () => Promise<void>;
}

export const useGameState = (): UseGameStateReturn => {
  const { user, userProfile } = useAuthStore();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueStatus, setOfflineQueueStatus] = useState({ pending: 0, total: 0 });

  // Initialize offline sync
  useEffect(() => {
    OfflineSyncService.initializeOfflineSync();
    
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setOfflineQueueStatus(OfflineSyncService.getOfflineQueueStatus());
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load current game
  const loadCurrentGame = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const game = await GameService.getCurrentGame(userProfile.id);
      setCurrentGame(game);
      
      if (game) {
        // Save game data locally for offline access
        OfflineSyncService.saveGameData(game.id, game);
      }
    } catch (err) {
      setError('Failed to load game data');
      console.error('Error loading game:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id]);

  // Load game on mount and when user changes
  useEffect(() => {
    loadCurrentGame();
  }, [loadCurrentGame]);

  // Start game
  const startGame = useCallback(async () => {
    if (!currentGame) return;

    try {
      if (isOnline) {
        const success = await GameService.startGame(currentGame.id);
        if (success) {
          await loadCurrentGame(); // Refresh game data
        }
      } else {
        // Queue for offline sync
        OfflineSyncService.addToOfflineQueue({
          type: 'game_start',
          data: { gameId: currentGame.id }
        });
        setOfflineQueueStatus(OfflineSyncService.getOfflineQueueStatus());
      }
    } catch (err) {
      setError('Failed to start game');
      console.error('Error starting game:', err);
    }
  }, [currentGame, isOnline, loadCurrentGame]);

  // Update clock
  const updateClock = useCallback(async (minutes: number, seconds: number, isRunning: boolean) => {
    if (!currentGame) return;

    try {
      if (isOnline) {
        const success = await GameService.updateGameClock(currentGame.id, {
          minutes,
          seconds,
          isRunning
        });
        if (success) {
          // Update local state immediately for responsiveness
          setCurrentGame(prev => prev ? {
            ...prev,
            game_clock_minutes: minutes,
            game_clock_seconds: seconds,
            is_clock_running: isRunning
          } : null);
        }
      } else {
        // Queue for offline sync
        OfflineSyncService.addToOfflineQueue({
          type: 'clock_update',
          data: { 
            gameId: currentGame.id,
            clockData: { minutes, seconds, isRunning }
          }
        });
        setOfflineQueueStatus(OfflineSyncService.getOfflineQueueStatus());
        
        // Update local state immediately
        setCurrentGame(prev => prev ? {
          ...prev,
          game_clock_minutes: minutes,
          game_clock_seconds: seconds,
          is_clock_running: isRunning
        } : null);
      }
    } catch (err) {
      setError('Failed to update clock');
      console.error('Error updating clock:', err);
    }
  }, [currentGame, isOnline]);

  // Record stat
  const recordStat = useCallback(async (statData: any) => {
    if (!currentGame) return;

    try {
      const fullStatData = {
        ...statData,
        gameId: currentGame.id,
        quarter: currentGame.quarter,
        gameTimeMinutes: currentGame.game_clock_minutes,
        gameTimeSeconds: currentGame.game_clock_seconds
      };

      if (isOnline) {
        const result = await GameService.recordStat(fullStatData);
        if (!result.success) {
          throw new Error(result.error || 'Failed to record stat');
        }
      } else {
        // Queue for offline sync
        OfflineSyncService.addToOfflineQueue({
          type: 'stat_recorded',
          data: fullStatData
        });
        setOfflineQueueStatus(OfflineSyncService.getOfflineQueueStatus());
      }
    } catch (err) {
      setError('Failed to record stat');
      console.error('Error recording stat:', err);
    }
  }, [currentGame, isOnline]);

  // Record substitution
  const recordSubstitution = useCallback(async (subData: any) => {
    if (!currentGame) return;

    try {
      const fullSubData = {
        ...subData,
        gameId: currentGame.id,
        quarter: currentGame.quarter,
        gameTimeMinutes: currentGame.game_clock_minutes,
        gameTimeSeconds: currentGame.game_clock_seconds
      };

      if (isOnline) {
        const success = await GameService.recordSubstitution(fullSubData);
        if (!success) {
          throw new Error('Failed to record substitution');
        }
      } else {
        // Queue for offline sync
        OfflineSyncService.addToOfflineQueue({
          type: 'substitution',
          data: fullSubData
        });
        setOfflineQueueStatus(OfflineSyncService.getOfflineQueueStatus());
      }
    } catch (err) {
      setError('Failed to record substitution');
      console.error('Error recording substitution:', err);
    }
  }, [currentGame, isOnline]);

  // Refresh game data
  const refreshGame = useCallback(async () => {
    await loadCurrentGame();
  }, [loadCurrentGame]);

  return {
    currentGame,
    isLoading,
    error,
    startGame,
    updateClock,
    recordStat,
    recordSubstitution,
    isOnline,
    offlineQueueStatus,
    refreshGame
  };
}; 