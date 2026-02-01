/**
 * useGameReplays - Fetch completed games with video replays
 * 
 * Fetches games where stream_video_id is set (auto-captured from live stream).
 * Used in Media tab to display game replay thumbnails.
 * 
 * @module useGameReplays
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface GameReplay {
  id: string;
  streamVideoId: string;
  teamAName: string;
  teamBName: string;
  teamALogo: string | null;
  teamBLogo: string | null;
  homeScore: number;
  awayScore: number;
  gameDate: string | null;
  status: string;
}

interface UseGameReplaysOptions {
  limit?: number;
}

export function useGameReplays(tournamentId: string, options?: UseGameReplaysOptions) {
  const [replays, setReplays] = useState<GameReplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = options?.limit ?? 6;

  useEffect(() => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    const fetchReplays = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('games')
          .select(`
            id,
            stream_video_id,
            home_score,
            away_score,
            game_date,
            status,
            team_a:teams!games_team_a_id_fkey(name, logo),
            team_b:teams!games_team_b_id_fkey(name, logo)
          `)
          .eq('tournament_id', tournamentId)
          .eq('status', 'completed')
          .not('stream_video_id', 'is', null)
          .order('game_date', { ascending: false })
          .limit(limit);

        if (queryError) {
          console.error('❌ [useGameReplays] Query error:', queryError.message);
          setError(queryError.message);
          setReplays([]);
          return;
        }

        const mappedReplays: GameReplay[] = (data || []).map((game: any) => ({
          id: game.id,
          streamVideoId: game.stream_video_id,
          teamAName: game.team_a?.name || 'Team A',
          teamBName: game.team_b?.name || 'Team B',
          teamALogo: game.team_a?.logo || null,
          teamBLogo: game.team_b?.logo || null,
          homeScore: game.home_score ?? 0,
          awayScore: game.away_score ?? 0,
          gameDate: game.game_date,
          status: game.status,
        }));

        setReplays(mappedReplays);
      } catch (err: any) {
        console.error('❌ [useGameReplays] Unexpected error:', err.message);
        setError(err.message);
        setReplays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReplays();
  }, [tournamentId, limit]);

  return { replays, loading, error, hasReplays: replays.length > 0 };
}
