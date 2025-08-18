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
        createdAt: tournament.created_at || new Date().toISOString(),
        updatedAt: tournament.updated_at || new Date().toISOString(),
      }));

      return mappedTournaments;
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

      // Update the tournament's current_teams count
      await this.updateTournamentTeamCount(data.tournamentId);

      return {
        id: team.id,
        name: team.name,
        logo: '', // Default empty logo since column doesn't exist
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
        createdAt: new Date().toISOString(), // Default since created_at doesn't exist in teams table
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error instanceof Error ? error : new Error('Failed to create team');
    }
  }

  static async deleteTeam(teamId: string): Promise<void> {
    try {
      console.log('🔍 TeamService: Deleting team:', teamId);
      
      // First, get the team to know which tournament it belongs to for count update
      const { data: teamData, error: teamFetchError } = await supabase
        .from('teams')
        .select('tournament_id')
        .eq('id', teamId)
        .single();

      if (teamFetchError) {
        console.error('❌ TeamService: Error fetching team for deletion:', teamFetchError);
        throw new Error(`Failed to fetch team: ${teamFetchError.message}`);
      }

      // Delete the team
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (deleteError) {
        console.error('❌ TeamService: Error deleting team:', deleteError);
        throw new Error(`Failed to delete team: ${deleteError.message}`);
      }

      // Update the tournament's current_teams count
      if (teamData?.tournament_id) {
        await this.updateTournamentTeamCount(teamData.tournament_id);
      }

      console.log('✅ TeamService: Team deleted successfully:', teamId);
    } catch (error) {
      console.error('❌ TeamService: Error in deleteTeam:', error);
      throw error instanceof Error ? error : new Error('Failed to delete team');
    }
  }

  static async updateTournamentTeamCount(tournamentId: string): Promise<void> {
    try {
      console.log('🔍 TeamService: Updating team count for tournament:', tournamentId);
      
      // Get the current count of teams for this tournament
      const { data: teams, error: countError } = await supabase
        .from('teams')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (countError) {
        console.error('❌ TeamService: Error counting teams:', countError);
        throw new Error(`Failed to count teams: ${countError.message}`);
      }

      const currentTeamsCount = teams?.length || 0;

      // Update the tournament's current_teams field
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_teams: currentTeamsCount })
        .eq('id', tournamentId);

      if (updateError) {
        console.error('❌ TeamService: Error updating tournament team count:', updateError);
        throw new Error(`Failed to update tournament team count: ${updateError.message}`);
      }

      console.log('✅ TeamService: Tournament team count updated:', { tournamentId, currentTeamsCount });
    } catch (error) {
      console.error('❌ TeamService: Error in updateTournamentTeamCount:', error);
      throw error instanceof Error ? error : new Error('Failed to update tournament team count');
    }
  }

  static async getTeamsByTournament(tournamentId: string): Promise<Team[]> {
    try {
      console.log('🔍 TeamService: Fetching teams for tournament:', tournamentId);
      
      // Query with name column if it exists
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          tournament_id,
          team_players (
            player_id,
            users!player_id (
              id,
              email,
              premium_status,
              country,
              created_at,
              name
            )
          )
        `)
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('❌ Supabase error getting teams:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        throw new Error(`Failed to get teams: ${error.message}`);
      }

      console.log('🔍 TeamService: Raw teams data from Supabase:', teams);
      console.log('🔍 TeamService: Found teams count:', teams?.length || 0);
      
      if (!teams || teams.length === 0) {
        console.log('⚠️ No teams found for tournament:', tournamentId);
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

        // Process players from the join data (handle null/empty team_players)
        if (team.team_players && Array.isArray(team.team_players) && team.team_players.length > 0) {
          const validTeamPlayers = team.team_players.filter(tp => {
            // Handle both array and object responses from Supabase
            return tp && tp.users && (
              (Array.isArray(tp.users) && tp.users.length > 0 && tp.users[0]) ||
              (!Array.isArray(tp.users) && tp.users.id)
            );
          });

          teamPlayers = validTeamPlayers.map((tp, index) => {
            // Handle both array and object responses from Supabase
            const user = Array.isArray(tp.users) ? tp.users[0] : tp.users;
            
            // Generate player name using actual name column if available, otherwise use email
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
              position: 'PG' as Player['position'], // Default position (columns don't exist in DB yet)
              jerseyNumber: index + 1, // Sequential jersey numbers (column doesn't exist in DB yet)
              isPremium: user.premium_status || false,
              country: user.country || 'US',
              createdAt: user.created_at || new Date().toISOString(),
            };
          });

          // Set captain as first player
          captain = teamPlayers[0] || captain;
        }

        return {
          id: team.id,
          name: team.name,
          logo: '', // Default empty logo since column doesn't exist
          players: teamPlayers,
          captain: captain,
          coach: '', // Default empty coach since column doesn't exist
          wins: 0, // Default value since not in DB schema yet
          losses: 0, // Default value since not in DB schema yet
          tournamentId: team.tournament_id,
          createdAt: new Date().toISOString(), // Default since created_at doesn't exist in teams table
        };
      });

      console.log('🔍 TeamService: Mapped teams with players:', mappedTeams.map(t => ({ 
        id: t.id, 
        name: t.name, 
        playerCount: t.players.length,
        players: t.players.map(p => ({ name: p.name, position: p.position, jersey: p.jerseyNumber }))
      })));
      
      return mappedTeams;
    } catch (error) {
      console.error('Error getting teams by tournament:', error);
      throw error instanceof Error ? error : new Error('Failed to get teams');
    }
  }

  static async getAllPlayers(): Promise<Player[]> {
    try {
      console.log('🔍 TeamService: Fetching all available players');
      
      // Since the users table might have RLS issues, let's try multiple approaches
      let players: Player[] = [];
      
      // Approach 1: Try to get all users first (to check RLS and table access)
      try {
        console.log('🔍 Approach 1: Fetching ALL users to check access');
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, role, premium_status, country, created_at');
        
        if (allUsersError) {
          console.log('❌ Users table error:', allUsersError.message);
          if (allUsersError.message.includes('infinite recursion') || allUsersError.message.includes('operator does not exist')) {
            console.log('🔧 RLS policy issue detected - backend fix needed');
          }
        } else {
          console.log('✅ Users table accessible, found:', allUsers?.length || 0, 'users');
          
          // Filter for players
          const playerUsers = (allUsers || []).filter(user => user.role === 'player');
          console.log('✅ Found', playerUsers.length, 'users with role="player"');
          
          if (playerUsers.length > 0) {
            // Map real players to Player interface
            players = playerUsers.map(user => ({
              id: user.id,
              name: user.email.split('@')[0], // Use email prefix as name for now
              email: user.email,
              position: 'PG' as const,
              jerseyNumber: Math.floor(Math.random() * 99) + 1, // Random jersey number for now
              isPremium: user.premium_status || false,
              country: user.country || 'US',
              createdAt: user.created_at || new Date().toISOString(),
            }));
          } else {
            // Show what users we found for debugging
            console.log('⚠️ No players found. Existing users:');
            allUsers?.slice(0, 3).forEach((user, index) => {
              console.log(`   User ${index + 1}: role="${user.role}", email="${user.email}"`);
            });
          }
        }
      } catch (usersError) {
        console.log('❌ Users table approach failed:', usersError);
      }
      
      // Approach 2: If no players found, create some demo players from current user
      if (players.length === 0) {
        console.log('⚠️ No players found in users table, creating demo players');
        
        // Get current user for reference
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          console.log('✅ Current user found, creating demo players based on auth system');
          
          // Create demo players with different roles/premiums
          players = [
            {
              id: 'demo-1',
              name: 'Premium Player 1',
              email: 'premium1@statjam.com',
              position: 'PG' as const,
              jerseyNumber: 23,
              isPremium: true,
              country: 'US',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-2', 
              name: 'Premium Player 2',
              email: 'premium2@statjam.com',
              position: 'SG' as const,
              jerseyNumber: 24,
              isPremium: true,
              country: 'US',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-3',
              name: 'Regular Player 1',
              email: 'player1@statjam.com', 
              position: 'SF' as const,
              jerseyNumber: 7,
              isPremium: false,
              country: 'US',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-4',
              name: 'Regular Player 2',
              email: 'player2@statjam.com',
              position: 'PF' as const,
              jerseyNumber: 21,
              isPremium: false,
              country: 'US', 
              createdAt: new Date().toISOString(),
            }
          ];
          
          console.log('✅ Created', players.length, 'demo players for testing');
        }
      }

      console.log('🔍 TeamService: Final player count:', players.length);
      return players;
      
    } catch (error) {
      console.error('Error getting players:', error);
      return []; // Return empty array instead of throwing
    }
  }

  static async searchPlayers(query: string, country?: string): Promise<Player[]> {
    try {
      console.log('🔍 TeamService: Searching players with query:', query);
      
      const allPlayers = await this.getAllPlayers();
      
      // Filter players by search query
      return allPlayers.filter(player =>
        player.name.toLowerCase().includes(query.toLowerCase()) ||
        player.email.toLowerCase().includes(query.toLowerCase())
      );
      
    } catch (error) {
      console.error('Error searching players:', error);
      throw error instanceof Error ? error : new Error('Failed to search players');
    }
  }

  // Team-Player Relationship Management
  static async addPlayerToTeam(teamId: string, playerId: string, position?: string, jerseyNumber?: number): Promise<void> {
    try {
      console.log('🔍 TeamService: Adding player to team:', { teamId, playerId });
      console.log('⚠️ Note: position and jerseyNumber are ignored as team_players table only has (team_id, player_id)');
      
      // Use upsert to handle duplicates gracefully at database level
      const { error } = await supabase
        .from('team_players')
        .upsert({
          team_id: teamId,
          player_id: playerId
        }, {
          onConflict: 'team_id,player_id'
        });

      if (error) {
        console.error('❌ Supabase error adding player to team:', error);
        throw new Error(`Failed to add player to team: ${error.message}`);
      }

      console.log('✅ Player successfully added to team in database');
    } catch (error) {
      console.error('Error adding player to team:', error);
      throw error instanceof Error ? error : new Error('Failed to add player to team');
    }
  }

  static async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    try {
      console.log('🔍 TeamService: Removing player from team:', { teamId, playerId });
      
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('team_id', teamId)
        .eq('player_id', playerId);

      if (error) {
        console.error('❌ Supabase error removing player from team:', error);
        throw new Error(`Failed to remove player from team: ${error.message}`);
      }

      console.log('✅ Player successfully removed from team in database');
    } catch (error) {
      console.error('Error removing player from team:', error);
      throw error instanceof Error ? error : new Error('Failed to remove player from team');
    }
  }

  static async getTeamPlayers(teamId: string): Promise<Player[]> {
    try {
      console.log('🔍 TeamService: Fetching players for team:', teamId);
      
      const { data: teamPlayers, error } = await supabase
        .from('team_players')
        .select(`
          player_id,
          users!player_id (
            id,
            email,
            premium_status,
            country,
            created_at,
            name
          )
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('❌ Supabase error getting team players:', error);
        throw new Error(`Failed to get team players: ${error.message}`);
      }

      console.log('🔍 TeamService: Found team players:', teamPlayers?.length || 0);

      // Filter out any team_players records where users is null (orphaned records)
      const validTeamPlayers = (teamPlayers || []).filter(tp => tp.users !== null);
      console.log('🔍 TeamService: Valid team players (non-null users):', validTeamPlayers.length);

      // Map team_players data to Player interface
      const players = validTeamPlayers.map((tp, index) => {
        // Handle both array and object responses from Supabase
        const user = Array.isArray(tp.users) ? tp.users[0] : tp.users;
        
        // Add null check for user
        if (!user) {
          console.warn('⚠️ TeamService: User is null/undefined for team player:', tp);
          return null;
        }
        
        // Generate player name using actual name column if available, otherwise use email
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
          position: 'PG' as Player['position'], // Default position (columns don't exist in DB yet)
          jerseyNumber: index + 1, // Sequential jersey numbers (column doesn't exist in DB yet)
          isPremium: user.premium_status || false,
          country: user.country || 'US',
          createdAt: user.created_at || new Date().toISOString(),
        };
      }).filter(Boolean); // Remove any null entries

      console.log('🔍 TeamService: Mapped team players:', players.map(p => ({ name: p.name, position: p.position, jersey: p.jerseyNumber })));
      
      return players;
    } catch (error) {
      console.error('Error getting team players:', error);
      throw error instanceof Error ? error : new Error('Failed to get team players');
    }
  }

  // Get basic team info by ID
  static async getTeamInfo(teamId: string): Promise<{ id: string; name: string } | null> {
    try {
      console.log('🔍 TeamService: Fetching team info for:', teamId);
      
      const { data: team, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (error) {
        console.error('❌ Supabase error getting team info:', error);
        return null;
      }

      console.log('🔍 TeamService: Found team info:', team);
      return team;
    } catch (error) {
      console.error('Error getting team info:', error);
      return null;
    }
  }

  // Get all stat admins for assignment
  static async getStatAdmins(): Promise<{ id: string; name: string; email: string }[]> {
    try {
      console.log('🔍 TeamService: Fetching stat admins');
      
      // First, let's try to get the current user to check permissions
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('🔍 TeamService: Current user:', currentUser?.user?.id, currentUser?.user?.email);
      
      // Try the query with detailed error logging
      const { data: statAdmins, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'stat_admin');

      if (error) {
        console.error('❌ Supabase error getting stat admins:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Error code:', error.code);
        
        // Try alternative approach - get all users and filter (might work if RLS allows broader access)
        console.log('🔄 Trying alternative approach...');
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, role');
          
        if (allUsersError) {
          console.error('❌ Alternative approach also failed:', allUsersError);
          return [];
        }
        
        console.log('🔍 All users found:', allUsers?.length || 0);
        const filteredAdmins = (allUsers || []).filter(user => user.role === 'stat_admin');
        console.log('🔍 Filtered stat admins:', filteredAdmins.length);
        
        if (filteredAdmins.length > 0) {
          const admins = filteredAdmins.map(admin => ({
            id: admin.id,
            name: admin.email.split('@')[0],
            email: admin.email
          }));
          console.log('🔍 TeamService: Using filtered admins:', admins);
          return admins;
        }
        
        return [];
      }

      console.log('🔍 TeamService: Raw stat admins data:', statAdmins);
      console.log('🔍 TeamService: Found stat admins count:', statAdmins?.length || 0);
      
      if (!statAdmins || statAdmins.length === 0) {
        console.log('⚠️ No stat admins found in database with role filter');
        return [];
      }
      
      // Map to expected format
      const admins = statAdmins.map(admin => ({
        id: admin.id,
        name: admin.email.split('@')[0], // Use email prefix as name
        email: admin.email
      }));

      console.log('🔍 TeamService: Mapped stat admins:', admins);
      return admins;
    } catch (error) {
      console.error('Error getting stat admins:', error);
      return [];
    }
  }
}