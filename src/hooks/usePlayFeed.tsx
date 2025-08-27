'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatsService } from '@/lib/services/statsService';
import { SubstitutionsService } from '@/lib/services/substitutionsService';
import { transformStatsToPlay } from '@/lib/transformers/statsToPlay';
import { transformSubsToPlay } from '@/lib/transformers/subsToPlay';
import { gameSubscriptionManager } from '@/lib/subscriptionManager';
import { supabase } from '@/lib/supabase';
import { PlayByPlayEntry } from '@/lib/types/playByPlay';

export function usePlayFeed(gameId: string, teamMap: { teamAId: string; teamBId: string; teamAName: string; teamBName: string }) {
  const DEBUG_VIEWER = false; // Reduced logging for performance
  const [plays, setPlays] = useState<PlayByPlayEntry[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchAll = useCallback(async () => {
    if (isFetching) {
      console.log('🔄 V2 Feed: fetchAll() called but already fetching, skipping');
      return; // simple throttle
    }
    console.log('🔄 V2 Feed: fetchAll() starting for gameId:', gameId);
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

      // Reduced logging for performance
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 V2 Feed: Updated', merged.length, 'plays, scores:', `${statsTx.finalHome}-${statsTx.finalAway}`);
      }
    } catch (e) {
      setError('Failed to load play feed');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [gameId, teamMap.teamAId, teamMap.teamBId]); // More stable dependencies

  useEffect(() => {
    if (!gameId) return;
    fetchAll();
  }, [gameId, teamMap.teamAId, teamMap.teamBId]);

  // Separate effect for subscriptions to avoid infinite loop
  useEffect(() => {
    if (!gameId) {
      console.log('🔌 V2 Feed: No gameId provided, skipping subscription setup');
      return;
    }

    console.log('🔌 V2 Feed: Setting up subscription for gameId:', gameId);
    
    try {
      const unsubscribe = gameSubscriptionManager.subscribe(gameId, (table: string, payload: any) => {
        console.log('🔔 V2 Feed: Subscription callback received for table:', table);
        if (table === 'game_stats' || table === 'game_substitutions') {
          console.log('🔄 V2 Feed: Triggering fetchAll() for', table, 'update');
          fetchAll();
        } else {
          console.log('🔕 V2 Feed: Ignoring update for table:', table);
        }
      });

      console.log('🔌 V2 Feed: Subscription setup completed, unsubscribe function:', typeof unsubscribe);

      // Test subscription after 2 seconds
      setTimeout(() => {
        console.log('🧪 V2 Feed: Testing if subscription is active...');
        console.log('🧪 V2 Feed: If you see this but no subscription logs when recording stats, RLS might be blocking real-time');
      }, 2000);

      return unsubscribe;
    } catch (error) {
      console.error('❌ V2 Feed: Error setting up subscription:', error);
    }
  }, [gameId, fetchAll]); // Include fetchAll dependency

  return { plays, homeScore, awayScore, loading, error, refetch: fetchAll };
}

