'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatsService } from '@/lib/services/statsService';
import { SubstitutionsService } from '@/lib/services/substitutionsService';
import { transformStatsToPlay } from '@/lib/transformers/statsToPlay';
import { transformSubsToPlay } from '@/lib/transformers/subsToPlay';
import { supabase } from '@/lib/supabase';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';

export function usePlayFeed(gameId: string, teamMap: { teamAId: string; teamBId: string; teamAName: string; teamBName: string }) {
  const [plays, setPlays] = useState<PlayByPlayEntry[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [stats, subs] = await Promise.all([
        StatsService.getByGameId(gameId),
        SubstitutionsService.getByGameId(gameId),
      ]);

      const statsTx = transformStatsToPlay(stats, teamMap);
      const subsTx = transformSubsToPlay(subs, teamMap);

      const merged = [...statsTx.plays, ...subsTx].sort((a, b) => {
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        const ta = (a.gameTimeMinutes || 0) * 60 + (a.gameTimeSeconds || 0);
        const tb = (b.gameTimeMinutes || 0) * 60 + (b.gameTimeSeconds || 0);
        if (ta !== tb) return tb - ta;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setPlays(merged);
      setHomeScore(statsTx.finalHome);
      setAwayScore(statsTx.finalAway);
    } catch (e) {
      setError('Failed to load play feed');
    } finally {
      setLoading(false);
    }
  }, [gameId, teamMap]);

  useEffect(() => {
    if (!gameId) return;
    fetchAll();

    const channel = supabase
      .channel(`play-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
        () => fetchAll()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_substitutions', filter: `game_id=eq.${gameId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchAll]);

  return { plays, homeScore, awayScore, loading, error, refetch: fetchAll };
}

