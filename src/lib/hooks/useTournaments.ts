import { useState, useEffect } from 'react';
import { Tournament, TournamentListState, TournamentCreateRequest } from '@/lib/types/tournament';
import { TournamentService } from '@/lib/services/tournamentService';
import { useAuthStore } from '@/store/authStore';

// Custom Hook for Tournament Data Management
export function useTournaments() {
  const { user, userProfile } = useAuthStore();
  const [state, setState] = useState<TournamentListState>({
    tournaments: [],
    loading: false,
    error: null,
    filter: {
      status: 'all',
      search: '',
    },
  });

  // Load tournaments
  const loadTournaments = async () => {
    if (!user) return;

    console.log('🔍 Loading tournaments for user:', user.id);
    console.log('🔍 User profile:', userProfile);

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Use user.id directly instead of userProfile.id
      const organizerId = userProfile?.id || user.id;
      console.log('🔍 Using organizer ID:', organizerId);
      
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      console.log('🔍 Loaded tournaments:', tournaments);
      
      setState(prev => ({ ...prev, tournaments, loading: false }));
    } catch (error) {
      console.error('❌ Error loading tournaments:', error);
      setState(prev => ({
        ...prev,
        tournaments: [], // Set empty array to prevent infinite loading
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load tournaments'
      }));
    }
  };

  // Create tournament
  const createTournament = async (data: TournamentCreateRequest): Promise<Tournament | null> => {
    if (!user) return null;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const organizerId = userProfile?.id || user.id;
      const tournament = await TournamentService.createTournament(data, organizerId);
      setState(prev => ({
        ...prev,
        tournaments: [tournament, ...prev.tournaments],
        loading: false
      }));
      return tournament;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create tournament'
      }));
      return null;
    }
  };

  // Delete tournament
  const deleteTournament = async (id: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await TournamentService.deleteTournament(id);
      setState(prev => ({
        ...prev,
        tournaments: prev.tournaments.filter(t => t.id !== id),
        loading: false
      }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete tournament'
      }));
      return false;
    }
  };

  // Filter tournaments
  const filteredTournaments = state.tournaments.filter(tournament => {
    const matchesStatus = state.filter.status === 'all' || tournament.status === state.filter.status;
    const matchesSearch = tournament.name.toLowerCase().includes(state.filter.search.toLowerCase()) ||
                         tournament.venue.toLowerCase().includes(state.filter.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Update filters
  const setFilter = (filter: Partial<TournamentListState['filter']>) => {
    setState(prev => ({
      ...prev,
      filter: { ...prev.filter, ...filter }
    }));
  };

  // Load tournaments on mount
  useEffect(() => {
    loadTournaments();
  }, [user?.id, userProfile?.id]);

  return {
    tournaments: filteredTournaments,
    allTournaments: state.tournaments,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    setFilter,
    loadTournaments,
    createTournament,
    deleteTournament,
  };
}

// Hook for tournament statistics
export function useTournamentStats() {
  const { user, userProfile } = useAuthStore();
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    draftTournaments: 0,
    completedTournaments: 0,
    totalTeams: 0,
    totalPrizePool: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!user || !userProfile) return;

    setLoading(true);
    try {
      const tournamentStats = await TournamentService.getTournamentStats(userProfile.id);
      setStats(tournamentStats);
    } catch (error) {
      console.error('Failed to load tournament stats:', error);
      // Set default stats to prevent infinite loading
      setStats({
        totalTournaments: 0,
        activeTournaments: 0,
        draftTournaments: 0,
        completedTournaments: 0,
        totalTeams: 0,
        totalPrizePool: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user?.id, userProfile?.id]);

  return { stats, loading, refreshStats: loadStats };
}