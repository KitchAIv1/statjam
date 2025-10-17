import { useState, useEffect, useCallback } from 'react';

interface LiveGame {
  id: string;
  status: string;
  quarter: number;
  game_clock_minutes: number;
  game_clock_seconds: number;
  is_clock_running: boolean;
  home_score: number;
  away_score: number;
  team_a_id: string;
  team_b_id: string;
  tournament_id: string;
  team_a_name?: string;
  team_b_name?: string;
  tournament_name?: string;
}

export function useLiveGamesV2() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }

      // Fetch live games using raw fetch
      const gamesResponse = await fetch(
        `${supabaseUrl}/rest/v1/games?select=id,status,quarter,game_clock_minutes,game_clock_seconds,is_clock_running,home_score,away_score,team_a_id,team_b_id,tournament_id&or=(status.eq.live,status.eq.LIVE,status.eq.in_progress,status.eq.IN_PROGRESS,status.eq.overtime,status.eq.OVERTIME,is_clock_running.eq.true)&order=updated_at.desc&limit=24`,
        {
          method: 'GET',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!gamesResponse.ok) {
        throw new Error(`Games fetch failed: ${gamesResponse.status} ${gamesResponse.statusText}`);
      }

      const gamesData = await gamesResponse.json();

      if (!gamesData || gamesData.length === 0) {
        console.log('📝 useLiveGamesV2: No live games found');
        setGames([]);
        return;
      }

      // Get unique team and tournament IDs
      const teamIds = [...new Set([
        ...gamesData.map((g: any) => g.team_a_id),
        ...gamesData.map((g: any) => g.team_b_id)
      ])].filter(Boolean);

      const tournamentIds = [...new Set(gamesData.map((g: any) => g.tournament_id))].filter(Boolean);

      // Fetch team names
      let teamsData: any[] = [];
      if (teamIds.length > 0) {
        const teamsResponse = await fetch(
          `${supabaseUrl}/rest/v1/teams?select=id,name&id=in.(${teamIds.join(',')})`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (teamsResponse.ok) {
          teamsData = await teamsResponse.json();
        }
      }

      // Fetch tournament names
      let tournamentsData: any[] = [];
      if (tournamentIds.length > 0) {
        const tournamentsResponse = await fetch(
          `${supabaseUrl}/rest/v1/tournaments?select=id,name&id=in.(${tournamentIds.join(',')})`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (tournamentsResponse.ok) {
          tournamentsData = await tournamentsResponse.json();
        }
      }

      // Create lookup maps
      const teamsMap = new Map(teamsData.map(t => [t.id, t.name]));
      const tournamentsMap = new Map(tournamentsData.map(t => [t.id, t.name]));

      // Combine data
      const enrichedGames: LiveGame[] = gamesData.map((game: any) => ({
        ...game,
        team_a_name: teamsMap.get(game.team_a_id) || 'Unknown Team',
        team_b_name: teamsMap.get(game.team_b_id) || 'Unknown Team',
        tournament_name: tournamentsMap.get(game.tournament_id) || 'Unknown Tournament'
      }));

      setGames(enrichedGames);

    } catch (e: any) {
      console.error('❌ useLiveGamesV2: Error:', e);
      setError(e?.message || 'Failed to load live games');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    void fetchLiveGames();
  }, [fetchLiveGames]);

  // Polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchLiveGames();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchLiveGames]);

  return { games, loading, error, refetch: fetchLiveGames };
}
