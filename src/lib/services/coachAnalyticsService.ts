/**
 * CoachAnalyticsService - Team Performance Analytics
 * 
 * PURPOSE: Calculate advanced team analytics for coach dashboard
 * - Offensive/Defensive ratings
 * - Shooting efficiency
 * - Per-game averages
 * - Advanced stats (eFG%, TS%, etc.)
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import { TeamAnalytics } from '@/lib/types/coachAnalytics';

export class CoachAnalyticsService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Fetch team analytics for coach dashboard
   */
  static async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch team info
      const teamRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/teams?id=eq.${teamId}&select=id,name`,
        { headers }
      );
      const teamData = await teamRes.json();
      const team = teamData[0];

      // Fetch completed games for this team
      const gamesRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?team_a_id=eq.${teamId}&status=eq.completed&select=id,home_score,away_score`,
        { headers }
      );
      const games = await gamesRes.json();

      if (games.length === 0) {
        return this.getEmptyAnalytics(teamId, team?.name || 'Unknown Team');
      }

      // Fetch all stats for these games
      const gameIds = games.map((g: any) => g.id);
      const statsRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${gameIds.join(',')})&select=*`,
        { headers }
      );
      const stats = await statsRes.json();

      return this.calculateAnalytics(teamId, team?.name || 'Unknown Team', games, stats);
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Failed to fetch analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate analytics from game data
   */
  private static calculateAnalytics(
    teamId: string,
    teamName: string,
    games: any[],
    stats: any[]
  ): TeamAnalytics {
    const gamesPlayed = games.length;
    
    // Aggregate stats
    let fgm = 0, fga = 0, tpm = 0, tpa = 0, ftm = 0, fta = 0;
    let totalPoints = 0, totalRebounds = 0, totalAssists = 0, totalTurnovers = 0;
    let oppPoints = 0;

    games.forEach((game: any) => {
      totalPoints += game.home_score || 0;
      oppPoints += game.away_score || 0;
    });

    stats.forEach((stat: any) => {
      const value = stat.stat_value || 1;
      switch (stat.stat_type) {
        case 'field_goal':
        case 'two_pointer':
          fga += 1;
          if (stat.modifier === 'made') fgm += 1;
          break;
        case 'three_pointer':
          tpa += 1;
          fga += 1;
          if (stat.modifier === 'made') { tpm += 1; fgm += 1; }
          break;
        case 'free_throw':
          fta += 1;
          if (stat.modifier === 'made') ftm += 1;
          break;
        case 'rebound':
          totalRebounds += value;
          break;
        case 'assist':
          totalAssists += value;
          break;
        case 'turnover':
          totalTurnovers += value;
          break;
      }
    });

    // Calculate percentages
    const fgPct = fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0;
    const tpPct = tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : 0;
    const ftPct = fta > 0 ? Math.round((ftm / fta) * 1000) / 10 : 0;

    // Advanced stats
    const efgPct = fga > 0 ? Math.round(((fgm + 0.5 * tpm) / fga) * 1000) / 10 : 0;
    const tsPct = fga > 0 ? Math.round((totalPoints / (2 * (fga + 0.44 * fta))) * 1000) / 10 : 0;
    const astToRatio = totalTurnovers > 0 ? Math.round((totalAssists / totalTurnovers) * 10) / 10 : 0;
    const astPct = fgm > 0 ? Math.round((totalAssists / fgm) * 1000) / 10 : 0;
    const tpaRate = fga > 0 ? Math.round((tpa / fga) * 1000) / 10 : 0;
    const ftRate = fga > 0 ? Math.round((fta / fga) * 1000) / 10 : 0;

    // Estimate possessions (simple formula)
    const possessions = fga + 0.44 * fta + totalTurnovers;
    const pace = gamesPlayed > 0 ? Math.round(possessions / gamesPlayed) : 0;
    const offRtg = possessions > 0 ? Math.round((totalPoints / possessions) * 100) : 0;
    const defRtg = possessions > 0 ? Math.round((oppPoints / possessions) * 100) : 0;

    return {
      teamId,
      teamName,
      gamesPlayed,
      offensiveRating: offRtg,
      defensiveRating: defRtg,
      pace,
      effectiveFGPercentage: efgPct,
      trueShootingPercentage: tsPct,
      assistToTurnoverRatio: astToRatio,
      assistPercentage: astPct,
      threePointAttemptRate: tpaRate,
      freeThrowRate: ftRate,
      pointsPerGame: gamesPlayed > 0 ? Math.round((totalPoints / gamesPlayed) * 10) / 10 : 0,
      reboundsPerGame: gamesPlayed > 0 ? Math.round((totalRebounds / gamesPlayed) * 10) / 10 : 0,
      assistsPerGame: gamesPlayed > 0 ? Math.round((totalAssists / gamesPlayed) * 10) / 10 : 0,
      turnoversPerGame: gamesPlayed > 0 ? Math.round((totalTurnovers / gamesPlayed) * 10) / 10 : 0,
      fieldGoalPercentage: fgPct,
      threePointPercentage: tpPct,
      freeThrowPercentage: ftPct
    };
  }

  /**
   * Return empty analytics for teams with no games
   */
  private static getEmptyAnalytics(teamId: string, teamName: string): TeamAnalytics {
    return {
      teamId,
      teamName,
      gamesPlayed: 0,
      offensiveRating: 0,
      defensiveRating: 0,
      pace: 0,
      effectiveFGPercentage: 0,
      trueShootingPercentage: 0,
      assistToTurnoverRatio: 0,
      assistPercentage: 0,
      threePointAttemptRate: 0,
      freeThrowRate: 0,
      pointsPerGame: 0,
      reboundsPerGame: 0,
      assistsPerGame: 0,
      turnoversPerGame: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0
    };
  }
}
