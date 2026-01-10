// ============================================================================
// USE SEASON DETAILS HOOK (<130 lines)
// Purpose: Fetch season with enriched game data + calculated scores
// Follows .cursorrules: Single responsibility, scores from game_stats
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

// ✅ Calculate score from game_stats (source of truth for both manual & video tracking)
function calculateScoreFromStats(
  stats: Array<{ game_id: string; team_id: string | null; stat_type: string; modifier: string | null; is_opponent_stat: boolean }>,
  gameId: string,
  teamId: string | null
): { homeScore: number; awayScore: number } {
  let homeScore = 0, awayScore = 0;

  const gameStats = stats.filter(s => s.game_id === gameId);
  for (const stat of gameStats) {
    if (stat.modifier !== 'made') continue;

    // Calculate points: field_goal=2, three_pointer=3, free_throw=1
    let points = 0;
    if (stat.stat_type === 'field_goal' || stat.stat_type === 'two_pointer') points = 2;
    else if (stat.stat_type === 'three_pointer' || stat.stat_type === '3_pointer') points = 3;
    else if (stat.stat_type === 'free_throw') points = 1;
    else continue;

    // ✅ Handle opponent stats (for coach mode) + team_id matching
    if (stat.is_opponent_stat) {
      awayScore += points;
    } else if (stat.team_id === teamId) {
      homeScore += points;
    } else {
      awayScore += points;
    }
  }

  return { homeScore, awayScore };
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
        .from('seasons').select('*').eq('id', seasonId).single();
      if (seasonError) throw seasonError;
      setSeason(seasonData);

      // Fetch season games with game details
      const { data: seasonGames, error: gamesError } = await supabase
        .from('season_games')
        .select(`
          id, season_id, game_id, is_home_game, game_notes, added_at,
          games:game_id (id, team_a_id, opponent_name, home_score, away_score, start_time, status)
        `)
        .eq('season_id', seasonId)
        .order('added_at', { ascending: false });
      if (gamesError) throw gamesError;

      if (!seasonGames?.length) { setGames([]); return; }

      // ✅ Fetch game_stats for all games to calculate accurate scores
      const gameIds = seasonGames.map(sg => sg.game_id);
      const { data: allStats } = await supabase
        .from('game_stats')
        .select('game_id, team_id, stat_type, modifier, is_opponent_stat')
        .in('game_id', gameIds);

      // Transform to enriched games with calculated scores
      const enriched: SeasonGameEnriched[] = seasonGames.map((sg: any) => {
        const teamId = sg.games?.team_a_id || null;
        const dbHomeScore = sg.games?.home_score || 0;
        const dbAwayScore = sg.games?.away_score || 0;

        // ✅ Calculate scores from game_stats (source of truth)
        const { homeScore, awayScore } = calculateScoreFromStats(allStats || [], sg.game_id, teamId);

        // Use calculated scores if available, fallback to DB scores
        const hasStats = (allStats || []).some(s => s.game_id === sg.game_id);
        
        return {
          id: sg.id,
          season_id: sg.season_id,
          game_id: sg.game_id,
          is_home_game: sg.is_home_game,
          game_notes: sg.game_notes,
          added_at: sg.added_at,
          opponent_name: sg.games?.opponent_name || 'Unknown',
          home_score: hasStats ? homeScore : dbHomeScore,
          away_score: hasStats ? awayScore : dbAwayScore,
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

