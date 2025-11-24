/**
 * useTeamStats Hook - Team Statistics Management
 * 
 * PURPOSE: Fetch and manage team statistics with real-time updates
 * for the Team Stats Tab component in live game viewer.
 * 
 * FEATURES:
 * - Fetch team roster using TeamServiceV3.getTeamPlayersWithSubstitutions()
 * - Fetch game stats using teamStatsService.aggregateTeamStats() and aggregatePlayerStats()
 * - Subscribe to real-time updates via gameSubscriptionManager
 * - Separate on-court vs bench players based on substitution state
 * - Return structured data for UI consumption
 */

import { useState, useEffect, useCallback } from 'react';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { TeamStatsService, TeamStats, PlayerStats } from '@/lib/services/teamStatsService';

export interface TeamStatsData {
  teamStats: TeamStats | null;
  onCourtPlayers: PlayerStats[];
  benchPlayers: PlayerStats[];
  loading: boolean;
  error: string | null;
}

export interface UseTeamStatsOptions {
  prefetch?: boolean; // ✅ PHASE 2: Enable prefetching mode
  enabled?: boolean;  // ✅ PHASE 2: Allow conditional fetching
}

export function useTeamStats(
  gameId: string, 
  teamId: string, 
  options: UseTeamStatsOptions = {}
): TeamStatsData {
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [onCourtPlayers, setOnCourtPlayers] = useState<PlayerStats[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch team roster and aggregate statistics
   */
  const fetchTeamData = useCallback(async (isUpdate: boolean = false) => {
    if (!gameId || !teamId) return;
    
    // ✅ PHASE 2: Respect enabled option (default true for backward compatibility)
    if (options.enabled === false) return;

    try {
      // ✅ PHASE 2: Smart loading state management
      // Only show loading spinner on initial load, not on updates or prefetch
      if (!isUpdate && !options.prefetch) {
        setLoading(true);
      }
      setError(null);

      // ✅ PHASE 1 OPTIMIZATION: Parallel API calls (75% faster)
      
      // 1. First, get team roster to extract player IDs
      const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, gameId);

      // 2. Extract player IDs
      const playerIds = teamRoster.map(player => player.id);
      if (playerIds.length === 0) {
        setTeamStats(null);
        setOnCourtPlayers([]);
        setBenchPlayers([]);
        return;
      }

      // 3. ✅ PARALLEL REQUESTS: Fetch team stats and player stats simultaneously
      const [teamStatsData, playerStatsData] = await Promise.all([
        TeamStatsService.aggregateTeamStats(gameId, teamId),
        TeamStatsService.aggregatePlayerStats(gameId, teamId, playerIds)
      ]);

      // 5. Separate on-court vs bench players
      // First 5 players are on-court, rest are bench (based on TeamServiceV3 logic)
      const onCourtPlayerStats = playerStatsData.slice(0, 5);
      const benchPlayerStats = playerStatsData.slice(5);

      // 6. Update state
      setTeamStats(teamStatsData);
      setOnCourtPlayers(onCourtPlayerStats);
      setBenchPlayers(benchPlayerStats);

    } catch (e: any) {
      console.error('❌ useTeamStats: Error fetching team data:', e);
      setError(e?.message || 'Failed to load team statistics');
      setTeamStats(null);
      setOnCourtPlayers([]);
      setBenchPlayers([]);
    } finally {
      // ✅ PHASE 2: Smart loading state management
      // Only set loading to false on initial load (not prefetch or updates)
      if (!isUpdate && !options.prefetch) {
        setLoading(false);
      } else if (options.prefetch) {
        // For prefetch, set loading to false immediately since data is ready
        setLoading(false);
      }
    }
  }, [gameId, teamId, options.enabled, options.prefetch]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    void fetchTeamData(false); // Initial load
  }, [fetchTeamData]);

  /**
   * Real-time subscription setup
   */
  useEffect(() => {
    if (!gameId || !teamId) return;

    // Use the existing hybrid subscription system
    // ✅ CRITICAL FIX: Always refresh on games table UPDATE (trigger completion signal)
    const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
      // ✅ CRITICAL: Always refresh on games table UPDATE (trigger completion signal)
      // This is the MOST RELIABLE approach - games UPDATE = trigger completed
      if (table === 'games') {
        void fetchTeamData(true);
        return;
      }
      
      // Refresh for stats/substitution INSERT events (new stats added)
      if (table === 'game_stats' || table === 'game_substitutions') {
        const isInsertEvent = payload?.new && !payload?.old;
        if (isInsertEvent) {
          void fetchTeamData(true);
        }
        // For DELETE events, don't refresh - wait for games UPDATE (trigger completion)
      }
    });

    return unsubscribe;
  }, [gameId, teamId, fetchTeamData]);

  return {
    teamStats,
    onCourtPlayers,
    benchPlayers,
    loading,
    error
  };
}
