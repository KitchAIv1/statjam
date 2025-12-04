/**
 * useTournamentMatchups Hook
 * 
 * PURPOSE: Fetch tournament games (completed + scheduled) with scores
 * - Uses game_stats as source of truth for scores
 * - Caches results for performance
 * - Supports filtering by status
 * 
 * ⚡ PERFORMANCE OPTIMIZATIONS:
 * - Batches game_stats queries (1 query instead of N)
 * - Database-level sorting/limiting (ORDER BY + LIMIT)
 * - Client-side caching with TTL
 * 
 * Follows .cursorrules: <100 lines hook
 */

import { useState, useEffect, useCallback } from 'react';
import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

export interface TournamentMatchup {
  gameId: string;
  teamA: {
    id: string;
    name: string;
    logo?: string;
    score: number;
  };
  teamB: {
    id: string;
    name: string;
    logo?: string;
    score: number;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  gameDate: string;
  gamePhase?: 'regular' | 'playoffs' | 'finals';
}

interface UseTournamentMatchupsOptions {
  status?: 'completed' | 'scheduled' | 'all';
  limit?: number;
}

/**
 * Calculate scores from batched game_stats data
 * Processes all games' stats in memory (no N+1 queries)
 */
function calculateScoresFromBatchedStats(
  allStats: any[],
  gameId: string,
  teamAId: string,
  teamBId: string
): { teamAScore: number; teamBScore: number } {
  // Filter stats for this specific game
  const gameStats = allStats.filter((stat: any) => stat.game_id === gameId);
  
  let teamAScore = 0;
  let teamBScore = 0;

  if (gameStats.length === 0) {
    // No stats found for this game
    return { teamAScore: 0, teamBScore: 0 };
  }

  gameStats.forEach((stat: any) => {
    // Only count made shots (modifier === 'made')
    if (stat.modifier === 'made') {
      const points = Number(stat.stat_value) || 0;
      
      // Check is_opponent_stat for coach mode
      if (stat.is_opponent_stat) {
        teamBScore += points;
      } else if (stat.team_id === teamAId) {
        teamAScore += points;
      } else if (stat.team_id === teamBId) {
        teamBScore += points;
      }
    }
  });

  return { teamAScore, teamBScore };
}

export function useTournamentMatchups(
  tournamentId: string,
  options: UseTournamentMatchupsOptions = {}
) {
  const { status = 'all', limit = 10 } = options;
  const [matchups, setMatchups] = useState<TournamentMatchup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatchups = useCallback(async (skipCache: boolean = false) => {
    if (!tournamentId) {
      setLoading(false);
      return;
    }

    // ✅ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = CacheKeys.tournamentMatchups(tournamentId, status, limit);
      const cachedMatchups = cache.get<TournamentMatchup[]>(cacheKey);
      
      if (cachedMatchups) {
        console.log('⚡ useTournamentMatchups: Using cached matchup data');
        setMatchups(cachedMatchups);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);

      // Build filters object with database-level sorting/limiting
      const filters: Record<string, string> = {
        'tournament_id': `eq.${tournamentId}`,
        'order': 'start_time.desc', // ✅ Database-level sorting
        'limit': limit.toString() // ✅ Database-level limiting
      };

      if (status === 'completed') {
        filters['status'] = 'eq.completed';
      } else if (status === 'scheduled') {
        filters['status'] = 'eq.scheduled';
      }

      // ✅ STEP 1: Fetch games with game_phase (graceful fallback if column doesn't exist)
      let games: any[];
      try {
        games = await hybridSupabaseService.query<any>(
          'games',
          'id,team_a_id,team_b_id,status,start_time,home_score,away_score,game_phase',
          filters
        );
      } catch (error: any) {
        // Fallback: fetch without game_phase if column doesn't exist
        if (error?.message?.includes('game_phase')) {
          games = await hybridSupabaseService.query<any>(
            'games',
            'id,team_a_id,team_b_id,status,start_time,home_score,away_score',
            filters
          );
        } else {
          throw error;
        }
      }

      if (!games || games.length === 0) {
        setMatchups([]);
        setLoading(false);
        return;
      }

      // ✅ STEP 2: Get unique team IDs
      const teamIds = [...new Set([
        ...games.map((g: any) => g.team_a_id),
        ...games.map((g: any) => g.team_b_id)
      ].filter(Boolean))];

      // ✅ STEP 3: Fetch teams with logos (batched)
      const teams = teamIds.length > 0
        ? await hybridSupabaseService.query<any>(
            'teams',
            'id,name,logo_url',
            { 'id': `in.(${teamIds.join(',')})` }
          )
        : [];

      const teamsMap = new Map(teams.map((t: any) => [t.id, {
        id: t.id,
        name: t.name,
        logo: t.logo_url || undefined
      }]));

      // ✅ STEP 4: Fetch stats per-game in parallel (avoids PostgREST 1000 row limit)
      // Similar to useLiveGamesHybrid - each game gets its own query, executed in parallel
      // This avoids truncation when total stats exceed 1000 rows
      console.log(`📊 useTournamentMatchups: Fetching stats for ${games.length} games (per-game queries in parallel)`);
      
      const matchupsData: TournamentMatchup[] = await Promise.all(
        games.map(async (game: any) => {
          const teamA = teamsMap.get(game.team_a_id) || { id: game.team_a_id, name: 'Team A' };
          const teamB = teamsMap.get(game.team_b_id) || { id: game.team_b_id, name: 'Team B' };

          // Calculate scores from stats (source of truth)
          let teamAScore = 0;
          let teamBScore = 0;

          if (game.status === 'completed' || game.status === 'in_progress') {
            try {
              // Fetch stats for THIS specific game only (no 1000 row limit per game)
              const gameStats = await hybridSupabaseService.query<any>(
                'game_stats',
                'game_id,team_id,stat_value,modifier,is_opponent_stat',
                {
                  'game_id': `eq.${game.id}`
                }
              );

              if (gameStats && gameStats.length > 0) {
                // Calculate from stats (source of truth)
                const calculated = calculateScoresFromBatchedStats(
                  gameStats,
                  game.id,
                  game.team_a_id,
                  game.team_b_id
                );
                // ✅ FIX: Use ?? instead of || to handle 0 scores correctly
                teamAScore = calculated.teamAScore ?? game.home_score ?? 0;
                teamBScore = calculated.teamBScore ?? game.away_score ?? 0;
              } else {
                // No stats found - fall back to database scores
                teamAScore = game.home_score ?? 0;
                teamBScore = game.away_score ?? 0;
              }
            } catch (statsError) {
              console.error(`❌ useTournamentMatchups: Error fetching stats for game ${game.id}:`, statsError);
              // Fallback to database scores on error
              teamAScore = game.home_score ?? 0;
              teamBScore = game.away_score ?? 0;
            }
          }

          return {
            gameId: game.id,
            teamA: { ...teamA, score: teamAScore },
            teamB: { ...teamB, score: teamBScore },
            status: game.status,
            gameDate: game.start_time || game.created_at,
            gamePhase: game.game_phase || undefined // Will be undefined if column doesn't exist
          };
        })
      );

      // ✅ Cache the result
      const cacheKey = CacheKeys.tournamentMatchups(tournamentId, status, limit);
      cache.set(cacheKey, matchupsData, CacheTTL.tournamentMatchups);
      console.log('⚡ useTournamentMatchups: Matchups cached for', CacheTTL.tournamentMatchups, 'minutes');
      console.log('📊 useTournamentMatchups: Score summary:', matchupsData.map(m => `${m.teamA.name} ${m.teamA.score}-${m.teamB.score} ${m.teamB.name}`).join(', '));

      setMatchups(matchupsData);
    } catch (error) {
      console.error('Failed to fetch tournament matchups:', error);
      setMatchups([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, status, limit]);

  useEffect(() => {
    fetchMatchups();
  }, [fetchMatchups]);

  return { 
    matchups, 
    loading, 
    refetch: () => fetchMatchups(true) // Skip cache on manual refetch
  };
}
