/**
 * PlayerTournamentsService - Get tournaments and schedules for a player
 * 
 * PURPOSE: Fetch tournaments a player is part of (via team_players -> teams -> tournaments)
 * and their game schedules
 * 
 * Follows existing patterns from PlayerDashboardService
 */

import { supabase } from '@/lib/supabase';

export interface PlayerTournament {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  status: string;
  logo: string | null;
  teamId: string;
  teamName: string;
}

export interface PlayerGameSchedule {
  id: string;
  tournamentId: string;
  tournamentName: string;
  start_time: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  team_a_id: string;
  team_b_id: string;
  team_a_name: string;
  team_b_name: string;
  venue: string | null;
  isHome: boolean;
  opponent: string;
}

export class PlayerTournamentsService {
  /**
   * Get all tournaments a player is part of
   */
  static async getPlayerTournaments(userId: string): Promise<PlayerTournament[]> {
    if (!userId) return [];

    try {
      // Step 1: Get player's team assignments
      const { data: teamPlayers, error: teamError } = await supabase
        .from('team_players')
        .select(`
          team_id,
          teams:team_id (
            id,
            name,
            tournament_id,
            tournaments:tournament_id (
              id,
              name,
              start_date,
              end_date,
              venue,
              status,
              logo
            )
          )
        `)
        .eq('player_id', userId);

      if (teamError) {
        console.error('❌ PlayerTournamentsService: Error fetching player teams:', teamError);
        return [];
      }

      if (!teamPlayers || teamPlayers.length === 0) {
        return [];
      }

      // Step 2: Extract unique tournaments
      const tournamentMap = new Map<string, PlayerTournament>();

      teamPlayers.forEach((tp: any) => {
        const team = tp.teams;
        if (!team || !team.tournaments) return;

        const tournament = team.tournaments;
        const tournamentId = tournament.id;

        // Only add if not already in map (player might be on multiple teams in same tournament)
        if (!tournamentMap.has(tournamentId)) {
          tournamentMap.set(tournamentId, {
            id: tournamentId,
            name: tournament.name,
            start_date: tournament.start_date,
            end_date: tournament.end_date,
            venue: tournament.venue,
            status: tournament.status,
            logo: tournament.logo,
            teamId: team.id,
            teamName: team.name,
          });
        }
      });

      return Array.from(tournamentMap.values());
    } catch (error) {
      console.error('❌ PlayerTournamentsService: Error getting tournaments:', error);
      return [];
    }
  }

  /**
   * Get game schedules for a player's tournaments
   */
  static async getPlayerGameSchedules(userId: string): Promise<PlayerGameSchedule[]> {
    if (!userId) return [];

    try {
      // Step 1: Get player's team IDs
      const { data: teamPlayers, error: teamError } = await supabase
        .from('team_players')
        .select('team_id')
        .eq('player_id', userId);

      if (teamError) {
        console.error('❌ PlayerTournamentsService: Error fetching player teams:', teamError);
        return [];
      }

      if (!teamPlayers || teamPlayers.length === 0) {
        return [];
      }

      const teamIds = teamPlayers.map(tp => tp.team_id);

      // Step 2: Get games for player's teams (upcoming and in-progress)
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          start_time,
          status,
          tournament_id,
          team_a_id,
          team_b_id,
          venue,
          team_a:teams!team_a_id (id, name),
          team_b:teams!team_b_id (id, name),
          tournaments:tournament_id (name)
        `)
        .or(`team_a_id.in.(${teamIds.join(',')}),team_b_id.in.(${teamIds.join(',')})`)
        .in('status', ['scheduled', 'in_progress'])
        .order('start_time', { ascending: true })
        .limit(20);

      if (gamesError) {
        console.error('❌ PlayerTournamentsService: Error fetching games:', gamesError);
        return [];
      }

      if (!games || games.length === 0) {
        return [];
      }

      // Step 3: Transform to PlayerGameSchedule format
      return games.map((game: any) => {
        const isTeamA = teamIds.includes(game.team_a_id);
        const isHome = isTeamA;
        const opponent = isTeamA ? game.team_b?.name : game.team_a?.name;

        return {
          id: game.id,
          tournamentId: game.tournament_id,
          tournamentName: game.tournaments?.name || 'Unknown Tournament',
          start_time: game.start_time,
          status: game.status,
          team_a_id: game.team_a_id,
          team_b_id: game.team_b_id,
          team_a_name: game.team_a?.name || 'Unknown',
          team_b_name: game.team_b?.name || 'Unknown',
          venue: game.venue,
          isHome,
          opponent: opponent || 'Unknown',
        };
      });
    } catch (error) {
      console.error('❌ PlayerTournamentsService: Error getting schedules:', error);
      return [];
    }
  }
}

