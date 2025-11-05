'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LiveGameSummary {
  id: string;
  teamAName: string;
  teamBName: string;
  homeScore: number;
  awayScore: number;
  quarter: number;
  minutes: number;
  seconds: number;
  teamAId?: string;
  teamBId?: string;
  organizerName?: string;
  organizerId?: string;
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
  const [isTabVisible, setIsTabVisible] = useState(true);
  // Track any game that has appeared as live in-session to prevent flicker on pauses
  const seenLiveIdsRef = useRef<Set<string>>(new Set());

  const fetchLive = useCallback(async () => {
    try {
      setLoading((prev) => (prev ? true : false));
      setError(null);
      
      // Simplified query without complex JOINs to avoid RLS performance issues
      if (!supabase) {
        throw new Error('Supabase client is null - client creation failed!');
      }
      
      if (typeof supabase.from !== 'function') {
        throw new Error('Supabase client is malformed - missing .from() method!');
      }

      const queryBuilder = supabase.from('games');
      const selectQuery = queryBuilder.select('id');
      const limitQuery = selectQuery.limit(1);
      
      // Test simple query first
      const simpleQueryPromise = limitQuery;
      const simpleTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Simple query timeout after 3 seconds')), 3000)
      );
      
      try {
        const { data: simpleData, error: simpleError } = await Promise.race([simpleQueryPromise, simpleTimeoutPromise]);
        
        if (simpleError) {
          throw simpleError;
        }
      } catch (e) {
        throw e;
      }
    
    // Add timeout to prevent infinite hanging
    const queryPromise = supabase
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
        tournament_id
      `)
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
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
    );
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        throw error;
      }

      // Fetch team and tournament names separately to avoid JOIN timeout
      const teamIds = [...new Set([
        ...data.map(g => g.team_a_id),
        ...data.map(g => g.team_b_id)
      ].filter(Boolean))];
      
      const tournamentIds = [...new Set(data.map(g => g.tournament_id).filter(Boolean))];
      
      // Fetch teams and tournaments in parallel
      const [teamsResult, tournamentsResult] = await Promise.all([
        teamIds.length > 0 ? supabase.from('teams').select('id, name').in('id', teamIds) : { data: [] },
        tournamentIds.length > 0 ? supabase.from('tournaments').select('id, name').in('id', tournamentIds) : { data: [] }
      ]);
      
      const teamsMap = new Map((teamsResult.data || []).map(t => [t.id, t.name]));
      const tournamentsMap = new Map((tournamentsResult.data || []).map(t => [t.id, t.name]));

      const baseList: LiveGameSummary[] = (data || []).map((g: any) => ({
        id: g.id,
        teamAName: teamsMap.get(g.team_a_id) || 'Team A',
        teamBName: teamsMap.get(g.team_b_id) || 'Team B',
        homeScore: Number(g.home_score ?? 0),
        awayScore: Number(g.away_score ?? 0),
        quarter: Number(g.quarter ?? 1),
        minutes: Number(g.game_clock_minutes ?? 0),
        seconds: Number(g.game_clock_seconds ?? 0),
        teamAId: g.team_a_id,
        teamBId: g.team_b_id,
        organizerName: tournamentsMap.get(g.tournament_id) || 'Tournament',
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
  }, [fetchLive]);

  // ⏰ TEMPORARY: Use polling instead of WebSocket subscriptions
  // Reason: Supabase replication is "coming soon" - WebSockets need replication
  useEffect(() => {
    if (!isTabVisible) return;
    
    const interval = setInterval(() => {
      void fetchLive();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [fetchLive, isTabVisible]);

  // Tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return { games, loading, error, refetch: fetchLive };
}