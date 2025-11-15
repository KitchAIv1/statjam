/**
 * useTeamStatsOptimized - Optimized Team Statistics Hook with Cache-First Loading + Real-Time Updates
 * 
 * PURPOSE: Cache-aware team stats hook for StatEditModal tabs and Score section
 * - Prevents loading flash by checking cache BEFORE setting loading state
 * - Real-time WebSocket subscriptions for live updates
 * - Reuses existing TeamStatsService logic
 * - Follows same pattern as useTournamentTeams
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { TeamStatsService, TeamStats, PlayerStats } from '@/lib/services/teamStatsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';

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

  // ✅ FIX: Use ref to store latest loadTeamStats function to avoid stale closures in subscription callback
  const loadTeamStatsRef = useRef<((skipCache?: boolean, isRealTimeUpdate?: boolean) => Promise<void>) | null>(null);

  const loadTeamStats = useCallback(async (skipCache: boolean = false, isRealTimeUpdate: boolean = false) => {
    if (!gameId || !teamId) {
      setState({ teamStats: null, onCourtPlayers: [], benchPlayers: [], loading: false, error: null });
      return;
    }

    // ✅ CRITICAL: Check cache FIRST before setting loading=true
    // This prevents the loading skeleton flash on subsequent visits
    // Skip cache check for real-time updates (always get fresh data)
    if (!skipCache && !isRealTimeUpdate) {
      const cacheKey = CacheKeys.teamStats(gameId, teamId);
      const cachedData = cache.get<TeamStatsOptimizedData>(cacheKey);
      
      if (cachedData) {
        console.log('⚡ useTeamStatsOptimized: Using cached team stats data');
        // Set data immediately without loading state
        setState({ ...cachedData, loading: false });
        // ✅ IMPORTANT: Don't return early - subscription still needs to be set up
        // The subscription useEffect will run separately
        return;
      }
    }

    // Only set loading=true if cache miss AND not a real-time update
    // Real-time updates should be silent (no loading spinner)
    if (!isRealTimeUpdate) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    } else {
      // ✅ FIX: Clear error on real-time updates too
      setState(prev => ({ ...prev, error: null }));
    }

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

  // ✅ FIX: Initialize ref immediately with loadTeamStats function
  loadTeamStatsRef.current = loadTeamStats;

  /**
   * Initial data fetch
   */
  useEffect(() => {
    loadTeamStats();
  }, [loadTeamStats]);

  /**
   * ✅ REAL-TIME SUBSCRIPTION: Set up WebSocket subscriptions for live updates
   * Similar to useTeamStats but maintains cache-first loading for initial load
   * ✅ FIX: Use ref to access latest loadTeamStats to avoid stale closures
   */
  useEffect(() => {
    if (!gameId || !teamId) return;

    // ✅ FIX: Ensure ref is initialized before setting up subscription
    loadTeamStatsRef.current = loadTeamStats;

    console.log('🔌 useTeamStatsOptimized: Setting up real-time subscriptions for game:', gameId, 'team:', teamId);
    console.log('🔌 useTeamStatsOptimized: loadTeamStatsRef.current initialized:', !!loadTeamStatsRef.current);
    
    // Use the existing hybrid subscription system
    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
      console.log('🔔 useTeamStatsOptimized: Real-time update received:', table, payload);
      console.log('🔔 useTeamStatsOptimized: loadTeamStatsRef.current available:', !!loadTeamStatsRef.current);
      
      // Only refresh if it's a stats-related update
      if (table === 'game_stats' || table === 'game_substitutions') {
        console.log('🔄 useTeamStatsOptimized: Stats or substitution update, refreshing team data (silent update)');
        // ✅ FIX: Use ref to access latest loadTeamStats function (avoids stale closure)
        if (loadTeamStatsRef.current) {
          console.log('✅ useTeamStatsOptimized: Calling loadTeamStatsRef.current(true, true)');
          void loadTeamStatsRef.current(true, true); // skipCache=true, isRealTimeUpdate=true
        } else {
          console.warn('⚠️ useTeamStatsOptimized: loadTeamStatsRef.current is null, cannot refresh');
        }
      }
    });

    return unsubscribe;
  }, [gameId, teamId, loadTeamStats]); // ✅ Keep loadTeamStats in deps to re-init ref when it changes

  return {
    ...state,
    refetch: () => loadTeamStats(true, false), // Manual refetch: skip cache but show loading
  };
}

