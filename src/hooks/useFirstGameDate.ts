import { useEffect, useState, useCallback } from 'react';
import { GameService } from '@/lib/services/gameService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

/**
 * Returns the earliest game start_time for a tournament.
 * Uses schedule cache when available to avoid duplicate fetches.
 */
export function useFirstGameDate(tournamentId: string): string | null {
  const [firstGameDate, setFirstGameDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tournamentId) return;

    const dateCacheKey = CacheKeys.firstGameDate(tournamentId);
    const cachedDate = cache.get<string>(dateCacheKey);
    if (cachedDate) {
      setFirstGameDate(cachedDate);
      return;
    }

    const scheduleCacheKey = CacheKeys.tournamentSchedule(tournamentId);
    const cachedGames = cache.get<Array<{ start_time?: string | null }>>(scheduleCacheKey);
    if (cachedGames?.length) {
      const earliest = cachedGames
        .map((g) => g.start_time)
        .filter(Boolean)
        .sort()[0];
      if (earliest) {
        cache.set(dateCacheKey, earliest, CacheTTL.firstGameDate);
        setFirstGameDate(earliest);
        return;
      }
    }

    try {
      const games = await GameService.getGamesByTournament(tournamentId);
      const earliest = games
        .map((g) => g.start_time)
        .filter(Boolean)
        .sort()[0];
      if (earliest) {
        cache.set(dateCacheKey, earliest, CacheTTL.firstGameDate);
        setFirstGameDate(earliest);
      }
    } catch {
      setFirstGameDate(null);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  return firstGameDate;
}
