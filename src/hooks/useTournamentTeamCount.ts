import { useState, useEffect, useCallback } from 'react';
import { TeamService } from '@/lib/services/tournamentService';

// EMERGENCY FIX: Global cache to prevent duplicate requests and timeouts
const teamCountCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds
const pendingRequests = new Map<string, Promise<number>>();

interface TournamentTeamCount {
  currentTeams: number;
  maxTeams: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseTournamentTeamCountOptions {
  maxTeams?: number; // Optional: pass maxTeams to avoid extra DB query
}

/**
 * Hook for real-time tournament team count calculation
 * Provides accurate team counts by querying the teams table directly
 */
export function useTournamentTeamCount(
  tournamentId: string, 
  options: UseTournamentTeamCountOptions = {}
): TournamentTeamCount {
  const [state, setState] = useState<Omit<TournamentTeamCount, 'refetch'>>({
    currentTeams: 0,
    maxTeams: options.maxTeams || 0,
    loading: true,
    error: null
  });

  // Initial data load
  useEffect(() => {
    const fetchTeamCount = async () => {
      if (!tournamentId) {
        console.log('🔍 useTournamentTeamCount: No tournament ID, skipping fetch');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        console.log('🔍 useTournamentTeamCount: Fetching team count for tournament:', tournamentId);
        
        // EMERGENCY FIX: Use simple count query instead of complex JOIN
        const currentTeams = await TeamService.getTeamCountByTournament(tournamentId);
        
        // If maxTeams was provided as prop, use it; otherwise fetch from DB
        let maxTeams = options.maxTeams;
        if (maxTeams === undefined) {
          const { data: tournament, error: tournamentError } = await import('@/lib/supabase').then(({ supabase }) => 
            supabase
              .from('tournaments')
              .select('max_teams')
              .eq('id', tournamentId)
              .single()
          );

          if (tournamentError) {
            console.error('❌ useTournamentTeamCount: Error fetching tournament max teams:', tournamentError);
            maxTeams = 8; // Default max teams
          } else {
            maxTeams = tournament.max_teams;
          }
        }

        setState({
          currentTeams,
          maxTeams: maxTeams || 0,
          loading: false,
          error: null
        });
        
        console.log('🔍 useTournamentTeamCount: Team count updated:', { currentTeams, maxTeams });
      } catch (error) {
        console.error('❌ useTournamentTeamCount: Error fetching team count:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch team count'
        }));
      }
    };

    if (tournamentId) {
      fetchTeamCount();
    }
  }, [tournamentId]);

  const refetch = useCallback(async () => {
    if (!tournamentId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const currentTeams = await TeamService.getTeamCountByTournament(tournamentId);
      
      let maxTeams = options.maxTeams;
      if (maxTeams === undefined) {
        const { data: tournament, error: tournamentError } = await import('@/lib/supabase').then(({ supabase }) => 
          supabase
            .from('tournaments')
            .select('max_teams')
            .eq('id', tournamentId)
            .single()
        );

        if (tournamentError) {
          maxTeams = 8; // Default max teams
        } else {
          maxTeams = tournament.max_teams;
        }
      }

      setState({
        currentTeams,
        maxTeams: maxTeams || 0,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch team count'
      }));
    }
  }, [tournamentId]);

  return {
    ...state,
    refetch
  };
}
