/**
 * useGameAwards Hook - Game Awards with Prefetching & Caching
 * 
 * PURPOSE: Fetch Player of the Game and Hustle Player awards
 * with prefetch support for instant tab switching.
 * 
 * FEATURES:
 * - Prefetch mode for background loading
 * - Smart loading state management
 * - Handles both regular and custom players
 * - Parallel data fetching for performance
 */

import { useState, useEffect, useCallback } from 'react';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { PlayerGameStatsService } from '@/lib/services/playerGameStatsService';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';

export interface AwardedPlayer {
  id: string;
  name: string;
  photoUrl?: string | null;
  jerseyNumber?: number;
  isCustomPlayer: boolean;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  };
}

export interface GameAwardsData {
  playerOfTheGame: AwardedPlayer | null;
  hustlePlayer: AwardedPlayer | null;
  loading: boolean;
  error: string | null;
}

export interface UseGameAwardsOptions {
  prefetch?: boolean;
  enabled?: boolean;
}

export function useGameAwards(
  gameId: string,
  options: UseGameAwardsOptions = {}
): GameAwardsData {
  const [playerOfTheGame, setPlayerOfTheGame] = useState<AwardedPlayer | null>(null);
  const [hustlePlayer, setHustlePlayer] = useState<AwardedPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAwards = useCallback(async () => {
    if (!gameId) return;
    if (options.enabled === false) return;

    try {
      // Smart loading state - don't show spinner for prefetch
      if (!options.prefetch) {
        setLoading(true);
      }
      setError(null);

      const awards = await GameAwardsService.getGameAwards(gameId);
      
      if (!awards) {
        setPlayerOfTheGame(null);
        setHustlePlayer(null);
        setLoading(false);
        return;
      }

      // Prepare parallel fetch promises
      const fetchPromises: Promise<void>[] = [];

      // Player of the Game
      const potgId = awards.customPlayerOfTheGameId || awards.playerOfTheGameId;
      const potgIsCustom = !!awards.customPlayerOfTheGameId;
      
      if (potgId) {
        fetchPromises.push(
          (async () => {
            const [identity, gameStats] = await Promise.all([
              PlayerDashboardService.getIdentity(potgId, potgIsCustom),
              PlayerGameStatsService.getPlayerGameStats(potgId, potgIsCustom)
            ]);
            
            const thisGameStats = gameStats.find(g => g.gameId === gameId);
            
            setPlayerOfTheGame({
              id: potgId,
              name: identity?.name || 'Unknown Player',
              photoUrl: identity?.profilePhotoUrl,
              jerseyNumber: identity?.jerseyNumber,
              isCustomPlayer: potgIsCustom,
              stats: {
                points: thisGameStats?.points || 0,
                rebounds: thisGameStats?.rebounds || 0,
                assists: thisGameStats?.assists || 0,
                steals: thisGameStats?.steals || 0,
                blocks: thisGameStats?.blocks || 0
              }
            });
          })()
        );
      }

      // Hustle Player
      const hustleId = awards.customHustlePlayerId || awards.hustlePlayerId;
      const hustleIsCustom = !!awards.customHustlePlayerId;
      
      if (hustleId) {
        fetchPromises.push(
          (async () => {
            const [identity, gameStats] = await Promise.all([
              PlayerDashboardService.getIdentity(hustleId, hustleIsCustom),
              PlayerGameStatsService.getPlayerGameStats(hustleId, hustleIsCustom)
            ]);
            
            const thisGameStats = gameStats.find(g => g.gameId === gameId);
            
            setHustlePlayer({
              id: hustleId,
              name: identity?.name || 'Unknown Player',
              photoUrl: identity?.profilePhotoUrl,
              jerseyNumber: identity?.jerseyNumber,
              isCustomPlayer: hustleIsCustom,
              stats: {
                points: thisGameStats?.points || 0,
                rebounds: thisGameStats?.rebounds || 0,
                assists: thisGameStats?.assists || 0,
                steals: thisGameStats?.steals || 0,
                blocks: thisGameStats?.blocks || 0
              }
            });
          })()
        );
      }

      // Execute all fetches in parallel
      await Promise.all(fetchPromises);

    } catch (e: any) {
      console.error('❌ useGameAwards: Error fetching awards:', e);
      setError(e?.message || 'Failed to load game awards');
      setPlayerOfTheGame(null);
      setHustlePlayer(null);
    } finally {
      setLoading(false);
    }
  }, [gameId, options.enabled, options.prefetch]);

  useEffect(() => {
    void fetchAwards();
  }, [fetchAwards]);

  return {
    playerOfTheGame,
    hustlePlayer,
    loading,
    error
  };
}
