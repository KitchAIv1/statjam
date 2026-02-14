/**
 * useTeamMatchups - Fetch games for one team in a tournament
 *
 * Returns TournamentMatchup[] for games where team is team_a or team_b.
 * Same shape as useTournamentMatchups for TeamMatchupCard compatibility.
 */

import { useState, useEffect, useCallback } from 'react';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';
import { fetchTeamMatchups } from '@/lib/services/teamMatchupsService';
import type { TournamentMatchup } from './useTournamentMatchups';

interface UseTeamMatchupsOptions {
  status?: 'completed' | 'scheduled' | 'all';
  limit?: number;
}

export function useTeamMatchups(
  teamId: string,
  tournamentId: string,
  options: UseTeamMatchupsOptions = {}
) {
  const { status = 'all', limit = 20 } = options;
  const [matchups, setMatchups] = useState<TournamentMatchup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatchups = useCallback(async (skipCache = false) => {
    if (!teamId || !tournamentId) {
      setLoading(false);
      return;
    }

    const cacheKey = CacheKeys.teamMatchups(teamId, tournamentId, status, limit);
    if (!skipCache) {
      const cached = cache.get<TournamentMatchup[]>(cacheKey);
      if (cached) {
        setMatchups(cached);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const data = await fetchTeamMatchups(teamId, tournamentId, { status, limit });
      cache.set(cacheKey, data, CacheTTL.teamMatchups);
      setMatchups(data);
    } catch (error) {
      logger.error('useTeamMatchups failed:', error);
      setMatchups([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, tournamentId, status, limit]);

  useEffect(() => {
    fetchMatchups();
  }, [fetchMatchups]);

  return {
    matchups,
    loading,
    refetch: () => fetchMatchups(true),
  };
}
