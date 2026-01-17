// ============================================================================
// USE PLAYER GAME BREAKDOWN HOOK - Fetch per-game stats for a player
// Follows .cursorrules: Single responsibility, <100 lines, reusable
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PlayerGameStat {
  gameId: string;
  gameDate: string;
  opponentName: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fgMade: number;
  fgAttempts: number;
  threePtMade: number;
  threePtAttempts: number;
  ftMade: number;
  ftAttempts: number;
}

interface UsePlayerGameBreakdownResult {
  games: PlayerGameStat[];
  loading: boolean;
  error: string | null;
  fetchBreakdown: (playerId: string, gameIds: string[]) => Promise<void>;
}

export function usePlayerGameBreakdown(): UsePlayerGameBreakdownResult {
  const [games, setGames] = useState<PlayerGameStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async (playerId: string, gameIds: string[]) => {
    if (!playerId || !gameIds.length) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch player stats for these games
      const { data: stats, error: statsErr } = await supabase
        .from('game_stats')
        .select('stat_type, modifier, game_id')
        .in('game_id', gameIds)
        .or(`player_id.eq.${playerId},custom_player_id.eq.${playerId}`)
        .or('is_opponent_stat.eq.false,is_opponent_stat.is.null');
      
      if (statsErr) throw statsErr;

      // Fetch game details (date, teams)
      const { data: gamesData, error: gamesErr } = await supabase
        .from('games')
        .select('id, start_time, team_a_id, team_b_id, teams_a:teams!games_team_a_id_fkey(name), teams_b:teams!games_team_b_id_fkey(name)')
        .in('id', gameIds)
        .order('start_time', { ascending: false });
      
      if (gamesErr) throw gamesErr;

      // Aggregate stats per game
      const gameMap = new Map<string, PlayerGameStat>();
      
      for (const game of gamesData || []) {
        gameMap.set(game.id, {
          gameId: game.id,
          gameDate: game.start_time,
          opponentName: (game.teams_b as any)?.name || 'Opponent',
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, turnovers: 0,
          fgMade: 0, fgAttempts: 0, threePtMade: 0, threePtAttempts: 0, ftMade: 0, ftAttempts: 0,
        });
      }

      for (const stat of stats || []) {
        const g = gameMap.get(stat.game_id);
        if (!g) continue;
        
        const made = stat.modifier === 'made';
        switch (stat.stat_type) {
          case 'field_goal': case 'two_pointer':
            g.fgAttempts++; if (made) { g.points += 2; g.fgMade++; } break;
          case 'three_pointer': case '3_pointer':
            g.fgAttempts++; g.threePtAttempts++;
            if (made) { g.points += 3; g.fgMade++; g.threePtMade++; } break;
          case 'free_throw':
            g.ftAttempts++; if (made) { g.points++; g.ftMade++; } break;
          case 'rebound': g.rebounds++; break;
          case 'assist': g.assists++; break;
          case 'steal': g.steals++; break;
          case 'block': g.blocks++; break;
          case 'turnover': g.turnovers++; break;
        }
      }

      setGames(Array.from(gameMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  return { games, loading, error, fetchBreakdown };
}
