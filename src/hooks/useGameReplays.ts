/**
 * useGameReplays - Fetch games with video replays
 * 
 * Fetches games where stream_video_id is set AND either:
 * - status = 'completed' (game finished via stat tracker)
 * - stream_ended = true (live stream ended, ready for replay)
 * 
 * ✅ SCORES CALCULATED FROM game_stats (source of truth)
 * - DB columns home_score/away_score are often 0 or stale
 * - Matches calculation logic in useGameViewerV2, useLiveGamesHybrid, etc.
 * 
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
  teamAId?: string;
  teamBId?: string;
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

/**
 * Calculate scores from game_stats - uses stat_value (matches Overview/Overlay)
 * stat_type used as fallback when stat_value is 0
 */
function calculateScoresFromStats(
  stats: { stat_type: string; stat_value?: number; modifier: string; team_id: string; is_opponent_stat?: boolean }[],
  teamAId: string,
  teamBId: string
): { homeScore: number; awayScore: number } {
  let homeScore = 0;
  let awayScore = 0;

  for (const stat of stats) {
    if (stat.modifier !== 'made') continue;

    let points = Number(stat.stat_value) || 0;
    if (points === 0) {
      if (stat.stat_type === 'three_pointer' || stat.stat_type === '3_pointer') {
        points = 3;
      } else if (stat.stat_type === 'free_throw') {
        points = 1;
      } else if (stat.stat_type === 'field_goal' || stat.stat_type === 'two_pointer') {
        points = 2;
      }
    }
    if (points === 0) continue;

    if (stat.is_opponent_stat) {
      awayScore += points;
    } else if (stat.team_id === teamAId) {
      homeScore += points;
    } else if (stat.team_id === teamBId) {
      awayScore += points;
    }
  }

  return { homeScore, awayScore };
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
        // Step 1: Fetch games with video replays
        const { data: gamesData, error: queryError } = await supabase
          .from('games')
          .select(`
            id,
            stream_video_id,
            start_time,
            status,
            stream_ended,
            team_a_id,
            team_b_id,
            home_score,
            away_score,
            team_a:teams!games_team_a_id_fkey(name, logo_url),
            team_b:teams!games_team_b_id_fkey(name, logo_url)
          `)
          .eq('tournament_id', tournamentId)
          .not('stream_video_id', 'is', null)
          .or('status.eq.completed,stream_ended.eq.true')
          .order('start_time', { ascending: false })
          .limit(limit);

        if (queryError) {
          console.error('❌ [useGameReplays] Query error:', queryError.message);
          setError(queryError.message);
          setReplays([]);
          return;
        }

        if (!gamesData || gamesData.length === 0) {
          setReplays([]);
          return;
        }

        // Step 2: Batch fetch game_stats for all games (source of truth for scores)
        const gameIds = gamesData.map(g => g.id);
        const { data: allStats } = await supabase
          .from('game_stats')
          .select('game_id, team_id, stat_type, stat_value, modifier, is_opponent_stat')
          .in('game_id', gameIds)
          .eq('modifier', 'made');

        console.log('[GameReplays] allStats:', allStats?.length, allStats?.[0]);

        // Step 3: Calculate scores from game_stats
        const scoresByGameId = new Map<string, { homeScore: number; awayScore: number }>();
        for (const game of gamesData) {
          const gameStats = (allStats || []).filter(s => s.game_id === game.id);
          const scores = calculateScoresFromStats(gameStats, game.team_a_id, game.team_b_id);
          console.log(`[GameReplays] game ${game.id}: ${gameStats.length} stats, scores:`, scores);
          scoresByGameId.set(game.id, scores);
        }

        // Step 4: Map to GameReplay with calculated scores (fallback to games table when 0-0)
        const mappedReplays: GameReplay[] = gamesData.map((game: any) => {
          const scores = scoresByGameId.get(game.id) || { homeScore: 0, awayScore: 0 };
          const finalHomeScore = (scores.homeScore === 0 && scores.awayScore === 0)
            ? (game.home_score ?? 0)
            : scores.homeScore;
          const finalAwayScore = (scores.homeScore === 0 && scores.awayScore === 0)
            ? (game.away_score ?? 0)
            : scores.awayScore;
          return {
            id: game.id,
            streamVideoId: game.stream_video_id,
            teamAId: game.team_a_id,
            teamBId: game.team_b_id,
            teamAName: game.team_a?.name || 'Team A',
            teamBName: game.team_b?.name || 'Team B',
            teamALogo: game.team_a?.logo_url || null,
            teamBLogo: game.team_b?.logo_url || null,
            homeScore: finalHomeScore,
            awayScore: finalAwayScore,
            gameDate: game.start_time,
            status: game.status,
          };
        });

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
