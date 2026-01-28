import { Tournament, TournamentCreateRequest, TournamentUpdateRequest, Team, Player } from '@/lib/types/tournament';
import { supabase } from '@/lib/supabase';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { logger } from '@/lib/utils/logger';

// Tournament Business Logic Layer
export class TournamentService {
  // Tournament CRUD Operations
  static async createTournament(data: TournamentCreateRequest, organizerId: string): Promise<Tournament> {
    try {
      const tournamentData: any = {
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
        logo: data.logo || null,
      };

      // Add division fields if provided
      if (data.has_divisions !== undefined) {
        tournamentData.has_divisions = data.has_divisions;
      }
      if (data.division_count !== undefined) {
        tournamentData.division_count = data.has_divisions ? data.division_count : null;
      }
      if (data.division_names !== undefined && data.division_names.length > 0) {
        tournamentData.division_names = JSON.stringify(data.division_names);
      }

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert([tournamentData])
        .select()
        .single();

      if (error) {
        logger.error('Supabase error creating tournament:', error);
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
        has_divisions: tournament.has_divisions || false,
        division_count: tournament.division_count || undefined,
        division_names: tournament.division_names 
          ? (typeof tournament.division_names === 'string' 
              ? JSON.parse(tournament.division_names) 
              : tournament.division_names)
          : undefined,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error creating tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to create tournament');
    }
  }

  static async updateTournament(data: TournamentUpdateRequest): Promise<Tournament> {
    try {
      const updateData: any = {};
      
      // Map frontend fields to database fields
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.venue !== undefined) updateData.venue = data.venue;
      if (data.maxTeams !== undefined) updateData.max_teams = data.maxTeams;
      if (data.tournamentType !== undefined) updateData.tournament_type = data.tournamentType;
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic;
      if (data.entryFee !== undefined) updateData.entry_fee = data.entryFee;
      if (data.prizePool !== undefined) updateData.prize_pool = data.prizePool;
      if (data.country !== undefined) updateData.country = data.country;
      if (data.logo !== undefined) updateData.logo = data.logo;
      if (data.has_divisions !== undefined) updateData.has_divisions = data.has_divisions;
      if (data.division_count !== undefined) {
        updateData.division_count = data.has_divisions ? data.division_count : null;
      }
      if (data.division_names !== undefined) {
        updateData.division_names = data.division_names.length > 0 
          ? JSON.stringify(data.division_names) 
          : null;
      }

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        logger.error('Supabase error updating tournament:', error);
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
        has_divisions: tournament.has_divisions || false,
        division_count: tournament.division_count || undefined,
        division_names: tournament.division_names 
          ? (typeof tournament.division_names === 'string' 
              ? JSON.parse(tournament.division_names) 
              : tournament.division_names)
          : undefined,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error updating tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to update tournament');
    }
  }

  static async deleteTournament(id: string): Promise<void> {
    try {
      logger.debug('🗑️ Starting MASTER DELETE tournament deletion process for:', id);

      // Step 0: Get tournament info and validate deletion is allowed
      const tournament = await this.getTournament(id);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Prevent deletion of active tournaments
      if (tournament.status === 'active') {
        throw new Error('Cannot delete an active tournament. Please set it to draft or completed status first.');
      }

      // Step 1: Get all teams for this tournament
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id')
        .eq('tournament_id', id);

      if (teamsError) {
        logger.error('Error fetching teams for deletion:', teamsError);
        throw new Error(`Failed to fetch teams: ${teamsError.message}`);
      }

      const teamIds = teams?.map(team => team.id) || [];
      logger.debug('🗑️ Found teams to delete:', teamIds.length);

      // Step 2: Delete all team_players relationships
      if (teamIds.length > 0) {
        const { error: teamPlayersError } = await supabase
          .from('team_players')
          .delete()
          .in('team_id', teamIds);

        if (teamPlayersError) {
          // If table doesn't exist, log warning but continue (not critical for deletion)
          if (teamPlayersError.code === '42P01') {
            logger.warn('⚠️ team_players table does not exist, skipping team players deletion');
          } else {
            logger.error('Error deleting team players:', teamPlayersError);
            throw new Error(`Failed to delete team players: ${teamPlayersError.message}`);
          }
        } else {
          logger.debug('🗑️ Deleted team_players relationships');
        }
      }

      // Step 3: Delete all game-related data
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('tournament_id', id);

      if (gamesError) {
        logger.error('Error fetching games for deletion:', gamesError);
        throw new Error(`Failed to fetch games: ${gamesError.message}`);
      }

      const gameIds = games?.map(game => game.id) || [];
      logger.debug('🗑️ Found games to delete:', gameIds.length);

      // Step 4: NUCLEAR APPROACH - Find and delete ALL substitutions for this tournament
      // This handles old tournaments with orphaned data or different constraints
      
      logger.debug('🚀 NUCLEAR APPROACH: Finding ALL substitutions for tournament:', id);
      
      // First, get ALL games for this tournament
      const { data: allGames, error: allGamesError } = await supabase
        .from('games')
        .select('id')
        .eq('tournament_id', id);

      if (allGamesError) {
        logger.error('Error fetching all games for deletion:', allGamesError);
        throw new Error(`Failed to fetch all games: ${allGamesError.message}`);
      }

      const allGameIds = allGames?.map(game => game.id) || [];
      logger.debug('🗑️ Found ALL games to delete:', allGameIds.length);
      
      // Note: RLS policy 'game_substitutions_organizer_delete' now allows organizers to delete substitutions
      logger.debug('ℹ️ RLS policy allows organizer deletion - proceeding with standard deletion flow');

      if (allGameIds.length > 0) {
        // MASTER DELETE: Delete ALL tables that reference games(id)
        logger.debug('🔍 DIAGNOSTIC: Game IDs to delete:', allGameIds);
        
        // DIAGNOSTIC: Check what substitutions exist for these games
        const { data: existingSubs, error: checkSubsError } = await supabase
          .from('game_substitutions')
          .select('id, game_id')
          .in('game_id', allGameIds);
        
        if (!checkSubsError) {
          logger.debug('🔍 DIAGNOSTIC: Found substitutions for these games:', existingSubs?.length || 0);
          if (existingSubs && existingSubs.length > 0) {
            logger.debug('🔍 DIAGNOSTIC: Substitution game_ids:', existingSubs.map(s => s.game_id));
          }
        }
        
        // 1. Delete game_stats
        const { error: statsError } = await supabase
          .from('game_stats')
          .delete()
          .in('game_id', allGameIds);

        if (statsError && statsError.code !== '42P01') {
          logger.error('Error deleting game_stats:', statsError);
          throw new Error(`Failed to delete game_stats: ${statsError.message}`);
        }
        logger.debug('🗑️ Deleted game_stats');

        // 2. Delete game_substitutions (now that RLS policy allows organizer DELETE)
        logger.debug('🗑️ Deleting game_substitutions with organizer DELETE policy...');
        const { error: substitutionsError } = await supabase
          .from('game_substitutions')
          .delete()
          .in('game_id', allGameIds);

        if (substitutionsError && substitutionsError.code !== '42P01') {
          logger.error('Error deleting game_substitutions:', substitutionsError);
          throw new Error(`Failed to delete game_substitutions: ${substitutionsError.message}`);
        }
        logger.debug('🗑️ Deleted game_substitutions');
        
        // DIAGNOSTIC: Double-check if any substitutions remain
        const { data: remainingSubs, error: checkRemainingError } = await supabase
          .from('game_substitutions')
          .select('id, game_id')
          .in('game_id', allGameIds);
        
        if (!checkRemainingError && remainingSubs && remainingSubs.length > 0) {
          logger.error('🚨 DIAGNOSTIC: Substitutions still exist after deletion!', remainingSubs);
        } else {
          logger.debug('✅ DIAGNOSTIC: All substitutions successfully deleted');
        }

        // 3. Delete game_timeouts (NEW - this was missing!)
        const { error: timeoutsError } = await supabase
          .from('game_timeouts')
          .delete()
          .in('game_id', allGameIds);

        if (timeoutsError && timeoutsError.code !== '42P01') {
          logger.error('Error deleting game_timeouts:', timeoutsError);
          throw new Error(`Failed to delete game_timeouts: ${timeoutsError.message}`);
        }
        logger.debug('🗑️ Deleted game_timeouts');

        // 4. Delete legacy stats table (if exists) - uses match_id column
        const { error: legacyStatsError } = await supabase
          .from('stats')
          .delete()
          .in('match_id', allGameIds);

        if (legacyStatsError && legacyStatsError.code !== '42P01') {
          logger.error('Error deleting legacy stats:', legacyStatsError);
          throw new Error(`Failed to delete legacy stats: ${legacyStatsError.message}`);
        }
        logger.debug('🗑️ Deleted legacy stats');
      }

      // Delete games (now should work since all references are gone)
      const { error: deleteGamesError } = await supabase
        .from('games')
        .delete()
        .eq('tournament_id', id);

      if (deleteGamesError) {
        logger.error('Error deleting games:', deleteGamesError);
        throw new Error(`Failed to delete games: ${deleteGamesError.message}`);
      }
      logger.debug('🗑️ Deleted games');

      // Step 5: Delete teams
      if (teamIds.length > 0) {
        const { error: deleteTeamsError } = await supabase
          .from('teams')
          .delete()
          .eq('tournament_id', id);

        if (deleteTeamsError) {
          logger.error('Error deleting teams:', deleteTeamsError);
          throw new Error(`Failed to delete teams: ${deleteTeamsError.message}`);
        }
        logger.debug('🗑️ Deleted teams');
      }

      // Step 6: Finally delete the tournament
      const { error: deleteTournamentError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (deleteTournamentError) {
        logger.error('Error deleting tournament:', deleteTournamentError);
        throw new Error(`Failed to delete tournament: ${deleteTournamentError.message}`);
      }

      logger.debug('✅ Tournament deletion completed successfully');
    } catch (error) {
      logger.error('Error in tournament deletion process:', error);
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
          entry_fee, prize_pool, country, organizer_id, created_at, updated_at, logo,
          has_divisions, division_count, division_names
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        logger.error('Supabase error getting tournament:', error);
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
        has_divisions: tournament.has_divisions || false,
        division_count: tournament.division_count || undefined,
        division_names: tournament.division_names 
          ? (typeof tournament.division_names === 'string' 
              ? JSON.parse(tournament.division_names) 
              : tournament.division_names)
          : undefined,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
        logo: tournament.logo || undefined,
      };
    } catch (error) {
      logger.error('Error getting tournament:', error);
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
          entry_fee, prize_pool, country, organizer_id, created_at, updated_at, logo,
          has_divisions, division_count, division_names
        `)
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Supabase error getting tournaments:', error);
        throw new Error(`Failed to get tournaments: ${error.message}`);
      }

      // Map database fields to our Tournament interface
      const mappedTournaments = (tournaments || []).map(tournament => ({
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
        has_divisions: tournament.has_divisions || false,
        division_count: tournament.division_count || undefined,
        division_names: tournament.division_names 
          ? (typeof tournament.division_names === 'string' 
              ? JSON.parse(tournament.division_names) 
              : tournament.division_names)
          : undefined,
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
        logo: tournament.logo || undefined,
      }));

      return mappedTournaments;
    } catch (error) {
      logger.error('Error getting tournaments by organizer:', error);
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
    } else if (data.name.length > 100) {
      errors.name = 'Tournament name cannot exceed 100 characters';
    }

    if (!data.description?.trim()) {
      errors.description = 'Tournament description is required';
    } else if (data.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    if (!data.venue?.trim()) {
      errors.venue = 'Venue is required';
    } else if (data.venue.length > 200) {
      errors.venue = 'Venue cannot exceed 200 characters';
    }

    if (!data.startDate) {
      errors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(data.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for fair comparison
      
      if (startDate < today) {
        errors.startDate = 'Start date cannot be in the past';
      }
    }

    if (!data.endDate) {
      errors.endDate = 'End date is required';
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
      
      // Check if tournament duration is reasonable (max 1 year)
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        errors.endDate = 'Tournament duration cannot exceed 1 year';
      }
    }

    if (!data.maxTeams || data.maxTeams < 2) {
      errors.maxTeams = 'At least 2 teams required';
    } else if (data.maxTeams > 128) {
      errors.maxTeams = 'Maximum 128 teams allowed';
    } else if (data.tournamentType === 'single_elimination' || data.tournamentType === 'double_elimination') {
      // For elimination tournaments, suggest power of 2 for bracket fairness
      const isPowerOf2 = (data.maxTeams & (data.maxTeams - 1)) === 0;
      if (!isPowerOf2) {
        // This is a warning, not an error - still allow it
        // Storing in errors for display, but could be separated into warnings
        errors.maxTeamsWarning = `For elimination tournaments, power of 2 teams (4, 8, 16, 32, 64) creates balanced brackets`;
      }
    }

    if (data.entryFee !== undefined && data.entryFee !== null) {
      if (data.entryFee < 0) {
        errors.entryFee = 'Entry fee cannot be negative';
      } else if (data.entryFee > 10000) {
        errors.entryFee = 'Entry fee cannot exceed $10,000';
      }
    }

    if (data.prizePool !== undefined && data.prizePool !== null) {
      if (data.prizePool < 0) {
        errors.prizePool = 'Prize pool cannot be negative';
      } else if (data.prizePool > 1000000) {
        errors.prizePool = 'Prize pool cannot exceed $1,000,000';
      }
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
  static async createTeam(data: { name: string; coach?: string; logo?: string; tournamentId: string; division?: string; primaryColor?: string; secondaryColor?: string; accentColor?: string }): Promise<Team> {
    try {
      // Only include fields that exist in the database schema
      // Organizer-created teams are auto-approved (no join request needed)
      const teamData: any = {
        name: data.name,
        tournament_id: data.tournamentId,
        logo_url: data.logo || null, // Map logo to logo_url database column
        approval_status: 'approved' as const,
        // Team branding colors
        primary_color: data.primaryColor || '#111827',
        secondary_color: data.secondaryColor || '#999999',
        accent_color: data.accentColor || '#F5D36C',
      };

      // Add division if provided
      if (data.division !== undefined) {
        teamData.division = data.division || null;
      }

      const { data: team, error } = await supabase
        .from('teams')
        .insert([teamData])
        .select('id, name, logo_url, tournament_id, approval_status, division, primary_color, secondary_color, accent_color')
        .single();

      if (error) {
        logger.error('Supabase error creating team:', error);
        throw new Error(`Failed to create team: ${error.message}`);
      }

      // Update the tournament's current_teams count
      await this.updateTournamentTeamCount(data.tournamentId);

      return {
        id: team.id,
        name: team.name,
        logo: team.logo_url || undefined, // Map logo_url from database to logo
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
        coach: '', // Default empty coach since column doesn't exist in DB
        wins: 0, // Default value since not in DB
        losses: 0, // Default value since not in DB
        tournamentId: team.tournament_id,
        division: team.division || undefined, // Include division
        approval_status: team.approval_status || 'approved', // Include approval status
        // Team branding colors
        primaryColor: team.primary_color,
        secondaryColor: team.secondary_color,
        accentColor: team.accent_color,
        createdAt: new Date().toISOString(), // Default since created_at doesn't exist in teams table
      };
    } catch (error) {
      logger.error('Error creating team:', error);
      throw error instanceof Error ? error : new Error('Failed to create team');
    }
  }

  static async deleteTeam(teamId: string): Promise<void> {
    try {
      logger.debug('🔍 TeamService: Deleting team:', teamId);
      
      // First, get the team to verify it's an organizer team and get tournament info
      const { data: teamData, error: teamFetchError } = await supabase
        .from('teams')
        .select('tournament_id, name, coach_id')
        .eq('id', teamId)
        .single();

      if (teamFetchError) {
        logger.error('❌ TeamService: Error fetching team for deletion:', teamFetchError);
        throw new Error(`Failed to fetch team: ${teamFetchError.message}`);
      }

      // ✅ VALIDATION: Only allow deletion of organizer-created teams
      if (teamData.coach_id !== null) {
        throw new Error(
          `Cannot delete team "${teamData.name}". This is a coach-managed team. ` +
          `Only coaches can delete their own teams. Use disconnect to remove it from the tournament.`
        );
      }

      // ✅ VALIDATION: Check for active or scheduled games
      const { data: activeGames, error: gamesError } = await supabase
        .from('games')
        .select('id, status, start_time')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .in('status', ['in_progress', 'scheduled']);

      if (gamesError) {
        logger.error('❌ TeamService: Error checking games:', gamesError);
        throw new Error(`Failed to check team games: ${gamesError.message}`);
      }

      if (activeGames && activeGames.length > 0) {
        const activeCount = activeGames.filter(g => g.status === 'in_progress').length;
        const scheduledCount = activeGames.filter(g => g.status === 'scheduled').length;
        
        throw new Error(
          `Cannot delete team "${teamData.name}". Team has ${activeCount} active game(s) and ${scheduledCount} scheduled game(s). ` +
          `Please cancel or complete all games before deleting the team.`
        );
      }

      // ✅ FIX: Delete all team_players relationships first to avoid foreign key constraint violation
      const { error: teamPlayersError } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', teamId);

      if (teamPlayersError) {
        logger.error('❌ TeamService: Error deleting team players:', teamPlayersError);
        throw new Error(`Failed to delete team players: ${teamPlayersError.message}`);
      }

      // Delete the team
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (deleteError) {
        logger.error('❌ TeamService: Error deleting team:', deleteError);
        throw new Error(`Failed to delete team: ${deleteError.message}`);
      }

      // Update the tournament's current_teams count
      if (teamData?.tournament_id) {
        await this.updateTournamentTeamCount(teamData.tournament_id);
      }

      logger.debug('✅ TeamService: Team deleted successfully:', teamId);
    } catch (error) {
      logger.error('❌ TeamService: Error in deleteTeam:', error);
      throw error instanceof Error ? error : new Error('Failed to delete team');
    }
  }

  /**
   * Disconnect a coach team from tournament (set tournament_id to NULL)
   * Only organizers can disconnect coach teams from their tournaments
   * Coach teams cannot be deleted by organizers, only disconnected
   */
  static async disconnectCoachTeam(teamId: string): Promise<void> {
    try {
      logger.debug('🔍 TeamService: Disconnecting coach team:', teamId);
      
      // First, get the team to verify it's a coach team and get tournament info
      const { data: teamData, error: teamFetchError } = await supabase
        .from('teams')
        .select('tournament_id, name, coach_id')
        .eq('id', teamId)
        .single();

      if (teamFetchError) {
        logger.error('❌ TeamService: Error fetching team for disconnect:', teamFetchError);
        throw new Error(`Failed to fetch team: ${teamFetchError.message}`);
      }

      // ✅ VALIDATION: Only allow disconnecting coach teams
      if (teamData.coach_id === null) {
        throw new Error(
          `Cannot disconnect team "${teamData.name}". This is an organizer-created team. ` +
          `Use delete to permanently remove it from the tournament.`
        );
      }

      // ✅ VALIDATION: Check for active or scheduled games
      const { data: activeGames, error: gamesError } = await supabase
        .from('games')
        .select('id, status, start_time')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .in('status', ['in_progress', 'scheduled']);

      if (gamesError) {
        logger.error('❌ TeamService: Error checking games:', gamesError);
        throw new Error(`Failed to check team games: ${gamesError.message}`);
      }

      if (activeGames && activeGames.length > 0) {
        const activeCount = activeGames.filter(g => g.status === 'in_progress').length;
        const scheduledCount = activeGames.filter(g => g.status === 'scheduled').length;
        
        throw new Error(
          `Cannot disconnect team "${teamData.name}". Team has ${activeCount} active game(s) and ${scheduledCount} scheduled game(s). ` +
          `Please cancel or complete all games before disconnecting the team.`
        );
      }

      // Disconnect the team by setting tournament_id to NULL
      const { error: updateError } = await supabase
        .from('teams')
        .update({ tournament_id: null })
        .eq('id', teamId);

      if (updateError) {
        logger.error('❌ TeamService: Error disconnecting team:', updateError);
        throw new Error(`Failed to disconnect team: ${updateError.message}`);
      }

      // Update the tournament's current_teams count
      if (teamData?.tournament_id) {
        await this.updateTournamentTeamCount(teamData.tournament_id);
      }

      logger.debug('✅ TeamService: Coach team disconnected successfully:', teamId);
    } catch (error) {
      logger.error('❌ TeamService: Error in disconnectCoachTeam:', error);
      throw error instanceof Error ? error : new Error('Failed to disconnect team');
    }
  }

  static async updateTournamentTeamCount(tournamentId: string): Promise<void> {
    try {
      logger.debug('🔍 TeamService: Updating team count for tournament:', tournamentId);
      
      // Get the current count of teams for this tournament
      const { data: teams, error: countError } = await supabase
        .from('teams')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (countError) {
        logger.error('❌ TeamService: Error counting teams:', countError);
        throw new Error(`Failed to count teams: ${countError.message}`);
      }

      const currentTeamsCount = teams?.length || 0;

      // Update the tournament's current_teams field
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_teams: currentTeamsCount })
        .eq('id', tournamentId);

      if (updateError) {
        logger.error('❌ TeamService: Error updating tournament team count:', updateError);
        throw new Error(`Failed to update tournament team count: ${updateError.message}`);
      }

      logger.debug('✅ TeamService: Tournament team count updated:', { tournamentId, currentTeamsCount });
    } catch (error) {
      logger.error('❌ TeamService: Error in updateTournamentTeamCount:', error);
      throw error instanceof Error ? error : new Error('Failed to update tournament team count');
    }
  }

  /**
   * Approve a team's join request
   */
  static async approveTeam(teamId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ approval_status: 'approved' })
        .eq('id', teamId);

      if (error) throw error;
      logger.debug('✅ Team approved successfully');
    } catch (error) {
      logger.error('❌ Error approving team:', error);
      throw error;
    }
  }

  /**
   * Reject a team's join request
   */
  static async rejectTeam(teamId: string): Promise<void> {
    try {
      // Only update approval_status, don't modify tournament_id
      // Coach-owned teams have RLS that prevents organizers from modifying tournament_id
      const { error } = await supabase
        .from('teams')
        .update({ approval_status: 'rejected' })
        .eq('id', teamId);

      if (error) throw error;
      logger.debug('✅ Team rejected successfully');
    } catch (error) {
      logger.error('❌ Error rejecting team:', error);
      throw error;
    }
  }

  /**
   * Update a team (organizer-created teams only)
   */
  static async updateTeam(teamId: string, updates: { name?: string; logo?: string; division?: string }): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.logo !== undefined) updateData.logo_url = updates.logo || null;
      if (updates.division !== undefined) updateData.division = updates.division || null;

      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId);

      if (error) throw error;
      logger.debug('✅ Team updated successfully');
    } catch (error) {
      logger.error('❌ Error updating team:', error);
      throw error;
    }
  }

  static async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
    try {
      logger.debug('🔍 TeamService: Fetching teams for tournament:', tournamentId);
      
      // Query with name column if it exists - includes both regular and custom players
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          logo_url,
          tournament_id,
          approval_status,
          coach_id,
          division,
          team_players (
            player_id,
            custom_player_id,
            users!player_id (
              id,
              email,
              premium_status,
              country,
              created_at,
              name,
              profile_photo_url
            ),
            custom_players!custom_player_id (
              id,
              name,
              jersey_number,
              position,
              profile_photo_url,
              pose_photo_url
            )
          )
        `)
        .eq('tournament_id', tournamentId);

      if (error) {
        logger.error('❌ Supabase error getting teams:', error);
        logger.error('❌ Error details:', error.message, error.details, error.hint);
        throw new Error(`Failed to get teams: ${error.message}`);
      }

      logger.debug('🔍 TeamService: Raw teams data from Supabase:', teams);
      logger.debug('🔍 TeamService: Found teams count:', teams?.length || 0);
      
      if (!teams || teams.length === 0) {
        logger.debug('⚠️ No teams found for tournament:', tournamentId);
        return [];
      }

      // Map database fields to our Team interface (single pass, no N+1 queries)
      const mappedTeams = teams.map((team) => {
        let teamPlayers: Player[] = [];
        let captain: Player = {
          id: '',
          name: '',
          email: '',
          position: 'PG' as const,
          jerseyNumber: 0,
          isPremium: false,
          country: '',
          createdAt: new Date().toISOString(),
        };

        // Process players from the join data (handle both regular and custom players)
        if (team.team_players && Array.isArray(team.team_players) && team.team_players.length > 0) {
          // Process regular players (from users table)
          const regularPlayers = team.team_players
            .filter(tp => tp && tp.users && (
              (Array.isArray(tp.users) && tp.users.length > 0 && tp.users[0]) ||
              (!Array.isArray(tp.users) && (tp.users as any).id)
            ))
            .map((tp, index) => {
              const user = Array.isArray(tp.users) ? tp.users[0] : tp.users;
              const playerName = user.name || 
                (user.email ? 
                  (user.email.includes('@') ? 
                    user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 
                    user.email) : 
                  `Player ${index + 1}`);
              
              return {
                id: user.id,
                name: playerName,
                email: user.email,
                position: 'PG' as Player['position'],
                jerseyNumber: index + 1,
                isPremium: user.premium_status || false,
                country: user.country || 'US',
                createdAt: user.created_at || new Date().toISOString(),
                is_custom_player: false, // ✅ Explicitly mark as regular player (for View Full Profile visibility)
                profilePhotoUrl: user.profile_photo_url || undefined,
              };
            });

          // Process custom players (from custom_players table)
          const customPlayers = team.team_players
            .filter(tp => tp && tp.custom_players && (
              (Array.isArray(tp.custom_players) && tp.custom_players.length > 0 && tp.custom_players[0]) ||
              (!Array.isArray(tp.custom_players) && (tp.custom_players as any).id)
            ))
            .map((tp, index) => {
              const customPlayer = Array.isArray(tp.custom_players) ? tp.custom_players[0] : tp.custom_players;
              
              // ✅ FIX: Ensure profile_photo_url and pose_photo_url are properly extracted
              const profilePhotoUrl = customPlayer?.profile_photo_url || (customPlayer as any)?.profile_photo_url || undefined;
              const posePhotoUrl = customPlayer?.pose_photo_url || (customPlayer as any)?.pose_photo_url || undefined;
              
              return {
                id: customPlayer.id,
                name: customPlayer.name || `Custom Player ${index + 1}`,
                email: '',
                position: (customPlayer.position || 'PG') as Player['position'],
                jerseyNumber: customPlayer.jersey_number || (regularPlayers.length + index + 1),
                isPremium: false,
                country: 'US',
                createdAt: new Date().toISOString(),
                is_custom_player: true, // Mark as custom player
                profilePhotoUrl: profilePhotoUrl,
                posePhotoUrl: posePhotoUrl, // ✅ FIX: Include pose photo URL
              };
            });

          // Combine both types of players
          teamPlayers = [...regularPlayers, ...customPlayers];

          // Set captain as first player
          captain = teamPlayers[0] || captain;
        }

        return {
          id: team.id,
          name: team.name,
          logo: team.logo_url || undefined, // Map logo_url from database to logo
          players: teamPlayers,
          captain: captain,
          coach: '', // Default empty coach since column doesn't exist
          coach_id: team.coach_id || undefined, // Include coach ownership
          wins: 0, // Default value since not in DB schema yet
          losses: 0, // Default value since not in DB schema yet
          tournamentId: team.tournament_id,
          division: team.division || undefined, // Include division
          approval_status: team.approval_status, // Include approval status
          createdAt: new Date().toISOString(), // Default since created_at doesn't exist in teams table
        };
      });

      logger.debug('🔍 TeamService: Mapped teams with players:', mappedTeams.map(t => ({ 
        id: t.id, 
        name: t.name, 
        playerCount: t.players.length,
        players: t.players.map(p => ({ name: p.name, position: p.position, jersey: p.jerseyNumber }))
      })));
      
      return mappedTeams;
    } catch (error) {
      logger.error('Error getting teams by tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to get teams');
    }
  }

  static async getAllPlayers(): Promise<Player[]> {
    try {
      logger.debug('🚀 TeamService: Fetching all available players (optimized)');
      
      // ✅ PHASE 1 OPTIMIZATION: Direct, efficient query with proper error handling
      const { data: playerUsers, error: playersError } = await supabase
        .from('users')
        .select('id, email, role, premium_status, country, created_at, name, profile_photo_url')
        .eq('role', 'player')
        .order('premium_status', { ascending: false }) // Premium players first
        .order('created_at', { ascending: false })
        .limit(100); // Reasonable limit to prevent performance issues

      if (playersError) {
        logger.error('❌ Error fetching players:', playersError.message);
        // Return empty array instead of falling back to expensive operations
        return [];
      }

      if (!playerUsers || playerUsers.length === 0) {
        logger.debug('ℹ️ No players found in database');
        return [];
      }

      logger.debug('✅ Found', playerUsers.length, 'players');
      
      // ✅ PHASE 1 OPTIMIZATION: Efficient mapping without random operations
      const players = playerUsers.map((user, index) => ({
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        position: 'PG' as const, // Default position
        jerseyNumber: index + 1, // Sequential jersey numbers (more predictable)
        isPremium: user.premium_status || false,
        country: user.country || 'US',
        createdAt: user.created_at || new Date().toISOString(),
        profilePhotoUrl: (user as any).profile_photo_url || undefined, // Add photo URL
      }));

      return players;
    } catch (error) {
      logger.error('❌ Error getting all players:', error);
      // Return empty array instead of throwing to prevent modal crashes
      return [];
    }
  }

  static async searchPlayers(query: string, country?: string): Promise<Player[]> {
    try {
      logger.debug('🔍 TeamService: Searching players with query:', query);
      
      const allPlayers = await this.getAllPlayers();
      
      // Filter players by search query
      return allPlayers.filter(player =>
        player.name.toLowerCase().includes(query.toLowerCase()) ||
        player.email.toLowerCase().includes(query.toLowerCase())
      );
      
    } catch (error) {
      logger.error('Error searching players:', error);
      throw error instanceof Error ? error : new Error('Failed to search players');
    }
  }

  // Team-Player Relationship Management
  static async addPlayerToTeam(teamId: string, playerId: string, position?: string, jerseyNumber?: number): Promise<void> {
    try {
      logger.debug('🚀 TeamService: Adding player to team (optimized):', { teamId, playerId });
      logger.debug('⚠️ Note: position and jerseyNumber are ignored as team_players table only has (team_id, player_id)');
      
      // ✅ PHASE 1 OPTIMIZATION: Parallel database calls instead of sequential
      const [teamResult, existingAssignmentsResult] = await Promise.all([
        // Get tournament ID for this team
        supabase
          .from('teams')
          .select('tournament_id')
          .eq('id', teamId)
          .single(),
        
        // Check existing assignments in parallel
        supabase
          .from('team_players')
          .select(`
            team_id,
            teams!inner(tournament_id, name)
          `)
          .eq('player_id', playerId)
      ]);

      // Handle team lookup result
      if (teamResult.error || !teamResult.data) {
        throw new Error(`Failed to get team information: ${teamResult.error?.message}`);
      }

      // Handle existing assignments check
      if (existingAssignmentsResult.error) {
        logger.error('❌ Error checking existing player assignments:', existingAssignmentsResult.error);
        // Don't block the assignment if check fails (fail open)
      } else if (existingAssignmentsResult.data && existingAssignmentsResult.data.length > 0) {
        // Filter for assignments in the same tournament
        const sameTournamentAssignments = existingAssignmentsResult.data.filter(
          (assignment: any) => assignment.teams?.tournament_id === teamResult.data.tournament_id
        );
        
        if (sameTournamentAssignments.length > 0) {
          const existingTeamName = sameTournamentAssignments[0].teams?.name || 'another team';
          throw new Error(
            `Player is already assigned to ${existingTeamName} in this tournament. ` +
            `Please remove them from that team first.`
          );
        }
      }
      
      // Proceed with assignment if validation passed
      const { error } = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          player_id: playerId,
          custom_player_id: null  // ✅ Explicitly set to NULL for regular players
        });

      if (error) {
        logger.error('❌ Supabase error adding player to team:', error);
        throw new Error(`Failed to add player to team: ${error.message}`);
      }

      // ✅ FIX: Invalidate cache so current roster updates immediately
      const cacheKey = CacheKeys.teamPlayers(teamId);
      cache.delete(cacheKey);
      logger.debug('🔄 Invalidated team players cache for team:', teamId);

      logger.debug('✅ Player successfully added to team in database (optimized)');
    } catch (error) {
      logger.error('Error adding player to team:', error);
      throw error instanceof Error ? error : new Error('Failed to add player to team');
    }
  }

  static async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    try {
      logger.debug('🔍 TeamService: Removing player from team:', { teamId, playerId });
      
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', teamId)
        .eq('player_id', playerId);

      if (error) {
        logger.error('❌ Supabase error removing player from team:', error);
        throw new Error(`Failed to remove player from team: ${error.message}`);
      }

      // ✅ FIX: Invalidate cache so current roster updates immediately
      const cacheKey = CacheKeys.teamPlayers(teamId);
      cache.delete(cacheKey);
      logger.debug('🔄 Invalidated team players cache for team:', teamId);

      logger.debug('✅ Player successfully removed from team in database');
    } catch (error) {
      logger.error('Error removing player from team:', error);
      throw error instanceof Error ? error : new Error('Failed to remove player from team');
    }
  }

  static async getTeamPlayers(teamId: string): Promise<Player[]> {
    try {
      logger.debug('🔍 TeamService: Fetching players for team:', teamId);
      
      // Validate team ID to prevent database timeouts
      if (!teamId || teamId === 'undefined' || teamId === 'null' || teamId.trim() === '') {
        logger.warn('⚠️ TeamService: Invalid team ID provided:', teamId);
        return [];
      }

      // Check cache first
      const cacheKey = CacheKeys.teamPlayers(teamId);
      const cachedPlayers = cache.get<Player[]>(cacheKey);
      if (cachedPlayers) {
        logger.debug('✅ TeamService: Returning cached players for team:', teamId, '(count:', cachedPlayers.length, ')');
        return cachedPlayers;
      }
      
      // Step 1: Get both regular and custom player IDs
      const { data: teamPlayers, error } = await supabase
        .from('team_players')
        .select('player_id, custom_player_id')
        .eq('team_id', teamId);

      if (error) {
        logger.error('❌ Supabase error getting team players:', error);
        throw new Error(`Failed to get team players: ${error.message}`);
      }

      if (!teamPlayers || teamPlayers.length === 0) {
        logger.debug('ℹ️ TeamService: No players found for team:', teamId);
        return [];
      }

      // Step 2: Separate regular players and custom players
      const regularPlayerIds = teamPlayers
        .filter(tp => tp.player_id)
        .map(tp => tp.player_id);
      const customPlayerIds = teamPlayers
        .filter(tp => tp.custom_player_id)
        .map(tp => tp.custom_player_id);

      logger.debug('🔍 TeamService: Found player IDs:', regularPlayerIds.length, 'regular,', customPlayerIds.length, 'custom');

      const allPlayers: Player[] = [];

      // Step 3: Fetch regular user data if any exist
      if (regularPlayerIds.length > 0) {
        // Limit to prevent database overload (max 20 players per team)
        const limitedPlayerIds = regularPlayerIds.slice(0, 20);
        
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, premium_status, country, created_at, name, profile_photo_url')
          .in('id', limitedPlayerIds);

        if (usersError) {
          logger.error('❌ Supabase error getting user data:', usersError);
        } else if (users && users.length > 0) {
          // Map regular users to Player interface
          const regularPlayers: Player[] = users.map((user, index) => {
            const playerName = user.name || 
              (user.email ? 
                (user.email.includes('@') ? 
                  user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() : 
                  user.email) : 
                `Player ${index + 1}`);
            
            return {
              id: user.id,
              name: playerName,
              email: user.email,
              position: 'PG' as Player['position'],
              jerseyNumber: index + 1,
              isPremium: user.premium_status || false,
              country: user.country || 'US',
              createdAt: user.created_at || new Date().toISOString(),
              profilePhotoUrl: user.profile_photo_url || undefined,
            };
          });
          allPlayers.push(...regularPlayers);
        }
      }

      // Step 4: Fetch custom player data if any exist
      if (customPlayerIds.length > 0) {
        const limitedCustomIds = customPlayerIds.slice(0, 20);
        
        const { data: customPlayers, error: customError } = await supabase
          .from('custom_players')
          .select('id, name, jersey_number, position')
          .in('id', limitedCustomIds);

        if (customError) {
          logger.error('❌ Supabase error getting custom players:', customError);
        } else if (customPlayers && customPlayers.length > 0) {
          logger.debug('🔍 TeamService: Found custom players:', customPlayers.length);
          
          // Map custom players to Player interface
          const mappedCustomPlayers: Player[] = customPlayers.map((cp, index) => ({
            id: cp.id,
            name: cp.name || `Custom Player ${index + 1}`,
            email: '',
            position: (cp.position || 'PG') as Player['position'],
            jerseyNumber: cp.jersey_number || (allPlayers.length + index + 1),
            isPremium: false,
            country: 'US',
            createdAt: new Date().toISOString(),
          }));
          allPlayers.push(...mappedCustomPlayers);
        }
      }

      logger.debug('🔍 TeamService: Total mapped players:', allPlayers.length, '(' + regularPlayerIds.length + ' regular +', customPlayerIds.length, 'custom)');
      
      // Cache the result for future requests
      cache.set(cacheKey, allPlayers, CacheTTL.PLAYER_DATA);
      logger.debug('💾 TeamService: Cached players for team:', teamId);
      
      return allPlayers;
    } catch (error) {
      logger.error('Error getting team players:', error);
      throw error instanceof Error ? error : new Error('Failed to get team players');
    }
  }

  // Get basic team info by ID
  static async getTeamInfo(teamId: string): Promise<{ id: string; name: string; logo?: string } | null> {
    try {
      logger.debug('🔍 TeamService: Fetching team info for:', teamId);
      
      const { data: team, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .eq('id', teamId)
        .single();

      if (error) {
        logger.error('❌ Supabase error getting team info:', error);
        return null;
      }

      logger.debug('🔍 TeamService: Found team info:', team);
      return {
        id: team.id,
        name: team.name,
        logo: team.logo_url || undefined,
      };
    } catch (error) {
      logger.error('Error getting team info:', error);
      return null;
    }
  }

  // ✅ OPTIMIZATION: Batch fetch team info for multiple teams (reduces N+1 queries)
  static async getBatchTeamInfo(teamIds: string[]): Promise<Map<string, { id: string; name: string; logo?: string }>> {
    try {
      if (teamIds.length === 0) {
        return new Map();
      }

      logger.debug('🔍 TeamService: Batch fetching team info for', teamIds.length, 'teams');
      
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .in('id', teamIds);

      if (error) {
        logger.error('❌ Supabase error batch fetching team info:', error);
        return new Map();
      }

      const teamMap = new Map<string, { id: string; name: string; logo?: string }>();
      (teams || []).forEach(team => {
        teamMap.set(team.id, {
          id: team.id,
          name: team.name,
          logo: team.logo_url || undefined,
        });
      });

      logger.debug('🔍 TeamService: Batch fetched', teamMap.size, 'team infos');
      return teamMap;
    } catch (error) {
      logger.error('Error batch fetching team info:', error);
      return new Map();
    }
  }

  // EMERGENCY FIX: Simple team count query to avoid timeouts
  // Only counts approved teams (excludes pending and rejected)
  static async getTeamCountByTournament(tournamentId: string): Promise<number> {
    try {
      logger.debug('🔍 TeamService: Getting team count for tournament:', tournamentId);
      
      // Count only approved teams (or teams with no approval_status for backwards compatibility)
      const { count, error } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .or('approval_status.is.null,approval_status.eq.approved');

      if (error) {
        logger.error('❌ Error getting team count:', error);
        return 0;
      }

      const teamCount = count || 0;
      logger.debug('✅ TeamService: Team count (approved only):', teamCount);
      return teamCount;
    } catch (error) {
      logger.error('❌ Error in getTeamCountByTournament:', error);
      return 0;
    }
  }

  // Get all stat admins for assignment
  static async getStatAdmins(): Promise<{ id: string; name: string; email: string }[]> {
    try {
      logger.debug('🔍 TeamService: Fetching stat admins');
      
      // Try the query with detailed error logging
      const { data: statAdmins, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'stat_admin');

      if (error) {
        logger.error('❌ Supabase error getting stat admins:', error);
        logger.error('❌ Error message:', error.message);
        logger.error('❌ Error details:', error.details);
        logger.error('❌ Error hint:', error.hint);
        logger.error('❌ Error code:', error.code);
        
        // Try alternative approach - get all users and filter (might work if RLS allows broader access)
        logger.debug('🔄 Trying alternative approach...');
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, role');
          
        if (allUsersError) {
          logger.error('❌ Alternative approach also failed:', allUsersError);
          return [];
        }
        
        logger.debug('🔍 All users found:', allUsers?.length || 0);
        const filteredAdmins = (allUsers || []).filter(user => user.role === 'stat_admin');
        logger.debug('🔍 Filtered stat admins:', filteredAdmins.length);
        
        if (filteredAdmins.length > 0) {
          const admins = filteredAdmins.map(admin => ({
            id: admin.id,
            name: admin.email.split('@')[0],
            email: admin.email
          }));
          logger.debug('🔍 TeamService: Using filtered admins:', admins);
          return admins;
        }
        
        return [];
      }

      logger.debug('🔍 TeamService: Raw stat admins data:', statAdmins);
      logger.debug('🔍 TeamService: Found stat admins count:', statAdmins?.length || 0);
      
      if (!statAdmins || statAdmins.length === 0) {
        logger.debug('⚠️ No stat admins found in database with role filter');
        return [];
      }
      
      // Map to expected format
      const admins = statAdmins.map(admin => ({
        id: admin.id,
        name: admin.email.split('@')[0], // Use email prefix as name
        email: admin.email
      }));

      logger.debug('🔍 TeamService: Mapped stat admins:', admins);
      return admins;
    } catch (error) {
      logger.error('Error getting stat admins:', error);
      return [];
    }
  }

  // Get stat admins assigned to games in a specific tournament
  static async getTournamentStatAdmins(tournamentId: string): Promise<string[]> {
    try {
      logger.debug('🔍 TeamService: Fetching stat admins for tournament:', tournamentId);
      
      const { data: games, error } = await supabase
        .from('games')
        .select('stat_admin_id')
        .eq('tournament_id', tournamentId)
        .not('stat_admin_id', 'is', null);

      if (error) {
        logger.error('❌ Supabase error getting tournament stat admins:', error);
        return [];
      }

      // Extract unique stat admin IDs
      const statAdminIds = [...new Set(
        (games || [])
          .map(game => game.stat_admin_id)
          .filter(id => id !== null)
      )];

      logger.debug('🔍 TeamService: Found stat admins for tournament:', statAdminIds.length, 'unique admins');
      return statAdminIds;
    } catch (error) {
      logger.error('Error getting tournament stat admins:', error);
      return [];
    }
  }

  // Update stat admin assignments for all games in a tournament
  static async updateTournamentStatAdmins(tournamentId: string, statAdminIds: string[]): Promise<boolean> {
    try {
      logger.debug('🔍 TeamService: Updating stat admin assignments for tournament:', tournamentId);
      logger.debug('🔍 TeamService: New assignments:', statAdminIds);

      // Get all games for this tournament
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (gamesError) {
        logger.error('❌ Error fetching tournament games:', gamesError);
        return false;
      }

      if (!games || games.length === 0) {
        logger.debug('ℹ️ No games found for tournament, assignments saved for when games are created');
        return true;
      }

      // If no stat admins assigned, clear all assignments
      if (statAdminIds.length === 0) {
        const { error: clearError } = await supabase
          .from('games')
          .update({ stat_admin_id: null })
          .eq('tournament_id', tournamentId);

        if (clearError) {
          logger.error('❌ Error clearing stat admin assignments:', clearError);
          return false;
        }

        logger.debug('✅ Cleared all stat admin assignments for tournament');
        return true;
      }

      // Assign stat admins to games (round-robin distribution)
      let updatePromises = [];
      for (let i = 0; i < games.length; i++) {
        const statAdminId = statAdminIds[i % statAdminIds.length]; // Round-robin assignment
        updatePromises.push(
          supabase
            .from('games')
            .update({ stat_admin_id: statAdminId })
            .eq('id', games[i].id)
        );
      }

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(result => result.error);

      if (hasErrors) {
        logger.error('❌ Some stat admin assignments failed');
        results.forEach((result, index) => {
          if (result.error) {
            logger.error(`❌ Game ${games[index].id}:`, result.error);
          }
        });
        return false;
      }

      logger.debug('✅ Successfully updated stat admin assignments for tournament');
      return true;
    } catch (error) {
      logger.error('Error updating tournament stat admins:', error);
      return false;
    }
  }

  /**
   * Update player information
   * Note: Player data is stored in the 'users' table, not 'team_players'
   */
  static async updatePlayer(playerId: string, updates: {
    name?: string;
    position?: string;
    jerseyNumber?: number;
  }): Promise<boolean> {
    try {
      logger.debug('🔍 TeamService: Updating player in users table:', playerId, updates);

      const { error } = await supabase
        .from('users')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.position && { position: updates.position }),
          ...(updates.jerseyNumber && { jersey_number: updates.jerseyNumber })
        })
        .eq('id', playerId);

      if (error) {
        logger.error('❌ TeamService: Error updating player:', error);
        throw new Error(`Failed to update player: ${error.message}`);
      }

      logger.debug('✅ TeamService: Player updated successfully in users table');
      return true;
    } catch (error) {
      logger.error('❌ TeamService: Error in updatePlayer:', error);
      return false;
    }
  }
}