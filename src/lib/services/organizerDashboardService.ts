import { supabase } from '@/lib/supabase';
import { TournamentService } from './tournamentService';
import { 
  OrganizerDashboardData, 
  OrganizerStats, 
  RecentTournament, 
  UpcomingGame,
  defaultOrganizerDashboardData 
} from '@/lib/types/organizerDashboard';
import { Tournament } from '@/lib/types/tournament';

export class OrganizerDashboardService {
  /**
   * Get comprehensive dashboard data for an organizer
   */
  static async getDashboardData(organizerId: string): Promise<OrganizerDashboardData> {
    try {
      console.log('🔍 OrganizerDashboard: Fetching dashboard data for organizer:', organizerId);

      // Fetch all required data in parallel
      const [tournaments, stats, upcomingGames] = await Promise.all([
        this.getRecentTournaments(organizerId),
        this.getOrganizerStats(organizerId),
        this.getUpcomingGames(organizerId)
      ]);

      const dashboardData: OrganizerDashboardData = {
        stats,
        recentTournaments: tournaments,
        upcomingGames
      };

      console.log('🔍 OrganizerDashboard: Dashboard data fetched successfully:', {
        tournamentsCount: tournaments.length,
        upcomingGamesCount: upcomingGames.length,
        stats
      });

      return dashboardData;
    } catch (error) {
      console.error('❌ OrganizerDashboard: Error fetching dashboard data:', error);
      throw new Error(`Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get organizer statistics
   */
  static async getOrganizerStats(organizerId: string): Promise<OrganizerStats> {
    try {
      console.log('🔍 OrganizerDashboard: Fetching organizer stats for:', organizerId);

      // Get tournaments for this organizer
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      
      // Calculate stats
      const totalTournaments = tournaments.length;
      const activeTournaments = tournaments.filter(t => t.status === 'active').length;
      const totalTeams = tournaments.reduce((sum, t) => sum + t.currentTeams, 0);
      
      // Calculate completion rate (completed tournaments / total tournaments)
      const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
      const completionRate = totalTournaments > 0 ? Math.round((completedTournaments / totalTournaments) * 100) : 0;

      // Get total games count (placeholder - will be enhanced when games table is available)
      const totalGames = await this.getTotalGamesCount(organizerId);

      // Calculate trends (placeholder - will be enhanced with historical data)
      const trends = this.calculateTrends(tournaments);

      const stats: OrganizerStats = {
        activeTournaments,
        totalTournaments,
        totalTeams,
        totalGames,
        completionRate,
        trends
      };

      console.log('🔍 OrganizerDashboard: Stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ OrganizerDashboard: Error fetching organizer stats:', error);
      return defaultOrganizerDashboardData.stats;
    }
  }

  /**
   * Get recent tournaments for dashboard
   */
  static async getRecentTournaments(organizerId: string): Promise<RecentTournament[]> {
    try {
      console.log('🔍 OrganizerDashboard: Fetching recent tournaments for:', organizerId);

      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      
      console.log('🔍 OrganizerDashboard: Total tournaments found:', tournaments.length);
      console.log('🔍 OrganizerDashboard: Tournament IDs:', tournaments.map(t => ({ id: t.id, name: t.name, createdAt: t.createdAt })));
      
      // Sort by creation date and take the most recent 6
      const recentTournaments = tournaments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6)
        .map(tournament => this.mapTournamentToRecent(tournament));

      console.log('🔍 OrganizerDashboard: Recent tournaments mapped (showing 6 of', tournaments.length, '):', recentTournaments.length);
      console.log('🔍 OrganizerDashboard: Displayed tournaments:', recentTournaments.map(t => t.name));
      return recentTournaments;
    } catch (error) {
      console.error('❌ OrganizerDashboard: Error fetching recent tournaments:', error);
      return [];
    }
  }

  /**
   * Get upcoming games for dashboard
   */
  static async getUpcomingGames(organizerId: string): Promise<UpcomingGame[]> {
    try {
      console.log('🔍 OrganizerDashboard: Fetching upcoming games for:', organizerId);

      // Get tournaments for this organizer first
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      const tournamentIds = tournaments.map(t => t.id);

      if (tournamentIds.length === 0) {
        console.log('🔍 OrganizerDashboard: No tournaments found for organizer');
        return [];
      }

      // Fetch upcoming games from tournaments owned by this organizer
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          id, start_time, status, tournament_id,
          team_a:team_a_id(id, name),
          team_b:team_b_id(id, name),
          tournaments:tournament_id(name, venue)
        `)
        .in('tournament_id', tournamentIds)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) {
        console.error('❌ OrganizerDashboard: Error fetching games:', error);
        return [];
      }

      // Transform to UpcomingGame format
      const upcomingGames: UpcomingGame[] = (games || []).map(game => ({
        id: game.id,
        team1: game.team_a?.name || 'Team A',
        team2: game.team_b?.name || 'Team B',
        time: new Date(game.start_time).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),
        court: 'Court 1', // Default court
        tournament: game.tournaments?.name || 'Tournament',
        importance: game.status === 'scheduled' ? 'Regular Season' : 'Important'
      }));

      console.log('🔍 OrganizerDashboard: Upcoming games fetched:', upcomingGames.length);
      return upcomingGames;
    } catch (error) {
      console.error('❌ OrganizerDashboard: Error fetching upcoming games:', error);
      return [];
    }
  }

  /**
   * Get total games count for an organizer
   */
  private static async getTotalGamesCount(organizerId: string): Promise<number> {
    try {
      // Get tournaments for this organizer first
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      const tournamentIds = tournaments.map(t => t.id);

      if (tournamentIds.length === 0) {
        return 0;
      }

      // Count games from tournaments owned by this organizer
      const { count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .in('tournament_id', tournamentIds);

      if (error) {
        console.error('❌ OrganizerDashboard: Error counting games:', error);
        // Fallback: estimate based on tournaments
        return tournaments.reduce((sum, t) => sum + Math.max(t.currentTeams - 1, 0), 0);
      }

      return count || 0;
    } catch (error) {
      console.error('❌ OrganizerDashboard: Error getting games count:', error);
      return 0;
    }
  }

  /**
   * Calculate trends based on tournament data
   */
  private static calculateTrends(tournaments: Tournament[]): OrganizerStats['trends'] {
    // TODO: Implement proper trend calculation with historical data
    // For now, return placeholder trends
    return {
      tournaments: "+12%",
      teams: "+8%", 
      games: "+24%",
      completion: "+5%"
    };
  }

  /**
   * Map Tournament to RecentTournament format
   */
  private static mapTournamentToRecent(tournament: Tournament): RecentTournament {
    return {
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      teams: tournament.currentTeams,
      maxTeams: tournament.maxTeams,
      venue: tournament.venue,
      prize: `$${tournament.prizePool?.toLocaleString() || '0'}`,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      progress: this.calculateTournamentProgress(tournament),
      nextGame: this.getNextGameForTournament(tournament)
    };
  }

  /**
   * Calculate tournament progress percentage
   */
  private static calculateTournamentProgress(tournament: Tournament): number {
    if (tournament.status === 'completed') return 100;
    if (tournament.status === 'draft') return 0;
    
    // For active tournaments, calculate based on teams registered vs max teams
    if (tournament.maxTeams > 0) {
      return Math.round((tournament.currentTeams / tournament.maxTeams) * 100);
    }
    
    return 50; // Default progress for active tournaments
  }

  /**
   * Get next game for a tournament (placeholder)
   */
  private static getNextGameForTournament(tournament: Tournament): string | undefined {
    // TODO: Implement when games table is available
    if (tournament.status === 'active') {
      return "Today 3:00 PM"; // Placeholder
    }
    return undefined;
  }
}
