import { useState, useEffect } from 'react';
import { Tournament, TournamentListState, TournamentCreateRequest } from '@/lib/types/tournament';
import { TournamentService } from '@/lib/services/tournamentService';
import { invalidateOrganizerDashboard, invalidateOrganizerTournaments, cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

// Custom Hook for Tournament Data Management
export function useTournaments(user: { id: string } | null) {
  const [state, setState] = useState<TournamentListState>({
    tournaments: [],
    loading: false,
    error: null,
    filter: {
      status: 'all',
      search: '',
    },
  });

  // Load tournaments with caching
  const loadTournaments = async (skipCache: boolean = false) => {
    if (!user || state.loading) {
      console.log('🔍 Skipping tournament load - no user or already loading');
      return;
    }

    // ⚡ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = CacheKeys.organizerTournaments(user.id);
      const cachedTournaments = cache.get<Tournament[]>(cacheKey);
      
      if (cachedTournaments) {
        console.log('⚡ useTournaments: Using cached tournaments data');
        setState(prev => ({
          ...prev,
          tournaments: cachedTournaments,
          loading: false,
          error: null
        }));
        return;
      }
    }

    console.log('🔍 useTournaments: Fetching fresh tournaments data...');

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Always use user.id as organizer_id since that's what we store in database
      const organizerId = user.id;
      console.log('🔍 Using organizer ID:', organizerId);
      
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      
      // ⚡ Store in cache
      const cacheKey = CacheKeys.organizerTournaments(user.id);
      cache.set(cacheKey, tournaments, CacheTTL.organizerTournaments);
      console.log('⚡ useTournaments: Tournaments cached for', CacheTTL.organizerTournaments, 'minutes');
      
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
      const organizerId = user.id;
      const tournament = await TournamentService.createTournament(data, organizerId);
      setState(prev => ({
        ...prev,
        tournaments: [tournament, ...prev.tournaments],
        loading: false
      }));
      
      // ⚡ Invalidate tournaments cache after creation
      invalidateOrganizerTournaments(user.id);
      
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
      
      // ⚡ Invalidate caches after tournament deletion
      if (user?.id) {
        invalidateOrganizerDashboard(user.id);
        invalidateOrganizerTournaments(user.id);
      }
      
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

  // Load tournaments on mount - with dependency optimization
  useEffect(() => {
    if (user?.id && !state.loading) {
      loadTournaments();
    }
  }, [user?.id]);

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
export function useTournamentStats(user: { id: string } | null) {
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
    if (!user) return;

    setLoading(true);
    try {
      const tournamentStats = await TournamentService.getTournamentStats(user.id);
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
  }, [user?.id]);

  return { stats, loading, refreshStats: loadStats };
}