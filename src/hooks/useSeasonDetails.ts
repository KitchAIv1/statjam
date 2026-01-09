// ============================================================================
// USE SEASON DETAILS HOOK (<100 lines)
// Purpose: Fetch season with enriched game data
// Follows .cursorrules: Single responsibility, <100 lines
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
      // Fetch season
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId)
        .single();

      if (seasonError) throw seasonError;
      setSeason(seasonData);

      // Fetch enriched games
      const { data: seasonGames, error: gamesError } = await supabase
        .from('season_games')
        .select(`
          id,
          season_id,
          game_id,
          is_home_game,
          game_notes,
          added_at,
          games:game_id (
            opponent_name,
            home_score,
            away_score,
            start_time,
            status
          )
        `)
        .eq('season_id', seasonId)
        .order('added_at', { ascending: false });

      if (gamesError) throw gamesError;

      // Transform to enriched games
      const enriched: SeasonGameEnriched[] = (seasonGames || []).map((sg: any) => ({
        id: sg.id,
        season_id: sg.season_id,
        game_id: sg.game_id,
        is_home_game: sg.is_home_game,
        game_notes: sg.game_notes,
        added_at: sg.added_at,
        opponent_name: sg.games?.opponent_name || 'Unknown',
        home_score: sg.games?.home_score || 0,
        away_score: sg.games?.away_score || 0,
        game_date: sg.games?.start_time || sg.added_at,
        status: sg.games?.status || 'unknown',
      }));

      setGames(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load season');
    } finally {
      setLoading(false);
    }
  }, [seasonId]);

  useEffect(() => {
    fetchSeasonDetails();
  }, [fetchSeasonDetails]);

  return { season, games, loading, error, refetch: fetchSeasonDetails };
}

