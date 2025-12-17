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
import { supabase } from '@/lib/supabase';

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

/**
 * Fallback: Fetch player stats directly from game_stats for a specific game
 * Used when PlayerGameStatsService fails due to RLS (e.g., coach mode games)
 */
async function getPlayerStatsForGame(
  gameId: string,
  playerId: string,
  isCustomPlayer: boolean
): Promise<{ points: number; rebounds: number; assists: number; steals: number; blocks: number }> {
  if (!supabase) return { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
  
  try {
    // Build query based on player type
    let query = supabase
      .from('game_stats')
      .select('stat_type, modifier, stat_value')
      .eq('game_id', gameId)
      .eq('is_opponent_stat', false); // Only team stats, not opponent
    
    if (isCustomPlayer) {
      query = query.eq('custom_player_id', playerId);
    } else {
      query = query.eq('player_id', playerId);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.warn('⚠️ useGameAwards: Fallback stats fetch failed:', error);
      return { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
    }
    
    // Calculate stats from raw game_stats
    let points = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0;
    
    for (const stat of data) {
      switch (stat.stat_type) {
        case 'field_goal':
          if (stat.modifier === 'made') points += 2;
          break;
        case 'three_pointer':
          if (stat.modifier === 'made') points += 3;
          break;
        case 'free_throw':
          if (stat.modifier === 'made') points += 1;
          break;
        case 'rebound':
          rebounds += 1;
          break;
        case 'assist':
          assists += 1;
          break;
        case 'steal':
          steals += 1;
          break;
        case 'block':
          blocks += 1;
          break;
      }
    }
    
    return { points, rebounds, assists, steals, blocks };
  } catch (e) {
    console.warn('⚠️ useGameAwards: Fallback stats exception:', e);
    return { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0 };
  }
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
      
      console.log('🏆 [DEBUG] POTG ID:', potgId, 'isCustom:', potgIsCustom);
      
      if (potgId) {
        fetchPromises.push(
          (async () => {
            const [identity, gameStats] = await Promise.all([
              PlayerDashboardService.getIdentity(potgId, potgIsCustom),
              PlayerGameStatsService.getPlayerGameStats(potgId, potgIsCustom)
            ]);
            
            console.log('🏆 [DEBUG] POTG Identity returned:', {
              name: identity?.name,
              profilePhotoUrl: identity?.profilePhotoUrl,
              posePhotoUrl: identity?.posePhotoUrl,
              fullIdentity: identity
            });
            
            let thisGameStats = gameStats.find(g => g.gameId === gameId);
            
            // ✅ Coach mode fallback: If no stats found (RLS filtered), fetch directly from game_stats
            let stats = {
              points: thisGameStats?.points || 0,
              rebounds: thisGameStats?.rebounds || 0,
              assists: thisGameStats?.assists || 0,
              steals: thisGameStats?.steals || 0,
              blocks: thisGameStats?.blocks || 0
            };
            
            if (!thisGameStats) {
              console.log('🏆 [DEBUG] POTG: Using fallback stats fetch for coach mode');
              stats = await getPlayerStatsForGame(gameId, potgId, potgIsCustom);
            }
            
            setPlayerOfTheGame({
              id: potgId,
              name: identity?.name || 'Unknown Player',
              photoUrl: identity?.profilePhotoUrl,
              jerseyNumber: identity?.jerseyNumber,
              isCustomPlayer: potgIsCustom,
              stats
            });
          })()
        );
      }

      // Hustle Player
      const hustleId = awards.customHustlePlayerId || awards.hustlePlayerId;
      const hustleIsCustom = !!awards.customHustlePlayerId;
      
      console.log('🏆 [DEBUG] Hustle ID:', hustleId, 'isCustom:', hustleIsCustom);
      
      if (hustleId) {
        fetchPromises.push(
          (async () => {
            const [identity, gameStats] = await Promise.all([
              PlayerDashboardService.getIdentity(hustleId, hustleIsCustom),
              PlayerGameStatsService.getPlayerGameStats(hustleId, hustleIsCustom)
            ]);
            
            console.log('🏆 [DEBUG] Hustle Identity returned:', {
              name: identity?.name,
              profilePhotoUrl: identity?.profilePhotoUrl,
              posePhotoUrl: identity?.posePhotoUrl,
              fullIdentity: identity
            });
            
            let thisGameStats = gameStats.find(g => g.gameId === gameId);
            
            // ✅ Coach mode fallback: If no stats found (RLS filtered), fetch directly from game_stats
            let stats = {
              points: thisGameStats?.points || 0,
              rebounds: thisGameStats?.rebounds || 0,
              assists: thisGameStats?.assists || 0,
              steals: thisGameStats?.steals || 0,
              blocks: thisGameStats?.blocks || 0
            };
            
            if (!thisGameStats) {
              console.log('🏆 [DEBUG] Hustle: Using fallback stats fetch for coach mode');
              stats = await getPlayerStatsForGame(gameId, hustleId, hustleIsCustom);
            }
            
            setHustlePlayer({
              id: hustleId,
              name: identity?.name || 'Unknown Player',
              photoUrl: identity?.profilePhotoUrl,
              jerseyNumber: identity?.jerseyNumber,
              isCustomPlayer: hustleIsCustom,
              stats
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
