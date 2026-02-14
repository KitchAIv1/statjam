/**
 * usePublicTeamPage - Single hook for public team page data
 *
 * Returns team profile (metadata, colors, roster) from publicTeamService.
 * Composes service call and loading/error state only.
 */

import { useState, useEffect, useCallback } from 'react';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { getTeamPublicProfile } from '@/lib/services/publicTeamService';
import type { PublicTeamProfile } from '@/lib/services/publicTeamService';

export function usePublicTeamPage(teamId: string, tournamentId: string) {
  const [team, setTeam] = useState<PublicTeamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async (skipCache = false) => {
    if (!teamId || !tournamentId) {
      setLoading(false);
      return;
    }

    const cacheKey = CacheKeys.publicTeamProfile(teamId, tournamentId);
    if (!skipCache) {
      const cached = cache.get<PublicTeamProfile>(cacheKey);
      if (cached) {
        setTeam(cached);
        setLoading(false);
        setError(null);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const profile = await getTeamPublicProfile(teamId, tournamentId);
      if (profile) {
        cache.set(cacheKey, profile, CacheTTL.publicTeamProfile);
      }
      setTeam(profile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load team';
      setError(msg);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId, tournamentId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    loading,
    error,
    refetch: () => fetchTeam(true),
  };
}
