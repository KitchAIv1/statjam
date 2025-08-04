import { Tournament, TournamentCreateRequest, TournamentUpdateRequest, Team, Player } from '@/lib/types/tournament';
import { supabase } from '@/lib/supabase';

// Tournament Business Logic Layer
export class TournamentService {
  // Tournament CRUD Operations
  static async createTournament(data: TournamentCreateRequest, organizerId: string): Promise<Tournament> {
    try {
      const tournamentData = {
        name: data.name,
        description: data.description,
        status: 'draft' as const,
        start_date: data.startDate,
        end_date: data.endDate,
        venue: data.venue,
        max_teams: data.maxTeams,
        current_teams: 0,
        tournament_type: data.tournamentType,
        is_public: data.isPublic,
        entry_fee: data.entryFee,
        prize_pool: data.prizePool,
        country: data.country,
        organizer_id: organizerId,
      };

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating tournament:', error);
        throw new Error(`Failed to create tournament: ${error.message}`);
      }

      // Map database fields to our Tournament interface
      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || '',
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        venue: tournament.venue,
        maxTeams: tournament.max_teams,
        currentTeams: tournament.current_teams,
        tournamentType: tournament.tournament_type,
        isPublic: tournament.is_public,
        entryFee: tournament.entry_fee,
        prizePool: tournament.prize_pool,
        country: tournament.country,
        organizerId: tournament.organizer_id,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to create tournament');
    }
  }

  static async updateTournament(data: TournamentUpdateRequest): Promise<Tournament> {
    try {
      const updateData: any = {};
      
      // Map frontend fields to database fields
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.venue !== undefined) updateData.venue = data.venue;
      if (data.maxTeams !== undefined) updateData.max_teams = data.maxTeams;
      if (data.tournamentType !== undefined) updateData.tournament_type = data.tournamentType;
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
      if (data.entryFee !== undefined) updateData.entry_fee = data.entryFee;
      if (data.prizePool !== undefined) updateData.prize_pool = data.prizePool;
      if (data.country !== undefined) updateData.country = data.country;

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating tournament:', error);
        throw new Error(`Failed to update tournament: ${error.message}`);
      }

      // Map database fields to our Tournament interface
      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || '',
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        venue: tournament.venue,
        maxTeams: tournament.max_teams,
        currentTeams: tournament.current_teams,
        tournamentType: tournament.tournament_type,
        isPublic: tournament.is_public,
        entryFee: tournament.entry_fee,
        prizePool: tournament.prize_pool,
        country: tournament.country,
        organizerId: tournament.organizer_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to update tournament');
    }
  }

  static async deleteTournament(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting tournament:', error);
        throw new Error(`Failed to delete tournament: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to delete tournament');
    }
  }

  static async getTournament(id: string): Promise<Tournament | null> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(`
          id, name, description, status, start_date, end_date, venue, 
          max_teams, current_teams, tournament_type, is_public, 
          entry_fee, prize_pool, country, organizer_id, created_at, updated_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Supabase error getting tournament:', error);
        throw new Error(`Failed to get tournament: ${error.message}`);
      }

      // Map database fields to our Tournament interface
      return {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || '',
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        venue: tournament.venue,
        maxTeams: tournament.max_teams,
        currentTeams: tournament.current_teams,
        tournamentType: tournament.tournament_type,
        isPublic: tournament.is_public,
        entryFee: tournament.entry_fee,
        prizePool: tournament.prize_pool,
        country: tournament.country,
        organizerId: tournament.organizer_id,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to get tournament');
    }
  }

  static async getTournamentsByOrganizer(organizerId: string): Promise<Tournament[]> {
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          id, name, description, status, start_date, end_date, venue, 
          max_teams, current_teams, tournament_type, is_public, 
          entry_fee, prize_pool, country, organizer_id, created_at, updated_at
        `)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error getting tournaments:', error);
        throw new Error(`Failed to get tournaments: ${error.message}`);
      }

      // Map database fields to our Tournament interface
      return (tournaments || []).map(tournament => ({
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || '',
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        venue: tournament.venue,
        maxTeams: tournament.max_teams,
        currentTeams: tournament.current_teams,
        tournamentType: tournament.tournament_type,
        isPublic: tournament.is_public,
        entryFee: tournament.entry_fee,
        prizePool: tournament.prize_pool,
        country: tournament.country,
        organizerId: tournament.organizer_id,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error getting tournaments by organizer:', error);
      throw error instanceof Error ? error : new Error('Failed to get tournaments');
    }
  }

  // Tournament Statistics
  static async getTournamentStats(organizerId: string) {
    const tournaments = await this.getTournamentsByOrganizer(organizerId);
    
    return {
      totalTournaments: tournaments.length,
      activeTournaments: tournaments.filter(t => t.status === 'active').length,
      draftTournaments: tournaments.filter(t => t.status === 'draft').length,
      completedTournaments: tournaments.filter(t => t.status === 'completed').length,
      totalTeams: tournaments.reduce((sum, t) => sum + t.currentTeams, 0),
      totalPrizePool: tournaments.reduce((sum, t) => sum + t.prizePool, 0),
    };
  }

  // Tournament Validation
  static validateTournamentData(data: Partial<TournamentCreateRequest>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) {
      errors.name = 'Tournament name is required';
    } else if (data.name.length < 3) {
      errors.name = 'Tournament name must be at least 3 characters';
    }

    if (!data.description?.trim()) {
      errors.description = 'Tournament description is required';
    }

    if (!data.venue?.trim()) {
      errors.venue = 'Venue is required';
    }

    if (!data.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!data.endDate) {
      errors.endDate = 'End date is required';
    }

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
      errors.endDate = 'End date must be after start date';
    }

    if (!data.maxTeams || data.maxTeams < 2) {
      errors.maxTeams = 'At least 2 teams required';
    }

    if (data.entryFee && data.entryFee < 0) {
      errors.entryFee = 'Entry fee cannot be negative';
    }

    if (data.prizePool && data.prizePool < 0) {
      errors.prizePool = 'Prize pool cannot be negative';
    }

    return errors;
  }

  // Tournament Status Management
  static canEditTournament(tournament: Tournament): boolean {
    return tournament.status === 'draft';
  }

  static canDeleteTournament(tournament: Tournament): boolean {
    return tournament.status === 'draft' && tournament.currentTeams === 0;
  }

  static canStartTournament(tournament: Tournament): boolean {
    return tournament.status === 'draft' && tournament.currentTeams >= 2;
  }
}

// Team Service
export class TeamService {
  static async createTeam(data: { name: string; coach?: string; tournamentId: string }): Promise<Team> {
    try {
      // Only include fields that exist in the database schema
      const teamData = {
        name: data.name,
        tournament_id: data.tournamentId,
      };

      const { data: team, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating team:', error);
        throw new Error(`Failed to create team: ${error.message}`);
      }

      return {
        id: team.id,
        name: team.name,
        logo: team.logo,
        players: [], // TODO: Implement player fetching
        captain: {
          id: '',
          name: '',
          email: '',
          position: 'PG',
          jerseyNumber: 0,
          isPremium: false,
          country: '',
          createdAt: new Date().toISOString(),
        }, // Default captain until players are added
        coach: data.coach, // Use the coach from input data since it's not in DB
        wins: 0, // Default value since not in DB
        losses: 0, // Default value since not in DB
        tournamentId: team.tournament_id,
        createdAt: team.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error instanceof Error ? error : new Error('Failed to create team');
    }
  }

  static async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
    // TODO: Implement Supabase integration
    // Mock data for now
    return [
      {
        id: '1',
        name: 'Lakers Elite',
        players: [
          { id: '1', name: 'John Smith', email: 'john@example.com', position: 'PG', jerseyNumber: 1, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
          { id: '2', name: 'Mike Johnson', email: 'mike@example.com', position: 'SG', jerseyNumber: 2, isPremium: false, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
          { id: '3', name: 'David Wilson', email: 'david@example.com', position: 'SF', jerseyNumber: 3, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
        ],
        captain: { id: '1', name: 'John Smith', email: 'john@example.com', position: 'PG', jerseyNumber: 1, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
        wins: 5,
        losses: 2,
        tournamentId,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Warriors Pro',
        players: [
          { id: '4', name: 'Chris Davis', email: 'chris@example.com', position: 'PG', jerseyNumber: 4, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
          { id: '5', name: 'Alex Brown', email: 'alex@example.com', position: 'C', jerseyNumber: 5, isPremium: false, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
        ],
        captain: { id: '4', name: 'Chris Davis', email: 'chris@example.com', position: 'PG', jerseyNumber: 4, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
        wins: 4,
        losses: 3,
        tournamentId,
        createdAt: '2024-01-01T00:00:00Z',
      }
    ];
  }

  static async searchPlayers(query: string, country?: string): Promise<Player[]> {
    // TODO: Implement Supabase integration
    // Mock search results
    const allPlayers: Player[] = [
      { id: '1', name: 'John Smith', email: 'john@example.com', position: 'PG', jerseyNumber: 1, isPremium: true, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Mike Johnson', email: 'mike@example.com', position: 'SG', jerseyNumber: 2, isPremium: false, country: 'US', createdAt: '2024-01-01T00:00:00Z' },
      { id: '3', name: 'Sarah Wilson', email: 'sarah@example.com', position: 'SF', jerseyNumber: 3, isPremium: true, country: 'CA', createdAt: '2024-01-01T00:00:00Z' },
    ];

    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(query.toLowerCase()) &&
      (!country || player.country === country)
    );
  }
}