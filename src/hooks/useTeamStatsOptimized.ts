/**
 * useTeamStatsOptimized - Optimized Team Statistics Hook with Cache-First Loading
 * 
 * PURPOSE: Cache-aware team stats hook for StatEditModal tabs
 * - Prevents loading flash by checking cache BEFORE setting loading state
 * - Reuses existing TeamStatsService logic
 * - Follows same pattern as useTournamentTeams
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useEffect, useState, useCallback } from 'react';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { TeamStatsService, TeamStats, PlayerStats } from '@/lib/services/teamStatsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface TeamStatsOptimizedData {
  teamStats: TeamStats | null;
  onCourtPlayers: PlayerStats[];
  benchPlayers: PlayerStats[];
  loading: boolean;
  error: string | null;
}

export function useTeamStatsOptimized(gameId: string, teamId: string) {
  const [state, setState] = useState<TeamStatsOptimizedData>({
    teamStats: null,
    onCourtPlayers: [],
    benchPlayers: [],
    loading: true,
    error: null,
  });

  const loadTeamStats = useCallback(async (skipCache: boolean = false) => {
    if (!gameId || !teamId) {
      setState({ teamStats: null, onCourtPlayers: [], benchPlayers: [], loading: false, error: null });
      return;
    }

    // ✅ CRITICAL: Check cache FIRST before setting loading=true
    // This prevents the loading skeleton flash on subsequent visits
    if (!skipCache) {
      const cacheKey = CacheKeys.teamStats(gameId, teamId);
      const cachedData = cache.get<TeamStatsOptimizedData>(cacheKey);
      
      if (cachedData) {
        console.log('⚡ useTeamStatsOptimized: Using cached team stats data');
        // Set data immediately without loading state
        setState({ ...cachedData, loading: false });
        return;
      }
    }

    // Only set loading=true if cache miss
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🔍 useTeamStatsOptimized: Fetching team stats for game:', gameId, 'team:', teamId);

      // 1. Get team roster to extract player IDs
      const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, gameId);
      const playerIds = teamRoster.map(player => player.id);
      
      if (playerIds.length === 0) {
        setState({ teamStats: null, onCourtPlayers: [], benchPlayers: [], loading: false, error: null });
        return;
      }

      // 2. Parallel fetch team stats and player stats
      const [teamStatsData, playerStatsData] = await Promise.all([
        TeamStatsService.aggregateTeamStats(gameId, teamId),
        TeamStatsService.aggregatePlayerStats(gameId, teamId, playerIds)
      ]);

      // 3. Separate on-court vs bench players (first 5 are on-court)
      const onCourtPlayerStats = playerStatsData.slice(0, 5);
      const benchPlayerStats = playerStatsData.slice(5);

      const result: TeamStatsOptimizedData = {
        teamStats: teamStatsData,
        onCourtPlayers: onCourtPlayerStats,
        benchPlayers: benchPlayerStats,
        loading: false,
        error: null,
      };

      // ✅ Cache the result
      const cacheKey = CacheKeys.teamStats(gameId, teamId);
      cache.set(cacheKey, result, CacheTTL.teamStats);
      console.log('⚡ useTeamStatsOptimized: Team stats cached for', CacheTTL.teamStats, 'minutes');

      setState(result);
    } catch (error) {
      console.error('❌ useTeamStatsOptimized: Error loading team stats:', error);
      setState({
        teamStats: null,
        onCourtPlayers: [],
        benchPlayers: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load team statistics',
      });
    }
  }, [gameId, teamId]);

  useEffect(() => {
    loadTeamStats();
  }, [loadTeamStats]);

  return {
    ...state,
    refetch: () => loadTeamStats(true),
  };
}

