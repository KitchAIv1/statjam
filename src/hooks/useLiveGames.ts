'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface LiveGameSummary {
  id: string;
  teamAName: string;
  teamBName: string;
  homeScore: number; // assume teamB is home? We map directly from DB home/away fields
  awayScore: number;
  quarter: number;
  minutes: number;
  seconds: number;
  teamAId?: string;
  teamBId?: string;
  organizerName?: string;
  status?: string;
}

/**
 * Fetches live/in-progress games with minimal fields for landing cards
 * Pure data hook; UI layers render with GameCard.
 */
export function useLiveGames() {
  const [games, setGames] = useState<LiveGameSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Track any game that has appeared as live in-session to prevent flicker on pauses
  const seenLiveIdsRef = useRef<Set<string>>(new Set());

  const fetchLive = useCallback(async () => {
    try {
      setLoading((prev) => (prev ? true : false));
      setError(null);
      // Fetch live and overtime games; join minimal team info
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          status,
          quarter,
          game_clock_minutes,
          game_clock_seconds,
          is_clock_running,
          home_score,
          away_score,
          team_a_id,
          team_b_id,
          tournament:tournaments!tournament_id(name),
          team_a:teams!team_a_id(id, name),
          team_b:teams!team_b_id(id, name)
        `)
        // Include common live-like statuses (case variants); ALSO include is_clock_running true
        .or([
          'status.eq.live',
          'status.eq.LIVE',
          'status.eq.in_progress',
          'status.eq.IN_PROGRESS',
          'status.eq.overtime',
          'status.eq.OVERTIME',
          'is_clock_running.eq.true',
        ].join(','))
        .order('updated_at', { ascending: false })
        .limit(24);

      if (error) throw error;

      const baseList: LiveGameSummary[] = (data || []).map((g: any) => ({
        id: g.id,
        teamAName: g.team_a?.name || 'Team A',
        teamBName: g.team_b?.name || 'Team B',
        homeScore: Number(g.home_score ?? 0),
        awayScore: Number(g.away_score ?? 0),
        quarter: Number(g.quarter ?? 1),
        minutes: Number(g.game_clock_minutes ?? 0),
        seconds: Number(g.game_clock_seconds ?? 0),
        teamAId: g.team_a_id,
        teamBId: g.team_b_id,
        organizerName: g.tournament?.name || 'Tournament',
        status: g.status,
      }));

      // Fallback compute scores from game_stats if DB scores are zero
      let mapped: LiveGameSummary[] = baseList;
      try {
        const gameIds = baseList.map(g => g.id);
        if (gameIds.length > 0) {
          const { data: statsData, error: statsErr } = await supabase
            .from('game_stats')
            .select('game_id, team_id, stat_type, modifier')
            .in('game_id', gameIds);
          if (!statsErr && statsData) {
            const tally: Record<string, Record<string, number>> = {};
            for (const s of statsData as any[]) {
              if (s.modifier !== 'made') continue;
              let pts = 0;
              if (s.stat_type === 'three_pointer') pts = 3;
              else if (s.stat_type === 'field_goal') pts = 2;
              else if (s.stat_type === 'free_throw') pts = 1;
              if (!tally[s.game_id]) tally[s.game_id] = {};
              tally[s.game_id][s.team_id] = (tally[s.game_id][s.team_id] || 0) + pts;
            }
            mapped = baseList.map((g) => {
              const agg = tally[g.id] || {};
              const aggHome = g.teamBId ? (agg[g.teamBId] || 0) : 0; // home -> teamBId
              const aggAway = g.teamAId ? (agg[g.teamAId] || 0) : 0; // away -> teamAId
              return {
                ...g,
                homeScore: g.homeScore || aggHome,
                awayScore: g.awayScore || aggAway,
              };
            });
          }
        }
      } catch {
        // ignore stats fallback errors
      }

      // Mark all fetched games as seen-live
      mapped.forEach((m) => seenLiveIdsRef.current.add(m.id));

      // Merge with previous to avoid dropping paused games that were seen before
      // Avoid repaint flash: keep previous array reference as much as possible
      setGames((prev) => {
        const byId = new Map<string, LiveGameSummary>();
        mapped.forEach((g) => byId.set(g.id, g));
        // keep any previously seen-live game if not present in this fetch (e.g., paused clock)
        prev.forEach((g) => {
          if (!byId.has(g.id) && seenLiveIdsRef.current.has(g.id)) {
            byId.set(g.id, g);
          }
        });
        const next = Array.from(byId.values()).slice(0, 24);
        // If shallow-equal, return prev to prevent React re-render flicker
        if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id)) {
          return prev;
        }
        return next;
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load live games');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLive();
    // Realtime subscription to games updates
    const channel = supabase
      .channel('public:games_live_cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload) => {
        try {
          const row: any = payload.new;
          if (!row) return;
          const status = String(row.status || '').toLowerCase();
          const isLiveStatus = ['live', 'in_progress', 'overtime'].includes(status);

          // Remove only when game ends or is cancelled
          if (status === 'completed' || status === 'cancelled') {
            setGames((prev) => prev.filter((g) => g.id !== row.id));
            return;
          }

          // If becoming/remaining live-like: add or update entry
          if (isLiveStatus) {
            seenLiveIdsRef.current.add(row.id);
            const updated: LiveGameSummary = {
              id: row.id,
              teamAName: row.team_a_name || row.team_a?.name || 'Team A',
              teamBName: row.team_b_name || row.team_b?.name || 'Team B',
              homeScore: Number(row.home_score ?? 0),
              awayScore: Number(row.away_score ?? 0),
              quarter: Number(row.quarter ?? 1),
              minutes: Number(row.game_clock_minutes ?? 0),
              seconds: Number(row.game_clock_seconds ?? 0),
            };
            setGames((prev) => {
              const idx = prev.findIndex((g) => g.id === updated.id);
              if (idx === -1) return [updated, ...prev].slice(0, 24);
              const copy = prev.slice();
              copy[idx] = updated;
              return copy;
            });
            return;
          }

          // Otherwise (paused or other transitional statuses): if present, update fields but do not remove
          setGames((prev) => {
            const idx = prev.findIndex((g) => g.id === row.id);
            if (idx === -1) return prev;
            const copy = prev.slice();
            const prevEntry = copy[idx];
            copy[idx] = {
              ...prevEntry,
              homeScore: Number(row.home_score ?? prevEntry.homeScore),
              awayScore: Number(row.away_score ?? prevEntry.awayScore),
              quarter: Number(row.quarter ?? prevEntry.quarter),
              minutes: Number(row.game_clock_minutes ?? prevEntry.minutes),
              seconds: Number(row.game_clock_seconds ?? prevEntry.seconds),
            };
            return copy;
          });
        } catch (_e) {
          // Ignore malformed payloads
        }
      })
      .subscribe();

    // Light polling as fallback
    const t = setInterval(fetchLive, 10000);

    return () => {
      clearInterval(t);
      try { void supabase.removeChannel(channel); } catch { /* noop */ }
    };
  }, [fetchLive]);

  return { games, loading, error, refetch: fetchLive };
}


