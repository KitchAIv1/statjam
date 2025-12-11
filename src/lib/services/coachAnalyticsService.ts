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

import { TeamAnalytics, PlayerAnalytics, GameBreakdown, SeasonOverview } from '@/lib/types/coachAnalytics';

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

  /**
   * Fetch player analytics for coach dashboard
   * Calculates per-game stats, efficiency metrics, and identifies strengths/weaknesses
   */
  static async getPlayerAnalytics(playerId: string, teamId: string): Promise<PlayerAnalytics> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch player info
      const playerRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/team_players?id=eq.${playerId}&select=id,first_name,last_name,jersey_number,position`,
        { headers }
      );
      const playerData = await playerRes.json();
      const player = playerData[0];
      const playerName = player ? `${player.first_name} ${player.last_name}`.trim() : 'Unknown Player';

      // Fetch completed games for this team
      const gamesRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?team_a_id=eq.${teamId}&status=eq.completed&select=id`,
        { headers }
      );
      const games = await gamesRes.json();

      if (games.length === 0) {
        return this.getEmptyPlayerAnalytics(playerId, playerName);
      }

      // Fetch all stats for this player in these games
      const gameIds = games.map((g: any) => g.id);
      const statsRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${gameIds.join(',')})&player_id=eq.${playerId}&select=*`,
        { headers }
      );
      const stats = await statsRes.json();

      return this.calculatePlayerAnalytics(playerId, playerName, games.length, stats);
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Failed to fetch player analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate player analytics from stats data
   */
  private static calculatePlayerAnalytics(
    playerId: string,
    playerName: string,
    gamesPlayed: number,
    stats: any[]
  ): PlayerAnalytics {
    // Aggregate stats
    let fgm = 0, fga = 0, tpm = 0, tpa = 0, ftm = 0, fta = 0;
    let totalPoints = 0, totalRebounds = 0, totalAssists = 0;
    let totalSteals = 0, totalBlocks = 0, totalTurnovers = 0, totalFouls = 0;

    stats.forEach((stat: any) => {
      const value = stat.stat_value || 1;
      switch (stat.stat_type) {
        case 'field_goal':
        case 'two_pointer':
          fga += 1;
          if (stat.modifier === 'made') {
            fgm += 1;
            totalPoints += 2;
          }
          break;
        case 'three_pointer':
          tpa += 1;
          fga += 1;
          if (stat.modifier === 'made') {
            tpm += 1;
            fgm += 1;
            totalPoints += 3;
          }
          break;
        case 'free_throw':
          fta += 1;
          if (stat.modifier === 'made') {
            ftm += 1;
            totalPoints += 1;
          }
          break;
        case 'rebound':
        case 'offensive_rebound':
        case 'defensive_rebound':
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
        case 'personal_foul':
          totalFouls += value;
          break;
      }
    });

    // Calculate percentages
    const fgPct = fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0;
    const tpPct = tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : 0;
    const ftPct = fta > 0 ? Math.round((ftm / fta) * 1000) / 10 : 0;

    // Advanced stats
    const efgPct = fga > 0 ? Math.round(((fgm + 0.5 * tpm) / fga) * 1000) / 10 : 0;
    const tsPct = (fga + 0.44 * fta) > 0 ? Math.round((totalPoints / (2 * (fga + 0.44 * fta))) * 1000) / 10 : 0;
    const astToRatio = totalTurnovers > 0 ? Math.round((totalAssists / totalTurnovers) * 10) / 10 : totalAssists > 0 ? 10 : 0;

    // Per-game averages
    const ppg = gamesPlayed > 0 ? Math.round((totalPoints / gamesPlayed) * 10) / 10 : 0;
    const rpg = gamesPlayed > 0 ? Math.round((totalRebounds / gamesPlayed) * 10) / 10 : 0;
    const apg = gamesPlayed > 0 ? Math.round((totalAssists / gamesPlayed) * 10) / 10 : 0;
    const spg = gamesPlayed > 0 ? Math.round((totalSteals / gamesPlayed) * 10) / 10 : 0;
    const bpg = gamesPlayed > 0 ? Math.round((totalBlocks / gamesPlayed) * 10) / 10 : 0;
    const topg = gamesPlayed > 0 ? Math.round((totalTurnovers / gamesPlayed) * 10) / 10 : 0;
    const fpg = gamesPlayed > 0 ? Math.round((totalFouls / gamesPlayed) * 10) / 10 : 0;

    // Calculate VPS (Versatility Performance Score)
    // Simple formula: weighted combination of per-game stats
    const vps = Math.round((ppg * 1.0 + rpg * 1.2 + apg * 1.5 + spg * 2.0 + bpg * 2.0 - topg * 1.0) * 10) / 10;

    // Calculate PER-like efficiency (simplified)
    const per = gamesPlayed > 0 ? Math.round(((totalPoints + totalRebounds + totalAssists + totalSteals + totalBlocks - (fga - fgm) - (fta - ftm) - totalTurnovers) / gamesPlayed) * 10) / 10 : 0;

    // Estimate offensive rating (simplified)
    const possessions = fga + 0.44 * fta + totalTurnovers;
    const offRtg = possessions > 0 ? Math.round((totalPoints / possessions) * 100) : 0;

    // Usage rate estimate (simplified)
    const usageRate = fga > 0 ? Math.round((fga / (gamesPlayed * 20)) * 100) : 0; // Assuming ~20 shots per game baseline

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (ppg >= 15) strengths.push('Scoring');
    if (rpg >= 8) strengths.push('Rebounding');
    if (apg >= 5) strengths.push('Playmaking');
    if (spg >= 1.5) strengths.push('Steals');
    if (bpg >= 1.5) strengths.push('Shot Blocking');
    if (tpPct >= 35 && tpa >= gamesPlayed) strengths.push('3PT Shooting');
    if (ftPct >= 80) strengths.push('Free Throws');
    if (astToRatio >= 2) strengths.push('Ball Security');

    if (topg >= 3) weaknesses.push('Turnovers');
    if (fgPct < 40 && fga >= gamesPlayed * 5) weaknesses.push('Shooting Efficiency');
    if (ftPct < 60 && fta >= gamesPlayed) weaknesses.push('Free Throws');
    if (fpg >= 4) weaknesses.push('Foul Trouble');

    return {
      playerId,
      playerName,
      gamesPlayed,
      pointsPerGame: ppg,
      reboundsPerGame: rpg,
      assistsPerGame: apg,
      stealsPerGame: spg,
      blocksPerGame: bpg,
      turnoversPerGame: topg,
      foulsPerGame: fpg,
      playerEfficiencyRating: per,
      trueShootingPercentage: tsPct,
      effectiveFGPercentage: efgPct,
      offensiveRating: offRtg,
      usageRate,
      versatilityScore: vps,
      assistToTurnoverRatio: astToRatio,
      fieldGoalPercentage: fgPct,
      threePointPercentage: tpPct,
      freeThrowPercentage: ftPct,
      strengths,
      weaknesses,
      trend: 'stable', // TODO: Calculate from last 5 games
      last5GamesAverage: ppg // TODO: Calculate actual last 5
    };
  }

  /**
   * Return empty player analytics
   */
  private static getEmptyPlayerAnalytics(playerId: string, playerName: string): PlayerAnalytics {
    return {
      playerId,
      playerName,
      gamesPlayed: 0,
      pointsPerGame: 0,
      reboundsPerGame: 0,
      assistsPerGame: 0,
      stealsPerGame: 0,
      blocksPerGame: 0,
      turnoversPerGame: 0,
      foulsPerGame: 0,
      playerEfficiencyRating: 0,
      trueShootingPercentage: 0,
      effectiveFGPercentage: 0,
      offensiveRating: 0,
      usageRate: 0,
      versatilityScore: 0,
      assistToTurnoverRatio: 0,
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
      strengths: [],
      weaknesses: [],
      trend: 'stable',
      last5GamesAverage: 0
    };
  }

  /**
   * Get detailed breakdown for a specific game
   * Includes team stats and top performers
   */
  static async getGameBreakdown(gameId: string, teamId: string): Promise<GameBreakdown> {
    try {
      const accessToken = this.getAccessToken();
      const headers: Record<string, string> = {
        'apikey': this.SUPABASE_ANON_KEY!,
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Fetch game details
      const gameRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=id,home_score,away_score,opponent_name,start_time,end_time,team_a_id,team_b_id`,
        { headers }
      );
      const gameData = await gameRes.json();
      const game = gameData[0];

      if (!game) {
        throw new Error('Game not found');
      }

      // Determine if team is home or away
      const isHome = game.team_a_id === teamId;
      const teamScore = isHome ? game.home_score : game.away_score;
      const opponentScore = isHome ? game.away_score : game.home_score;
      const result: 'W' | 'L' = teamScore > opponentScore ? 'W' : 'L';

      // Fetch all stats for this game
      const statsRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=eq.${gameId}&select=*`,
        { headers }
      );
      const allStats = await statsRes.json();

      // Fetch team players to map player IDs to names
      const playersRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/team_players?coach_team_id=eq.${teamId}&select=id,first_name,last_name,profile_player_id`,
        { headers }
      );
      const players = await playersRes.json();

      // Create player ID to name mapping (handles both team_player_id and profile_player_id)
      const playerMap = new Map<string, string>();
      players.forEach((p: any) => {
        const name = `${p.first_name} ${p.last_name}`.trim();
        playerMap.set(p.id, name);
        if (p.profile_player_id) {
          playerMap.set(p.profile_player_id, name);
        }
      });

      // Calculate team stats
      let fgm = 0, fga = 0, tpm = 0, tpa = 0, ftm = 0, fta = 0;
      let rebounds = 0, assists = 0, turnovers = 0, steals = 0, blocks = 0;

      // Player stats accumulator for top performers
      const playerStats = new Map<string, {
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
        fgm: number;
        fga: number;
      }>();

      allStats.forEach((stat: any) => {
        const playerId = stat.player_id;
        if (!playerStats.has(playerId)) {
          playerStats.set(playerId, { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fgm: 0, fga: 0 });
        }
        const ps = playerStats.get(playerId)!;

        switch (stat.stat_type) {
          case 'field_goal':
          case 'two_pointer':
            fga += 1;
            ps.fga += 1;
            if (stat.modifier === 'made') {
              fgm += 1;
              ps.fgm += 1;
              ps.points += 2;
            }
            break;
          case 'three_pointer':
            tpa += 1;
            fga += 1;
            ps.fga += 1;
            if (stat.modifier === 'made') {
              tpm += 1;
              fgm += 1;
              ps.fgm += 1;
              ps.points += 3;
            }
            break;
          case 'free_throw':
            fta += 1;
            if (stat.modifier === 'made') {
              ftm += 1;
              ps.points += 1;
            }
            break;
          case 'rebound':
          case 'offensive_rebound':
          case 'defensive_rebound':
            rebounds += 1;
            ps.rebounds += 1;
            break;
          case 'assist':
            assists += 1;
            ps.assists += 1;
            break;
          case 'turnover':
            turnovers += 1;
            break;
          case 'steal':
            steals += 1;
            ps.steals += 1;
            break;
          case 'block':
            blocks += 1;
            ps.blocks += 1;
            break;
        }
      });

      // Calculate top performers (by VPS-like score)
      const topPerformers = Array.from(playerStats.entries())
        .filter(([playerId]) => playerMap.has(playerId)) // Only include known players
        .map(([playerId, stats]) => {
          const vps = stats.points * 1.0 + stats.rebounds * 1.2 + stats.assists * 1.5 + stats.steals * 2.0 + stats.blocks * 2.0;
          const statLine = `${stats.points} PTS, ${stats.rebounds} REB, ${stats.assists} AST`;
          return {
            playerId,
            playerName: playerMap.get(playerId) || 'Unknown',
            statLine,
            vps: Math.round(vps * 10) / 10
          };
        })
        .sort((a, b) => b.vps - a.vps)
        .slice(0, 3); // Top 3 performers

      return {
        gameId,
        date: game.start_time || game.end_time || new Date().toISOString(),
        opponent: game.opponent_name || 'Unknown Opponent',
        result,
        teamScore,
        opponentScore,
        teamStats: {
          fieldGoalPercentage: fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0,
          threePointPercentage: tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : 0,
          freeThrowPercentage: fta > 0 ? Math.round((ftm / fta) * 1000) / 10 : 0,
          rebounds,
          assists,
          turnovers,
          steals,
          blocks
        },
        topPerformers
      };
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Failed to fetch game breakdown:', error);
      throw error;
    }
  }

  /**
   * Get season overview for a team
   * Includes win/loss record, trends, and season leaders
   */
  static async getSeasonOverview(teamId: string): Promise<SeasonOverview> {
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
      const teamName = team?.name || 'Unknown Team';

      // Fetch all completed games for this team
      const gamesRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/games?team_a_id=eq.${teamId}&status=eq.completed&select=id,home_score,away_score,start_time&order=start_time.desc`,
        { headers }
      );
      const games = await gamesRes.json();

      if (games.length === 0) {
        return this.getEmptySeasonOverview(teamId, teamName);
      }

      // Calculate win/loss
      let wins = 0, losses = 0;
      games.forEach((game: any) => {
        if (game.home_score > game.away_score) wins++;
        else losses++;
      });

      // Last 5 games record
      const last5 = games.slice(0, 5);
      const last5Record = last5.map((g: any) => g.home_score > g.away_score ? 'W' : 'L').join('-');

      // Fetch all stats for season averages and leaders
      const gameIds = games.map((g: any) => g.id);
      const statsRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/game_stats?game_id=in.(${gameIds.join(',')})&select=*`,
        { headers }
      );
      const allStats = await statsRes.json();

      // Fetch team players
      const playersRes = await fetch(
        `${this.SUPABASE_URL}/rest/v1/team_players?coach_team_id=eq.${teamId}&select=id,first_name,last_name,profile_player_id`,
        { headers }
      );
      const players = await playersRes.json();

      const playerMap = new Map<string, string>();
      players.forEach((p: any) => {
        const name = `${p.first_name} ${p.last_name}`.trim();
        playerMap.set(p.id, name);
        if (p.profile_player_id) {
          playerMap.set(p.profile_player_id, name);
        }
      });

      // Accumulate totals for season averages
      let totalPoints = 0, totalRebounds = 0, totalAssists = 0;
      let fgm = 0, fga = 0, tpm = 0, tpa = 0;

      // Player totals for leaders
      const playerTotals = new Map<string, {
        points: number;
        rebounds: number;
        assists: number;
        vps: number;
      }>();

      allStats.forEach((stat: any) => {
        const playerId = stat.player_id;
        if (!playerTotals.has(playerId)) {
          playerTotals.set(playerId, { points: 0, rebounds: 0, assists: 0, vps: 0 });
        }
        const pt = playerTotals.get(playerId)!;

        switch (stat.stat_type) {
          case 'field_goal':
          case 'two_pointer':
            fga += 1;
            if (stat.modifier === 'made') {
              fgm += 1;
              totalPoints += 2;
              pt.points += 2;
              pt.vps += 2;
            }
            break;
          case 'three_pointer':
            tpa += 1;
            fga += 1;
            if (stat.modifier === 'made') {
              tpm += 1;
              fgm += 1;
              totalPoints += 3;
              pt.points += 3;
              pt.vps += 3;
            }
            break;
          case 'free_throw':
            if (stat.modifier === 'made') {
              totalPoints += 1;
              pt.points += 1;
              pt.vps += 1;
            }
            break;
          case 'rebound':
          case 'offensive_rebound':
          case 'defensive_rebound':
            totalRebounds += 1;
            pt.rebounds += 1;
            pt.vps += 1.2;
            break;
          case 'assist':
            totalAssists += 1;
            pt.assists += 1;
            pt.vps += 1.5;
            break;
          case 'steal':
            pt.vps += 2;
            break;
          case 'block':
            pt.vps += 2;
            break;
        }
      });

      const gamesPlayed = games.length;

      // Find season leaders
      const findLeader = (stat: 'points' | 'rebounds' | 'assists' | 'vps') => {
        let leader = { playerId: '', playerName: 'N/A', value: 0 };
        playerTotals.forEach((totals, playerId) => {
          if (totals[stat] > leader.value && playerMap.has(playerId)) {
            leader = {
              playerId,
              playerName: playerMap.get(playerId) || 'Unknown',
              value: Math.round(totals[stat] * 10) / 10
            };
          }
        });
        return leader;
      };

      return {
        teamId,
        teamName,
        wins,
        losses,
        winPercentage: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : 0,
        last5Record,
        seasonAverages: {
          pointsPerGame: Math.round((totalPoints / gamesPlayed) * 10) / 10,
          reboundsPerGame: Math.round((totalRebounds / gamesPlayed) * 10) / 10,
          assistsPerGame: Math.round((totalAssists / gamesPlayed) * 10) / 10,
          fieldGoalPercentage: fga > 0 ? Math.round((fgm / fga) * 1000) / 10 : 0,
          threePointPercentage: tpa > 0 ? Math.round((tpm / tpa) * 1000) / 10 : 0
        },
        seasonLeaders: {
          points: findLeader('points'),
          rebounds: findLeader('rebounds'),
          assists: findLeader('assists'),
          vps: findLeader('vps')
        }
      };
    } catch (error) {
      console.error('❌ CoachAnalyticsService: Failed to fetch season overview:', error);
      throw error;
    }
  }

  /**
   * Return empty season overview
   */
  private static getEmptySeasonOverview(teamId: string, teamName: string): SeasonOverview {
    return {
      teamId,
      teamName,
      wins: 0,
      losses: 0,
      winPercentage: 0,
      last5Record: '',
      seasonAverages: {
        pointsPerGame: 0,
        reboundsPerGame: 0,
        assistsPerGame: 0,
        fieldGoalPercentage: 0,
        threePointPercentage: 0
      },
      seasonLeaders: {
        points: { playerId: '', playerName: 'N/A', value: 0 },
        rebounds: { playerId: '', playerName: 'N/A', value: 0 },
        assists: { playerId: '', playerName: 'N/A', value: 0 },
        vps: { playerId: '', playerName: 'N/A', value: 0 }
      }
    };
  }
}
