import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { TeamService } from '@/lib/services/tournamentService';

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
  const { user, initialized, loading: authLoading } = useAuthStore();
  const [state, setState] = useState<Omit<TournamentTeamCount, 'refetch'>>({
    currentTeams: 0,
    maxTeams: options.maxTeams || 0,
    loading: true,
    error: null
  });

  const fetchTeamCount = useCallback(async () => {
    if (!user?.id || !tournamentId) {
      console.log('🔍 useTournamentTeamCount: No user ID or tournament ID, skipping fetch');
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔍 useTournamentTeamCount: Fetching team count for tournament:', tournamentId);
      
      // Get teams for this tournament
      const teams = await TeamService.getTeamsByTournament(tournamentId);
      const currentTeams = teams.length;
      
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
  }, [user?.id, tournamentId, options.maxTeams]);

  // Initial data load
  useEffect(() => {
    if (initialized && !authLoading && user?.id && tournamentId) {
      fetchTeamCount();
    }
  }, [initialized, authLoading, user?.id, tournamentId, fetchTeamCount]);

  return {
    ...state,
    refetch: fetchTeamCount
  };
}
