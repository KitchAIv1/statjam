/**
 * CoachUsageService - Platform-wide coach usage metrics for admin dashboard
 * Uses is_coach_game=true to identify coach mode games
 * NOTE: Different from CoachAnalyticsService (team performance analytics)
 */

'use client';

export interface CoachUsageMetrics {
  totalTeams: number;
  totalGames: number;
  completedGames: number;
  inProgressGames: number;
  totalStatsRecorded: number;
  lastActiveDate: string | null;
}

export interface CoachGame {
  id: string;
  teamName: string;
  opponentName: string;
  status: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoachTeam {
  id: string;
  name: string;
  coachEmail: string | null;
  playerCount: number;
  gamesPlayed: number;
  createdAt: string;
}

class CoachUsageService {
  private readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Fetch ALL coach metrics summary (admin view - all coaches)
   * Uses is_coach_game=true to identify coach mode games
   */
  async getCoachMetrics(_coachId?: string): Promise<CoachUsageMetrics> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch ALL coach mode games (is_coach_game = true)
      const url = `${this.SUPABASE_URL}/rest/v1/games?is_coach_game=eq.true&select=id,status,updated_at,team_a_id`;
      console.log('🔍 Fetching coach games from:', url);
      const gamesRes = await fetch(url, { headers });
      console.log('🔍 Response status:', gamesRes.status);
      const games = await gamesRes.json();
      console.log('🔍 Games response:', games);
      const teamIds = [...new Set(games.map((g: any) => g.team_a_id))];

      const completedGames = games.filter((g: any) => g.status === 'completed').length;
      const inProgressGames = games.filter((g: any) => g.status === 'in_progress').length;
      const lastActive = games.length > 0 
        ? games.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
        : null;

      // Fetch stats count for coach games
      const gameIds = games.map((g: any) => g.id);
      let totalStats = 0;
      if (gameIds.length > 0) {
        const statsRes = await fetch(
          `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${gameIds.join(',')})&select=id`,
          { headers }
        );
        const statsData = await statsRes.json();
        totalStats = Array.isArray(statsData) ? statsData.length : 0;
      }

      return {
        totalTeams: teamIds.length,
        totalGames: games.length,
        completedGames,
        inProgressGames,
        totalStatsRecorded: totalStats,
        lastActiveDate: lastActive
      };
    } catch (error) {
      console.error('❌ CoachUsageService: Failed to fetch metrics:', error);
      throw error;
    }
  }

  /**
   * Fetch recent coach games (admin view - all coaches)
   * Uses is_coach_game=true to identify coach mode games
   */
  async getRecentGames(_coachId?: string, limit: number = 10): Promise<CoachGame[]> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch ALL coach games (is_coach_game = true) with team info
      const gamesRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?is_coach_game=eq.true&select=id,team_a_id,opponent_name,status,home_score,away_score,created_at,updated_at,teams:team_a_id(name)&order=updated_at.desc&limit=${limit}`,
        { headers }
      );
      const games = await gamesRes.json();

      return games.map((g: any) => ({
        id: g.id,
        teamName: g.teams?.name || 'Unknown Team',
        opponentName: g.opponent_name || 'Opponent',
        status: g.status,
        homeScore: g.home_score || 0,
        awayScore: g.away_score || 0,
        createdAt: g.created_at,
        updatedAt: g.updated_at
      }));
    } catch (error) {
      console.error('❌ CoachUsageService: Failed to fetch recent games:', error);
      throw error;
    }
  }

  /**
   * Fetch ALL coach teams with stats (admin view)
   * Derives teams from coach games (is_coach_game = true)
   */
  async getCoachTeams(_coachId?: string): Promise<CoachTeam[]> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // First get all unique team IDs from coach games
      const gamesRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?is_coach_game=eq.true&select=team_a_id`,
        { headers }
      );
      const games = await gamesRes.json();
      const uniqueTeamIds = [...new Set(games.map((g: any) => g.team_a_id))];
      if (uniqueTeamIds.length === 0) return [];

      // Fetch team details
      const teamsRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/teams?id=in.(${uniqueTeamIds.join(',')})&select=id,name,created_at&order=created_at.desc&limit=10`,
        { headers }
      );
      const teams = await teamsRes.json();

      // For each team, get player count and games played
      const enrichedTeams = await Promise.all(teams.map(async (team: any) => {
        const [playersRes, gamesCountRes] = await Promise.all([
          fetch(`${this.SUPABASE_URL}/rest/v1/team_players?team_id=eq.${team.id}&select=id`, { headers }),
          fetch(`${this.SUPABASE_URL}/rest/v1/games?team_a_id=eq.${team.id}&is_coach_game=eq.true&select=id`, { headers })
        ]);
        const players = await playersRes.json();
        const teamGames = await gamesCountRes.json();

        return {
          id: team.id,
          name: team.name,
          playerCount: Array.isArray(players) ? players.length : 0,
          gamesPlayed: Array.isArray(teamGames) ? teamGames.length : 0,
          createdAt: team.created_at
        };
      }));

      return enrichedTeams;
    } catch (error) {
      console.error('❌ CoachUsageService: Failed to fetch teams:', error);
      throw error;
    }
  }
}

export const coachUsageService = new CoachUsageService();
