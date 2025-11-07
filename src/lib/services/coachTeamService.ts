// ============================================================================
// COACH TEAM SERVICE
// ============================================================================
// Purpose: Business logic for coach team management
// Follows .cursorrules: <200 lines, single responsibility
// ============================================================================

import { supabase } from '../supabase';
import {
  CoachTeam,
  CoachPlayer,
  CreateCoachTeamRequest,
  UpdateCoachTeamRequest,
  TeamImportToken,
  GenerateImportTokenRequest,
  TournamentSearchRequest,
  TournamentAttachmentRequest,
  Tournament,
  AddPlayerToTeamRequest,
  RemovePlayerFromTeamRequest,
  SearchPlayersRequest,
  CreateCustomPlayerRequest,
  PlayerManagementResponse
} from '../types/coach';
import { CoachPlayerService } from './coachPlayerService';

export class CoachTeamService {
  /**
   * Get all teams for a coach with accurate player counts
   */
  static async getCoachTeams(coachId: string): Promise<CoachTeam[]> {
    try {
      // Get basic team data first
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          coach_id,
          tournament_id,
          approval_status,
          visibility,
          created_at,
          updated_at
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ FILTER OUT: Virtual opponent teams (system-generated for coach games)
      // Filters out both old and new system opponent teams
      const realTeams = (teams || []).filter(team => 
        team.name !== 'Virtual Opponent (System)' && 
        team.name !== 'Opponent Team (System)' &&
        !team.name.endsWith('(System)')
      );

      // Get accurate counts for each team in parallel
      const teamsWithCounts = await Promise.all(
        realTeams.map(async (team) => {
          const [playerCount, gamesCount] = await Promise.all([
            CoachPlayerService.getTeamPlayerCount(team.id),
            this.getTeamGamesCount(team.id)
          ]);
          
          return {
            id: team.id,
            name: team.name,
            coach_id: team.coach_id,
            tournament_id: team.tournament_id,
            approval_status: team.approval_status,
            visibility: team.visibility,
            created_at: team.created_at,
            updated_at: team.updated_at,
            player_count: playerCount,
            games_count: gamesCount
          };
        })
      );

      return teamsWithCounts;
    } catch (error) {
      console.error('❌ Error fetching coach teams:', error);
      throw error;
    }
  }

  /**
   * Get games count for a team
   */
  private static async getTeamGamesCount(teamId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('❌ Error getting team games count:', error);
      return 0;
    }
  }

  /**
   * Create a new coach team
   */
  static async createTeam(request: CreateCoachTeamRequest): Promise<CoachTeam> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: request.name,
          coach_id: user.id,
          tournament_id: null, // Coach teams can exist without tournaments
          visibility: request.visibility,
          // Store location and level in metadata if needed
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        coach_id: data.coach_id,
        visibility: data.visibility,
        created_at: data.created_at,
        updated_at: data.updated_at,
        player_count: 0,
        games_count: 0
      };
    } catch (error) {
      console.error('❌ Error creating coach team:', error);
      throw error;
    }
  }

  /**
   * Update a coach team
   */
  static async updateTeam(teamId: string, updates: UpdateCoachTeamRequest): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error updating coach team:', error);
      throw error;
    }
  }

  /**
   * Generate import token for team sharing
   */
  static async generateImportToken(
    teamId: string,
    expiresHours: number = 48
  ): Promise<TeamImportToken> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function to generate token
      const { data, error } = await supabase
        .rpc('generate_team_import_token', {
          p_coach_team_id: teamId,
          p_coach_id: user.id,
          p_expires_hours: expiresHours
        });

      if (error) throw error;

      // Fetch the created token
      const { data: tokenData, error: fetchError } = await supabase
        .from('team_import_tokens')
        .select('*')
        .eq('token', data)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: tokenData.id,
        token: tokenData.token,
        coach_team_id: tokenData.coach_team_id,
        coach_id: tokenData.coach_id,
        expires_at: tokenData.expires_at,
        status: tokenData.status,
        created_at: tokenData.created_at
      };
    } catch (error) {
      console.error('❌ Error generating import token:', error);
      throw error;
    }
  }

  /**
   * Search tournaments by location and query
   */
  static async searchTournaments(request: TournamentSearchRequest): Promise<Tournament[]> {
    try {
      let query = supabase
        .from('tournaments')
        .select('*')
        .eq('is_public', true)
        .in('status', ['draft', 'active']);

      // Add location filters if provided
      if (request.location?.country) {
        query = query.eq('country', request.location.country);
      }

      // Add text search if provided
      if (request.query) {
        query = query.ilike('name', `%${request.query}%`);
      }

      // Limit results
      query = query.limit(request.limit || 10);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        start_date: t.start_date,
        end_date: t.end_date,
        venue: t.venue,
        location: {
          country: t.country,
          region: t.region,
          city: t.city
        },
        organizer_id: t.organizer_id,
        is_public: t.is_public,
        current_teams: t.current_teams,
        max_teams: t.max_teams
      }));
    } catch (error) {
      console.error('❌ Error searching tournaments:', error);
      throw error;
    }
  }

  /**
   * Attach team to tournament (existing or stub)
   */
  static async attachToTournament(request: TournamentAttachmentRequest): Promise<void> {
    try {
      if (request.attachment_type === 'existing' && request.tournament_id) {
        // Attach to existing tournament with pending approval status
        const { error } = await supabase
          .from('teams')
          .update({ 
            tournament_id: request.tournament_id,
            approval_status: 'pending' // Requires organizer approval
          })
          .eq('id', request.coach_team_id);

        if (error) throw error;

        console.log('✅ Team attached to tournament, awaiting organizer approval');
      } else if (request.attachment_type === 'stub' && request.tournament_stub) {
        // Create tournament stub
        // TODO: Implement tournament stub creation
        console.log('✅ Tournament stub created');
      }
    } catch (error) {
      console.error('❌ Error attaching to tournament:', error);
      throw error;
    }
  }
}
