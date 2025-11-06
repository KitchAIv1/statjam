/**
 * Coach Analytics Service
 * 
 * Raw HTTP service for aggregating advanced team and player analytics
 * Uses same pattern as GameServiceV3 and TeamStatsService
 * 
 * @module CoachAnalyticsService
 */

import { TeamAnalytics, PlayerAnalytics, GameBreakdown } from '../types/coachAnalytics';
import {
  calculateVPS,
  calculateOffensiveRating,
  calculateUsageRate,
  calculateTeamOffensiveRating,
  calculateTeamDefensiveRating,
  calculatePace,
  calculateAssistToTurnoverRatio,
  calculateAssistPercentage,
  calculateThreePointAttemptRate,
  calculateFreeThrowRate,
  determinePlayerStrengths,
  determinePlayerWeaknesses,
  PlayerGameStats,
  TeamGameStats
} from '@/utils/advancedStatsCalculations';
import {
  calculateEffectiveFieldGoalPercentage,
  calculateTrueShootingPercentage,
  calculatePlayerEfficiencyRating
} from '@/utils/personalStatsCalculations';

export class CoachAnalyticsService {
  private static readonly SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  private static readonly SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ PHASE 1: Client-side cache for analytics (5 min TTL)
  private static cache = new Map<string, { data: TeamAnalytics; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get access token from authServiceV2 localStorage (same as GameServiceV3)
   */
  private static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sb-access-token');
  }

  /**
   * Clear cache for a specific team (call when game ends)
   */
  static clearCache(teamId: string): void {
    this.cache.delete(teamId);
    console.log('🗑️ CoachAnalyticsService: Cache cleared for team:', teamId);
  }

  /**
   * Clear all analytics cache
   */
  static clearAllCache(): void {
    this.cache.clear();
    console.log('🗑️ CoachAnalyticsService: All cache cleared');
  }

  /**
   * Make authenticated request to Supabase REST API
   * Uses same authentication pattern as GameServiceV3
   */
  private static async makeAuthenticatedRequest<T>(
    table: string,
    params: Record<string, string> = {},
    retryCount: number = 0
  ): Promise<T[]> {
    try {
      // Get access token (same method as GameServiceV3)
      const accessToken = this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found - user not authenticated');
      }

      if (!this.SUPABASE_URL || !this.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase configuration');
      }

      // Build query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.SUPABASE_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ CoachAnalyticsService: HTTP ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data as T[];
    } catch (error: any) {
      console.error(`❌ CoachAnalyticsService: Error fetching from ${table}:`, error);
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`🔄 Retrying... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeAuthenticatedRequest<T>(table, params, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get team analytics for a specific team
   * ✅ PHASE 1 OPTIMIZATION: Uses SQL function + client-side caching
   * - 100+ queries → 1 query (50x faster)
   * - 5 min cache for repeat views
   */
  static async getTeamAnalytics(teamId: string): Promise<TeamAnalytics | null> {
    try {
      // ✅ PHASE 1: Check cache first
      const cached = this.cache.get(teamId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('✅ CoachAnalyticsService: Using cached analytics for team:', teamId);
        return cached.data;
      }

      console.log('📊 CoachAnalyticsService: Fetching fresh team analytics for:', teamId);

      // ✅ PHASE 1: Call SQL function (ONE query instead of 100+)
      const result = await this.makeAuthenticatedRequest<any>('rpc/get_team_analytics', {
        'p_team_id': teamId
      });

      if (!result || result.length === 0 || !result[0].games_played) {
        console.log('📊 No games found for team');
        return null;
      }

      const stats = result[0];

      // Get team name
      const teamInfo = await this.makeAuthenticatedRequest<any>('teams', {
        'id': `eq.${teamId}`,
        'select': 'name'
      });
      const teamName = teamInfo[0]?.name || 'Unknown Team';

      // Extract aggregated data from SQL function
      const gamesPlayed = stats.games_played || 0;
      const totalPoints = stats.total_points || 0;
      const totalOpponentPoints = stats.total_opponent_points || 0;
      const totalFGM = stats.total_fgm || 0;
      const totalFGA = stats.total_fga || 0;
      const total3PM = stats.total_3pm || 0;
      const total3PA = stats.total_3pa || 0;
      const totalFTM = stats.total_ftm || 0;
      const totalFTA = stats.total_fta || 0;
      const totalRebounds = stats.total_rebounds || 0;
      const totalAssists = stats.total_assists || 0;
      const totalTurnovers = stats.total_turnovers || 0;

      // Calculate possessions
      const totalPossessions = totalFGA + (0.44 * totalFTA) + totalTurnovers;

      // Calculate per-game averages
      const pointsPerGame = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
      const reboundsPerGame = gamesPlayed > 0 ? totalRebounds / gamesPlayed : 0;
      const assistsPerGame = gamesPlayed > 0 ? totalAssists / gamesPlayed : 0;
      const turnoversPerGame = gamesPlayed > 0 ? totalTurnovers / gamesPlayed : 0;

      // Calculate shooting percentages
      const fieldGoalPercentage = totalFGA > 0 ? (totalFGM / totalFGA) * 100 : 0;
      const threePointPercentage = total3PA > 0 ? (total3PM / total3PA) * 100 : 0;
      const freeThrowPercentage = totalFTA > 0 ? (totalFTM / totalFTA) * 100 : 0;

      // Calculate advanced metrics
      const effectiveFGPercentage = calculateEffectiveFieldGoalPercentage(totalFGM, totalFGA, total3PM);
      const trueShootingPercentage = calculateTrueShootingPercentage(totalPoints, totalFGA, totalFTA);
      const assistToTurnoverRatio = calculateAssistToTurnoverRatio(totalAssists, totalTurnovers);
      const assistPercentage = calculateAssistPercentage(totalAssists, totalFGM);
      
      const teamStatsData: TeamGameStats = {
        fieldGoalsMade: totalFGM,
        fieldGoalsAttempted: totalFGA,
        threePointersMade: total3PM,
        threePointersAttempted: total3PA,
        freeThrowsMade: totalFTM,
        freeThrowsAttempted: totalFTA,
        rebounds: totalRebounds,
        assists: totalAssists,
        steals: 0,
        blocks: 0,
        turnovers: totalTurnovers,
        fouls: 0,
        possessions: totalPossessions
      };

      const offensiveRating = calculateTeamOffensiveRating(teamStatsData, totalPoints);
      const defensiveRating = calculateTeamDefensiveRating(totalOpponentPoints, teamStatsData);
      const pace = gamesPlayed > 0 ? totalPossessions / gamesPlayed : 0;
      const threePointAttemptRate = calculateThreePointAttemptRate(total3PA, totalFGA);
      const freeThrowRate = calculateFreeThrowRate(totalFTA, totalFGA);

      const analytics: TeamAnalytics = {
        teamId,
        teamName,
        gamesPlayed,
        offensiveRating: Math.round(offensiveRating * 10) / 10,
        effectiveFGPercentage: Math.round(effectiveFGPercentage * 10) / 10,
        trueShootingPercentage: Math.round(trueShootingPercentage * 10) / 10,
        assistToTurnoverRatio: Math.round(assistToTurnoverRatio * 10) / 10,
        assistPercentage: Math.round(assistPercentage * 10) / 10,
        defensiveRating: Math.round(defensiveRating * 10) / 10,
        pace: Math.round(pace * 10) / 10,
        threePointAttemptRate: Math.round(threePointAttemptRate * 10) / 10,
        freeThrowRate: Math.round(freeThrowRate * 10) / 10,
        pointsPerGame: Math.round(pointsPerGame * 10) / 10,
        reboundsPerGame: Math.round(reboundsPerGame * 10) / 10,
        assistsPerGame: Math.round(assistsPerGame * 10) / 10,
        turnoversPerGame: Math.round(turnoversPerGame * 10) / 10,
        fieldGoalPercentage: Math.round(fieldGoalPercentage * 10) / 10,
        threePointPercentage: Math.round(threePointPercentage * 10) / 10,
        freeThrowPercentage: Math.round(freeThrowPercentage * 10) / 10
      };

      // ✅ PHASE 1: Cache the result
      this.cache.set(teamId, { data: analytics, timestamp: Date.now() });

      console.log('✅ CoachAnalyticsService: Team analytics calculated and cached:', analytics);
      return analytics;
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Error calculating team analytics:', error);
      return null;
    }
  }

  /**
   * Get player analytics for a specific player on a team
   */
  static async getPlayerAnalytics(
    playerId: string,
    teamId: string
  ): Promise<PlayerAnalytics | null> {
    try {
      console.log('📊 CoachAnalyticsService: Fetching player analytics for:', playerId);

      // Get player info
      const playerInfo = await this.makeAuthenticatedRequest<any>('users', {
        'id': `eq.${playerId}`,
        'select': 'name'
      });

      if (playerInfo.length === 0) {
        // Try custom players
        const customPlayerInfo = await this.makeAuthenticatedRequest<any>('custom_players', {
          'id': `eq.${playerId}`,
          'select': 'name'
        });

        if (customPlayerInfo.length === 0) {
          console.log('📊 Player not found');
          return null;
        }
      }

      const playerName = playerInfo[0]?.name || 'Unknown Player';

      // Get all games for this team
      const games = await this.makeAuthenticatedRequest<any>('games', {
        'or': `(team_a_id.eq.${teamId},team_b_id.eq.${teamId})`,
        'status': 'eq.completed',
        'select': 'id'
      });

      if (games.length === 0) {
        console.log('📊 No completed games found');
        return null;
      }

      // Aggregate player stats across all games
      let totalPoints = 0;
      let totalRebounds = 0;
      let totalAssists = 0;
      let totalSteals = 0;
      let totalBlocks = 0;
      let totalTurnovers = 0;
      let totalFouls = 0;
      let totalFGM = 0;
      let totalFGA = 0;
      let total3PM = 0;
      let total3PA = 0;
      let totalFTM = 0;
      let totalFTA = 0;
      let gamesPlayed = 0;

      const last5GamesPoints: number[] = [];

      for (const game of games) {
        // Get player stats for this game
        const playerStats = await this.makeAuthenticatedRequest<any>('game_stats', {
          'game_id': `eq.${game.id}`,
          'or': `(player_id.eq.${playerId},custom_player_id.eq.${playerId})`,
          'select': 'stat_type,modifier,stat_value'
        });

        if (playerStats.length === 0) continue;

        gamesPlayed++;
        let gamePoints = 0;

        // Aggregate stats for this game
        playerStats.forEach((stat: any) => {
          const statType = stat.stat_type;
          const modifier = stat.modifier;
          const value = stat.stat_value || 1;

          switch (statType) {
            case 'field_goal':
            case 'two_pointer':
              if (modifier === 'made') {
                totalFGM += 1;
                totalFGA += 1;
                totalPoints += 2;
                gamePoints += 2;
              } else if (modifier === 'missed') {
                totalFGA += 1;
              }
              break;
            case 'three_pointer':
              if (modifier === 'made') {
                total3PM += 1;
                total3PA += 1;
                totalFGM += 1;
                totalFGA += 1;
                totalPoints += 3;
                gamePoints += 3;
              } else if (modifier === 'missed') {
                total3PA += 1;
                totalFGA += 1;
              }
              break;
            case 'free_throw':
              if (modifier === 'made') {
                totalFTM += 1;
                totalFTA += 1;
                totalPoints += 1;
                gamePoints += 1;
              } else if (modifier === 'missed') {
                totalFTA += 1;
              }
              break;
            case 'rebound':
              totalRebounds += value;
              break;
            case 'assist':
              totalAssists += value;
              break;
            case 'steal':
              totalSteals += value;
              break;
            case 'block':
              totalBlocks += value;
              break;
            case 'turnover':
              totalTurnovers += value;
              break;
            case 'foul':
              totalFouls += value;
              break;
          }
        });

        // Track last 5 games
        if (last5GamesPoints.length < 5) {
          last5GamesPoints.push(gamePoints);
        }
      }

      if (gamesPlayed === 0) {
        console.log('📊 Player has no stats in completed games');
        return null;
      }

      // Calculate per-game averages
      const pointsPerGame = totalPoints / gamesPlayed;
      const reboundsPerGame = totalRebounds / gamesPlayed;
      const assistsPerGame = totalAssists / gamesPlayed;
      const stealsPerGame = totalSteals / gamesPlayed;
      const blocksPerGame = totalBlocks / gamesPlayed;
      const turnoversPerGame = totalTurnovers / gamesPlayed;
      const foulsPerGame = totalFouls / gamesPlayed;

      // Calculate shooting percentages
      const fieldGoalPercentage = totalFGA > 0 ? (totalFGM / totalFGA) * 100 : 0;
      const threePointPercentage = total3PA > 0 ? (total3PM / total3PA) * 100 : 0;
      const freeThrowPercentage = totalFTA > 0 ? (totalFTM / totalFTA) * 100 : 0;

      // Calculate advanced metrics
      const playerGameStats: PlayerGameStats = {
        points: totalPoints,
        rebounds: totalRebounds,
        assists: totalAssists,
        steals: totalSteals,
        blocks: totalBlocks,
        turnovers: totalTurnovers,
        fouls: totalFouls,
        fgMade: totalFGM,
        fgAttempted: totalFGA,
        threePtMade: total3PM,
        threePtAttempted: total3PA,
        ftMade: totalFTM,
        ftAttempted: totalFTA
      };

      const versatilityScore = calculateVPS(playerGameStats);
      const effectiveFGPercentage = calculateEffectiveFieldGoalPercentage(totalFGM, totalFGA, total3PM);
      const trueShootingPercentage = calculateTrueShootingPercentage(totalPoints, totalFGA, totalFTA);
      const playerEfficiencyRating = calculatePlayerEfficiencyRating(playerGameStats);
      const offensiveRating = calculateOffensiveRating(playerGameStats);
      const assistToTurnoverRatio = calculateAssistToTurnoverRatio(totalAssists, totalTurnovers);

      // Determine strengths and weaknesses (using average game stats)
      const avgGameStats: PlayerGameStats = {
        points: pointsPerGame,
        rebounds: reboundsPerGame,
        assists: assistsPerGame,
        steals: stealsPerGame,
        blocks: blocksPerGame,
        turnovers: turnoversPerGame,
        fouls: foulsPerGame,
        fgMade: totalFGM / gamesPlayed,
        fgAttempted: totalFGA / gamesPlayed,
        threePtMade: total3PM / gamesPlayed,
        threePtAttempted: total3PA / gamesPlayed,
        ftMade: totalFTM / gamesPlayed,
        ftAttempted: totalFTA / gamesPlayed
      };

      const strengths = determinePlayerStrengths(avgGameStats);
      const weaknesses = determinePlayerWeaknesses(avgGameStats);

      // Determine trend (simple: compare last 5 games to overall average)
      const last5Average = last5GamesPoints.length > 0 
        ? last5GamesPoints.reduce((a, b) => a + b, 0) / last5GamesPoints.length 
        : pointsPerGame;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (last5Average > pointsPerGame * 1.1) trend = 'improving';
      else if (last5Average < pointsPerGame * 0.9) trend = 'declining';

      const analytics: PlayerAnalytics = {
        playerId,
        playerName,
        gamesPlayed,
        pointsPerGame: Math.round(pointsPerGame * 10) / 10,
        reboundsPerGame: Math.round(reboundsPerGame * 10) / 10,
        assistsPerGame: Math.round(assistsPerGame * 10) / 10,
        stealsPerGame: Math.round(stealsPerGame * 10) / 10,
        blocksPerGame: Math.round(blocksPerGame * 10) / 10,
        turnoversPerGame: Math.round(turnoversPerGame * 10) / 10,
        foulsPerGame: Math.round(foulsPerGame * 10) / 10,
        playerEfficiencyRating: Math.round(playerEfficiencyRating * 10) / 10,
        trueShootingPercentage: Math.round(trueShootingPercentage * 10) / 10,
        effectiveFGPercentage: Math.round(effectiveFGPercentage * 10) / 10,
        offensiveRating: Math.round(offensiveRating * 10) / 10,
        usageRate: 0, // Would need team stats to calculate
        versatilityScore: Math.round(versatilityScore * 10) / 10,
        assistToTurnoverRatio: Math.round(assistToTurnoverRatio * 10) / 10,
        fieldGoalPercentage: Math.round(fieldGoalPercentage * 10) / 10,
        threePointPercentage: Math.round(threePointPercentage * 10) / 10,
        freeThrowPercentage: Math.round(freeThrowPercentage * 10) / 10,
        strengths,
        weaknesses,
        trend,
        last5GamesAverage: Math.round(last5Average * 10) / 10
      };

      console.log('✅ CoachAnalyticsService: Player analytics calculated:', analytics);
      return analytics;
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Error calculating player analytics:', error);
      return null;
    }
  }
}

