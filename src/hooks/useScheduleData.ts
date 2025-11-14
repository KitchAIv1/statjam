import { useEffect, useState, useCallback } from 'react';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { Game } from '@/lib/types/game';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

interface GameWithTeamInfo extends Game {
  teamALogo?: string;
  teamBLogo?: string;
  teamAName?: string;
  teamBName?: string;
}

interface ScheduleDataState {
  games: GameWithTeamInfo[];
  loading: boolean;
  error: string | null;
}

/**
 * ✅ OPTIMIZED: Custom hook for schedule data with batching and caching
 * Reduces N+1 queries from 41 calls to 2 calls (games + batch team info)
 */
export function useScheduleData(tournamentId: string) {
  const [state, setState] = useState<ScheduleDataState>({
    games: [],
    loading: true,
    error: null,
  });

  const loadSchedule = useCallback(async (skipCache: boolean = false) => {
    if (!tournamentId) {
      setState({ games: [], loading: false, error: null });
      return;
    }

    // ✅ Check cache first
    if (!skipCache) {
      const cacheKey = CacheKeys.tournamentSchedule(tournamentId);
      const cachedGames = cache.get<GameWithTeamInfo[]>(cacheKey);
      
      if (cachedGames) {
        console.log('⚡ useScheduleData: Using cached schedule data');
        setState({ games: cachedGames, loading: false, error: null });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // ✅ STEP 1: Fetch all games (1 query)
      console.log('🔍 useScheduleData: Fetching games for tournament:', tournamentId);
      const games = await GameService.getGamesByTournament(tournamentId);

      if (games.length === 0) {
        setState({ games: [], loading: false, error: null });
        return;
      }

      // ✅ STEP 2: Collect unique team IDs
      const teamIds = new Set<string>();
      games.forEach(game => {
        if (game.team_a_id) teamIds.add(game.team_a_id);
        if (game.team_b_id) teamIds.add(game.team_b_id);
      });

      // ✅ STEP 3: Batch fetch all team info (1 query instead of N*2 queries)
      console.log('🔍 useScheduleData: Batch fetching team info for', teamIds.size, 'teams');
      const teamInfoMap = await TeamService.getBatchTeamInfo(Array.from(teamIds));

      // ✅ STEP 4: Map team info to games
      const gamesWithTeamInfo: GameWithTeamInfo[] = games.map(game => {
        const teamAInfo = game.team_a_id ? teamInfoMap.get(game.team_a_id) : null;
        const teamBInfo = game.team_b_id ? teamInfoMap.get(game.team_b_id) : null;

        return {
          ...game,
          teamALogo: teamAInfo?.logo,
          teamBLogo: teamBInfo?.logo,
          teamAName: teamAInfo?.name,
          teamBName: teamBInfo?.name,
        };
      });

      // ✅ Cache the result
      const cacheKey = CacheKeys.tournamentSchedule(tournamentId);
      cache.set(cacheKey, gamesWithTeamInfo, CacheTTL.tournamentSchedule);
      console.log('⚡ useScheduleData: Schedule cached for', CacheTTL.tournamentSchedule, 'minutes');

      setState({ games: gamesWithTeamInfo, loading: false, error: null });
    } catch (error) {
      console.error('❌ useScheduleData: Error loading schedule:', error);
      setState({
        games: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load schedule',
      });
    }
  }, [tournamentId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  return {
    ...state,
    refetch: () => loadSchedule(true),
  };
}

