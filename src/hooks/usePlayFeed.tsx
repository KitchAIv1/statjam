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
  const [isFetching, setIsFetching] = useState(false);

  const fetchAll = useCallback(async () => {
    if (isFetching) return; // simple throttle
    setIsFetching(true);
    try {
      setError(null);
      const [stats, subs] = await Promise.all([
        StatsService.getByGameId(gameId),
        SubstitutionsService.getByGameId(gameId),
      ]);

      const statsTx = transformStatsToPlay(stats, teamMap);
      const subsTx = transformSubsToPlay(subs, teamMap);

      const merged = [...statsTx.plays, ...subsTx].sort((a, b) => {
        // Prioritize newest events first by createdAt to ensure visibility of latest non-scoring entries
        const ca = new Date(a.createdAt).getTime();
        const cb = new Date(b.createdAt).getTime();
        if (cb !== ca) return cb - ca;
        // Fallbacks for stable ordering
        if (a.quarter !== b.quarter) return b.quarter - a.quarter;
        const ta = (a.gameTimeMinutes || 0) * 60 + (a.gameTimeSeconds || 0);
        const tb = (b.gameTimeMinutes || 0) * 60 + (b.gameTimeSeconds || 0);
        return tb - ta;
      });

      setPlays(merged);
      setHomeScore(statsTx.finalHome);
      setAwayScore(statsTx.finalAway);

      // Debug: verify counts by type pre/post transform
      if (process.env.NODE_ENV !== 'production') {
        const pre = stats.reduce<Record<string, number>>((acc, s) => { acc[s.stat_type] = (acc[s.stat_type] || 0) + 1; return acc; }, {} as any);
        const post = merged.reduce<Record<string, number>>((acc, p) => { acc[p.statType || p.playType] = (acc[p.statType || p.playType] || 0) + 1; return acc; }, {} as any);
        console.log('🔍 V2 Feed counts:', { preStats: pre, postPlays: post });
      }
    } catch (e) {
      setError('Failed to load play feed');
    } finally {
      setLoading(false);
      setIsFetching(false);
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

    // Fallback polling every 5s as backup
    const poll = setInterval(() => fetchAll(), 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [gameId, fetchAll]);

  return { plays, homeScore, awayScore, loading, error, refetch: fetchAll };
}

