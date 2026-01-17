// ============================================================================
// BREAKDOWN CACHE HOOK - Prefetch & cache player game breakdowns
// Follows .cursorrules: Single responsibility, reusable
// ============================================================================

import { useRef, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PlayerGameStat } from './usePlayerGameBreakdown';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useBreakdownCache(gameIds: string[], prefetchIds: string[] = []) {
  const cache = useRef<Map<string, { data: PlayerGameStat[]; ts: number }>>(new Map());
  const pending = useRef<Map<string, Promise<PlayerGameStat[]>>>(new Map());
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (playerId: string): Promise<PlayerGameStat[]> => {
    if (!playerId || !gameIds.length) return [];

    const [statsRes, gamesRes] = await Promise.all([
      supabase.from('game_stats')
        .select('stat_type, modifier, game_id')
        .in('game_id', gameIds)
        .or(`player_id.eq.${playerId},custom_player_id.eq.${playerId}`)
        .or('is_opponent_stat.eq.false,is_opponent_stat.is.null'),
      supabase.from('games')
        .select('id, start_time, opponent_name')
        .in('id', gameIds)
        .order('start_time', { ascending: false })
    ]);

    if (statsRes.error || gamesRes.error) throw statsRes.error || gamesRes.error;

    const gameMap = new Map<string, PlayerGameStat>();
    for (const g of gamesRes.data || []) {
      gameMap.set(g.id, {
        gameId: g.id, gameDate: g.start_time, opponentName: g.opponent_name || 'Opponent',
        points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
        fgMade: 0, fgAttempts: 0, threePtMade: 0, threePtAttempts: 0, ftMade: 0, ftAttempts: 0,
      });
    }

    for (const s of statsRes.data || []) {
      const g = gameMap.get(s.game_id);
      if (!g) continue;
      const made = s.modifier === 'made';
      switch (s.stat_type) {
        case 'field_goal': case 'two_pointer':
          g.fgAttempts++; if (made) { g.points += 2; g.fgMade++; } break;
        case 'three_pointer': case '3_pointer':
          g.fgAttempts++; g.threePtAttempts++;
          if (made) { g.points += 3; g.fgMade++; g.threePtMade++; } break;
        case 'free_throw': g.ftAttempts++; if (made) { g.points++; g.ftMade++; } break;
        case 'rebound': g.rebounds++; break;
        case 'assist': g.assists++; break;
        case 'steal': g.steals++; break;
        case 'block': g.blocks++; break;
        case 'turnover': g.turnovers++; break;
      }
    }
    return Array.from(gameMap.values());
  }, [gameIds]);

  const getBreakdown = useCallback(async (playerId: string): Promise<PlayerGameStat[]> => {
    const entry = cache.current.get(playerId);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;

    const existing = pending.current.get(playerId);
    if (existing) return existing;

    const promise = fetchData(playerId).then(data => {
      cache.current.set(playerId, { data, ts: Date.now() });
      pending.current.delete(playerId);
      setCachedIds(prev => new Set(prev).add(playerId));
      return data;
    }).catch(err => { pending.current.delete(playerId); throw err; });

    pending.current.set(playerId, promise);
    return promise;
  }, [fetchData]);

  const prefetch = useCallback((id: string) => {
    if (!id || cache.current.has(id)) return;
    getBreakdown(id).catch(() => {});
  }, [getBreakdown]);

  const isCached = useCallback((id: string) => cachedIds.has(id), [cachedIds]);

  // Prefetch specified IDs on mount
  useEffect(() => {
    if (!gameIds.length) return;
    prefetchIds.forEach((id, i) => setTimeout(() => prefetch(id), i * 100));
  }, [gameIds.length, prefetchIds, prefetch]);

  return { getBreakdown, prefetch, isCached, cachedIds };
}
