/**
 * useNextTournamentGame Hook
 * 
 * PURPOSE: Fetch next scheduled game for a tournament with countdown data
 * - Handles all edge cases (no games, completed, live)
 * - Caches results for performance
 * - Returns team details with logos
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useState, useEffect, useCallback } from 'react';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface NextGameData {
  gameId: string;
  startTime: Date;
  teamA: { id: string; name: string; logo?: string };
  teamB: { id: string; name: string; logo?: string };
  venue?: string;
}

export type TournamentGameState = 
  | { type: 'next_game'; data: NextGameData }
  | { type: 'live_now'; count: number }
  | { type: 'starts_soon'; startDate: Date }
  | { type: 'completed'; champion?: string; championLogo?: string }
  | { type: 'no_schedule' };

interface UseNextTournamentGameOptions {
  tournamentStartDate?: string | null;
  tournamentEndDate?: string | null;
  tournamentStatus?: string;
}

export function useNextTournamentGame(
  tournamentId: string,
  options: UseNextTournamentGameOptions = {}
) {
  const [state, setState] = useState<TournamentGameState>({ type: 'no_schedule' });
  const [loading, setLoading] = useState(true);

  const fetchNextGame = useCallback(async () => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    // Check cache
    const cacheKey = `next-game-${tournamentId}`;
    const cached = cache.get<TournamentGameState>(cacheKey);
    if (cached) {
      setState(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch live games count first
      const liveGames = await hybridSupabaseService.query<any>('games', 'id', {
        'tournament_id': `eq.${tournamentId}`,
        'status': 'in.(in_progress,live,LIVE,IN_PROGRESS)'
      });

      if (liveGames && liveGames.length > 0) {
        const result: TournamentGameState = { type: 'live_now', count: liveGames.length };
        cache.set(cacheKey, result, 1); // Short TTL for live state
        setState(result);
        setLoading(false);
        return;
      }

      // Fetch next scheduled game (future games only, sorted by start_time)
      const now = new Date().toISOString();
      const scheduledGames = await hybridSupabaseService.query<any>(
        'games',
        'id,team_a_id,team_b_id,start_time,venue',
        {
          'tournament_id': `eq.${tournamentId}`,
          'status': 'eq.scheduled',
          'start_time': `gte.${now}`,
          'order': 'start_time.asc',
          'limit': '1'
        }
      );

      if (scheduledGames && scheduledGames.length > 0) {
        const game = scheduledGames[0];
        
        // Fetch team details
        const teams = await hybridSupabaseService.query<any>('teams', 'id,name,logo_url', {
          'id': `in.(${game.team_a_id},${game.team_b_id})`
        });
        const teamsMap = new Map(teams.map((t: any) => [t.id, t]));

        const result: TournamentGameState = {
          type: 'next_game',
          data: {
            gameId: game.id,
            startTime: new Date(game.start_time),
            teamA: {
              id: game.team_a_id,
              name: teamsMap.get(game.team_a_id)?.name || 'TBA',
              logo: teamsMap.get(game.team_a_id)?.logo_url
            },
            teamB: {
              id: game.team_b_id,
              name: teamsMap.get(game.team_b_id)?.name || 'TBA',
              logo: teamsMap.get(game.team_b_id)?.logo_url
            },
            venue: game.venue
          }
        };
        cache.set(cacheKey, result, CacheTTL.tournamentMatchups);
        setState(result);
      } else {
        // No upcoming games - check if tournament completed or hasn't started
        const now = new Date();
        
        // If tournament end date is in the future, schedule isn't complete yet
        if (options.tournamentEndDate) {
          const endDate = new Date(options.tournamentEndDate);
          // Add 1 day buffer (end of day)
          endDate.setHours(23, 59, 59, 999);
          if (endDate > now) {
            setState({ type: 'no_schedule' });
            setLoading(false);
            return;
          }
        }

        // Tournament end date has passed - check for finals winner
        try {
          const finalsGame = await hybridSupabaseService.query<any>(
            'games',
            'id,team_a_id,team_b_id,home_score,away_score,status',
            {
              'tournament_id': `eq.${tournamentId}`,
              'game_phase': 'eq.finals',
              'status': 'eq.completed',
              'limit': '1'
            }
          );

          if (finalsGame && finalsGame.length > 0) {
            const game = finalsGame[0];
            const winnerId = game.home_score > game.away_score ? game.team_a_id : game.team_b_id;
            
            // Fetch winner team details
            const teams = await hybridSupabaseService.query<any>('teams', 'id,name,logo_url', {
              'id': `eq.${winnerId}`
            });
            
            const winner = teams?.[0];
            setState({ 
              type: 'completed', 
              champion: winner?.name,
              championLogo: winner?.logo_url
            });
          } else {
            // No finals game - just show completed
            setState({ type: 'completed' });
          }
        } catch {
          // Fallback if game_phase column doesn't exist
          setState({ type: 'completed' });
        }
      }
    } catch (error) {
      console.error('Failed to fetch next game:', error);
      setState({ type: 'no_schedule' });
    } finally {
      setLoading(false);
    }
  }, [tournamentId, options.tournamentStartDate]);

  useEffect(() => {
    fetchNextGame();
  }, [fetchNextGame]);

  return { state, loading, refetch: fetchNextGame };
}

