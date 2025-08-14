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
      
      // Sort by creation date and take the most recent 4
      const recentTournaments = tournaments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
        .map(tournament => this.mapTournamentToRecent(tournament));

      console.log('🔍 OrganizerDashboard: Recent tournaments mapped:', recentTournaments.length);
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

      // This will be enhanced when the games table is fully implemented
      // For now, return placeholder data
      const upcomingGames: UpcomingGame[] = [];

      // TODO: Implement when games table is available
      // const { data: games, error } = await supabase
      //   .from('games')
      //   .select('*')
      //   .eq('organizer_id', organizerId)
      //   .gte('scheduled_date', new Date().toISOString())
      //   .order('scheduled_date', { ascending: true })
      //   .limit(3);

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
      // TODO: Implement when games table is available
      // const { count, error } = await supabase
      //   .from('games')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('organizer_id', organizerId);

      // For now, return a placeholder based on tournaments
      const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
      return tournaments.reduce((sum, t) => sum + (t.currentTeams * 2), 0); // Rough estimate
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
