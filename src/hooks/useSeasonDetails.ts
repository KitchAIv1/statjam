// ============================================================================
// USE SEASON DETAILS HOOK (<100 lines)
// Purpose: Fetch season with enriched game data
// ✅ FIX: Calculates scores from game_stats (true source of truth)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Season, SeasonGameEnriched } from '@/lib/types/season';

interface UseSeasonDetailsResult {
  season: Season | null;
  games: SeasonGameEnriched[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSeasonDetails(seasonId: string | null): UseSeasonDetailsResult {
  const [season, setSeason] = useState<Season | null>(null);
  const [games, setGames] = useState<SeasonGameEnriched[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasonDetails = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons').select('*').eq('id', seasonId).single();
      if (seasonError) throw seasonError;
      setSeason(seasonData);

      const { data: seasonGames, error: gamesError } = await supabase
        .from('season_games')
        .select(`id, season_id, game_id, is_home_game, game_notes, added_at,
          games:game_id (id, team_a_id, opponent_name, start_time, status)`)
        .eq('season_id', seasonId)
        .order('added_at', { ascending: false });
      if (gamesError) throw gamesError;
      if (!seasonGames?.length) { setGames([]); return; }

      // ✅ FIX: Calculate scores from game_stats (true source of truth)
      const gameIds = seasonGames.map((sg: any) => sg.game_id);
      const { data: allStats } = await supabase
        .from('game_stats')
        .select('game_id, team_id, stat_type, modifier, is_opponent_stat')
        .in('game_id', gameIds)
        .eq('modifier', 'made');

      const scoresByGameId = new Map<string, { home: number; away: number }>();
      for (const sg of seasonGames) {
        const g = (sg as any).games;
        const gameStats = (allStats || []).filter((s: any) => s.game_id === sg.game_id);
        let home = 0, away = 0;
        for (const stat of gameStats) {
          let pts = 0;
          if (stat.stat_type === 'field_goal' || stat.stat_type === 'two_pointer') pts = 2;
          else if (stat.stat_type === 'three_pointer' || stat.stat_type === '3_pointer') pts = 3;
          else if (stat.stat_type === 'free_throw') pts = 1;
          if (stat.is_opponent_stat) away += pts;
          else if (stat.team_id === g?.team_a_id) home += pts;
          else away += pts;
        }
        scoresByGameId.set(sg.game_id, { home, away });
      }

      const enriched: SeasonGameEnriched[] = seasonGames.map((sg: any) => {
        const calc = scoresByGameId.get(sg.game_id) || { home: 0, away: 0 };
        return {
          id: sg.id, season_id: sg.season_id, game_id: sg.game_id,
          is_home_game: sg.is_home_game, game_notes: sg.game_notes, added_at: sg.added_at,
          opponent_name: sg.games?.opponent_name || 'Unknown',
          home_score: calc.home, away_score: calc.away,
          game_date: sg.games?.start_time || sg.added_at,
          status: sg.games?.status || 'unknown',
        };
      });
      setGames(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load season');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => { fetchSeasonDetails(); }, [fetchSeasonDetails]);
  return { season, games, loading, error, refetch: fetchSeasonDetails };
}

