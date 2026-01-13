/**
 * Tournament Leaders Service
 * Fast: Uses pre-computed tournament_leaders table
 * Fallback: Aggregates from game_stats if table is empty
 */

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';
import { logger } from '@/lib/utils/logger';

export interface PlayerLeader {
  rank: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  profilePhotoUrl?: string;
  isCustomPlayer?: boolean;
  gamesPlayed: number;
  // Per-game averages
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  // Totals
  totalPoints: number;
  totalRebounds: number;
  totalAssists: number;
  totalSteals: number;
  totalBlocks: number;
  totalTurnovers: number;
  // Shooting percentages
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  // Field goal attempts/makes
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
}

/** Pre-computed leader row from tournament_leaders table */
interface PrecomputedLeader {
  tournament_id: string;
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  profile_photo_url?: string;
  is_custom_player?: boolean;
  game_phase?: string;
  games_played: number;
  total_points: number;
  total_rebounds: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  field_goals_made: number;
  field_goals_attempted: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  updated_at?: string;
}

interface GameStat {
  game_id: string;
  player_id?: string;
  custom_player_id?: string;
  team_id: string;
  stat_type: string;
  stat_value: number;
  modifier: string;
}

interface Game {
  id: string;
  team_a_id: string;
  team_b_id: string;
}

// Game phase type for filtering
export type LeaderGamePhase = 'all' | 'regular' | 'playoffs' | 'finals';

export class TournamentLeadersService {
  /**
   * Get player leaders for a tournament
   * Fast path: Uses pre-computed tournament_leaders table
   * Fallback: Calculates from game_stats if table is empty
   * 
   * @param gamePhase - Optional filter: 'all' (default), 'regular', 'playoffs', 'finals'
   */
  static async getTournamentPlayerLeaders(
    tournamentId: string,
    category: 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' = 'points',
    minGames: number = 1,
    gamePhase: LeaderGamePhase = 'all'
  ): Promise<PlayerLeader[]> {
    try {
      logger.debug('🏆 TournamentLeadersService: Fetching leaders for tournament:', tournamentId, 'phase:', gamePhase);

      // ⚡ FAST PATH: Try pre-computed table first (now supports game_phase filtering)
      const precomputedLeaders = await this.fetchPrecomputedLeaders(tournamentId, minGames, gamePhase);
      if (precomputedLeaders.length > 0) {
        logger.debug('⚡ TournamentLeadersService: Using pre-computed leaders (fast path), phase:', gamePhase);
        return this.sortLeaders(precomputedLeaders, category);
      }

      // 🔄 FALLBACK: Calculate from game_stats (slow path)
      logger.debug('🔄 TournamentLeadersService: No pre-computed data, calculating from game_stats (phase:', gamePhase, ')');
      return this.calculateLeadersFromGameStats(tournamentId, category, minGames, gamePhase);
    } catch (error) {
      logger.error('❌ TournamentLeadersService: Error fetching leaders:', error);
      return [];
    }
  }

  /**
   * ⚡ Fast path: Fetch from pre-computed tournament_leaders table
   * Database now has proper 'all' rows, so we filter by game_phase directly for all cases
   */
  private static async fetchPrecomputedLeaders(
    tournamentId: string,
    minGames: number,
    gamePhase: LeaderGamePhase = 'all'
  ): Promise<PlayerLeader[]> {
    try {
      // Build query filters - always filter by game_phase (including 'all')
      const filters: Record<string, string> = { 
        tournament_id: `eq.${tournamentId}`,
        game_phase: `eq.${gamePhase}`
      };

      const rows = await hybridSupabaseService.query<PrecomputedLeader>(
        'tournament_leaders',
        '*',
        filters
      );

      if (!rows || rows.length === 0) return [];

      logger.debug('⚡ TournamentLeadersService: Fetched', rows.length, 'rows for phase:', gamePhase);

      // Map database rows to PlayerLeader interface
      return rows
        .filter(row => row.games_played >= minGames)
        .map((row, index) => {
          const gp = row.games_played || 1;
          const fgPct = row.field_goals_attempted > 0
            ? Math.round((row.field_goals_made / row.field_goals_attempted) * 1000) / 10 : 0;
          const threePct = row.three_pointers_attempted > 0
            ? Math.round((row.three_pointers_made / row.three_pointers_attempted) * 1000) / 10 : 0;
          const ftPct = row.free_throws_attempted > 0
            ? Math.round((row.free_throws_made / row.free_throws_attempted) * 1000) / 10 : 0;

          return {
            rank: index + 1,
            playerId: row.player_id,
            playerName: row.player_name || 'Unknown Player',
            teamId: row.team_id,
            teamName: row.team_name || 'Unknown Team',
            profilePhotoUrl: row.profile_photo_url,
            isCustomPlayer: row.is_custom_player || false,
            gamesPlayed: gp,
            pointsPerGame: Math.round((row.total_points / gp) * 10) / 10,
            reboundsPerGame: Math.round((row.total_rebounds / gp) * 10) / 10,
            assistsPerGame: Math.round((row.total_assists / gp) * 10) / 10,
            stealsPerGame: Math.round((row.total_steals / gp) * 10) / 10,
            blocksPerGame: Math.round((row.total_blocks / gp) * 10) / 10,
            turnoversPerGame: Math.round((row.total_turnovers / gp) * 10) / 10,
            totalPoints: row.total_points,
            totalRebounds: row.total_rebounds,
            totalAssists: row.total_assists,
            totalSteals: row.total_steals,
            totalBlocks: row.total_blocks,
            totalTurnovers: row.total_turnovers,
            fieldGoalPercentage: fgPct,
            threePointPercentage: threePct,
            freeThrowPercentage: ftPct,
            fieldGoalsMade: row.field_goals_made,
            fieldGoalsAttempted: row.field_goals_attempted,
            threePointersMade: row.three_pointers_made,
            threePointersAttempted: row.three_pointers_attempted,
            freeThrowsMade: row.free_throws_made,
            freeThrowsAttempted: row.free_throws_attempted,
          };
        });
    } catch (error) {
      logger.warn('⚠️ TournamentLeadersService: Pre-computed table query failed, using fallback:', error);
      return [];
    }
  }

  /**
   * Sort leaders by category and assign ranks
   */
  private static sortLeaders(
    leaders: PlayerLeader[],
    category: 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks'
  ): PlayerLeader[] {
    leaders.sort((a, b) => {
      switch (category) {
        case 'points': return b.pointsPerGame - a.pointsPerGame;
        case 'rebounds': return b.reboundsPerGame - a.reboundsPerGame;
        case 'assists': return b.assistsPerGame - a.assistsPerGame;
        case 'steals': return b.stealsPerGame - a.stealsPerGame;
        case 'blocks': return b.blocksPerGame - a.blocksPerGame;
        default: return b.pointsPerGame - a.pointsPerGame;
      }
    });
    leaders.forEach((leader, index) => { leader.rank = index + 1; });
    return leaders;
  }

  /**
   * 🔄 Fallback: Calculate leaders from game_stats (slow path)
   * Supports optional gamePhase filtering
   */
  private static async calculateLeadersFromGameStats(
    tournamentId: string,
    category: 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks',
    minGames: number,
    gamePhase: LeaderGamePhase = 'all'
  ): Promise<PlayerLeader[]> {
    // Build query filters
    const filters: Record<string, string> = { tournament_id: `eq.${tournamentId}` };
    
    // Add game_phase filter if not 'all'
    if (gamePhase !== 'all') {
      filters.game_phase = `eq.${gamePhase}`;
    }
    
    // Fetch games for this tournament (optionally filtered by phase)
    const games = await hybridSupabaseService.query<Game & { game_phase?: string }>(
      'games',
      'id, team_a_id, team_b_id, game_phase',
      filters
    );

    if (!games || games.length === 0) {
      logger.debug('🏆 TournamentLeadersService: No games found');
      return [];
    }

    // Fetch game_stats PER GAME to avoid Supabase 1000 row limit
    logger.debug('🏆 TournamentLeadersService: Fetching stats for', games.length, 'games (per-game queries)');
    
    const statsPromises = games.map(async (game) => {
      try {
        const stats = await hybridSupabaseService.query<GameStat>(
          'game_stats',
          'game_id, player_id, custom_player_id, team_id, stat_type, stat_value, modifier',
          { game_id: `eq.${game.id}` }
        );
        return stats || [];
      } catch (error) {
        logger.error(`❌ Failed to fetch stats for game ${game.id}:`, error);
        return [];
      }
    });
    
    const statsResults = await Promise.all(statsPromises);
    const allStats: GameStat[] = statsResults.flat();
    
    logger.debug('✅ TournamentLeadersService: Fetched', allStats.length, 'total stats from', games.length, 'games');

    if (allStats.length === 0) {
      logger.debug('🏆 TournamentLeadersService: No stats found');
      return [];
    }

    // Get all teams to map team IDs to names
    const teams = await TeamService.getTeamsByTournament(tournamentId);
    const teamMap = new Map(teams.map(t => [t.id, { name: t.name }]));

    // Aggregate stats by player
    const playerStatsMap = new Map<string, {
      playerId: string;
      isCustomPlayer: boolean;
      teamId: string;
      gamesPlayed: Set<string>;
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
      fieldGoalsMade: number;
      fieldGoalsAttempted: number;
      threePointersMade: number;
      threePointersAttempted: number;
      freeThrowsMade: number;
      freeThrowsAttempted: number;
    }>();

    // Process each stat
    allStats.forEach(stat => {
      const playerId = stat.player_id || stat.custom_player_id;
      const isCustomPlayer = !!stat.custom_player_id;
      if (!playerId) return;

      if (!playerStatsMap.has(playerId)) {
        playerStatsMap.set(playerId, {
          playerId, isCustomPlayer, teamId: stat.team_id,
          gamesPlayed: new Set(), points: 0, rebounds: 0, assists: 0,
          steals: 0, blocks: 0, turnovers: 0,
          fieldGoalsMade: 0, fieldGoalsAttempted: 0,
          threePointersMade: 0, threePointersAttempted: 0,
          freeThrowsMade: 0, freeThrowsAttempted: 0,
        });
      }

      const ps = playerStatsMap.get(playerId)!;
      ps.gamesPlayed.add(stat.game_id);
      const value = stat.stat_value || 1;

      switch (stat.stat_type) {
        case 'field_goal': case 'two_pointer':
          if (stat.modifier === 'made') { ps.points += 2; ps.fieldGoalsMade++; ps.fieldGoalsAttempted++; }
          else if (stat.modifier === 'missed') { ps.fieldGoalsAttempted++; }
          break;
        case 'three_pointer':
          if (stat.modifier === 'made') { ps.points += 3; ps.threePointersMade++; ps.threePointersAttempted++; ps.fieldGoalsMade++; ps.fieldGoalsAttempted++; }
          else if (stat.modifier === 'missed') { ps.threePointersAttempted++; ps.fieldGoalsAttempted++; }
          break;
        case 'free_throw':
          if (stat.modifier === 'made') { ps.points += 1; ps.freeThrowsMade++; ps.freeThrowsAttempted++; }
          else if (stat.modifier === 'missed') { ps.freeThrowsAttempted++; }
          break;
        case 'rebound': ps.rebounds += value; break;
        case 'assist': ps.assists += value; break;
        case 'steal': ps.steals += value; break;
        case 'block': ps.blocks += value; break;
        case 'turnover': ps.turnovers += value; break;
      }
    });

    // Separate regular and custom players
    const regularPlayerIds: string[] = [];
    const customPlayerIds: string[] = [];
    playerStatsMap.forEach((stats) => {
      if (stats.isCustomPlayer) customPlayerIds.push(stats.playerId);
      else regularPlayerIds.push(stats.playerId);
    });

    const playerInfoMap = new Map<string, { name: string; profilePhotoUrl?: string; isCustomPlayer: boolean }>();

    // Fetch regular players
    if (regularPlayerIds.length > 0) {
      const promises = regularPlayerIds.map(id =>
        hybridSupabaseService.query<{ id: string; name: string; profile_photo_url?: string }>('users', 'id, name, profile_photo_url', { id: `eq.${id}` })
      );
      const results = await Promise.all(promises);
      results.flat().forEach(p => playerInfoMap.set(p.id, { name: p.name || 'Unknown', profilePhotoUrl: p.profile_photo_url, isCustomPlayer: false }));
    }

    // Fetch custom players (include profile_photo_url)
    if (customPlayerIds.length > 0) {
      const promises = customPlayerIds.map(id =>
        hybridSupabaseService.query<{ id: string; name: string; profile_photo_url?: string }>('custom_players', 'id, name, profile_photo_url', { id: `eq.${id}` })
      );
      const results = await Promise.all(promises);
      results.flat().forEach(p => playerInfoMap.set(p.id, { name: p.name || 'Custom Player', profilePhotoUrl: p.profile_photo_url, isCustomPlayer: true }));
    }

    // Convert to leaders array
    const leaders: PlayerLeader[] = Array.from(playerStatsMap.values())
      .filter(p => p.gamesPlayed.size >= minGames)
      .map(p => {
        const gp = p.gamesPlayed.size;
        const info = playerInfoMap.get(p.playerId);
        const team = teamMap.get(p.teamId);
        const fgPct = p.fieldGoalsAttempted > 0 ? Math.round((p.fieldGoalsMade / p.fieldGoalsAttempted) * 1000) / 10 : 0;
        const threePct = p.threePointersAttempted > 0 ? Math.round((p.threePointersMade / p.threePointersAttempted) * 1000) / 10 : 0;
        const ftPct = p.freeThrowsAttempted > 0 ? Math.round((p.freeThrowsMade / p.freeThrowsAttempted) * 1000) / 10 : 0;

        return {
          rank: 0, playerId: p.playerId, playerName: info?.name || 'Unknown Player',
          teamId: p.teamId, teamName: team?.name || 'Unknown Team',
          profilePhotoUrl: info?.profilePhotoUrl, isCustomPlayer: p.isCustomPlayer || info?.isCustomPlayer || false,
          gamesPlayed: gp,
          pointsPerGame: Math.round((p.points / gp) * 10) / 10,
          reboundsPerGame: Math.round((p.rebounds / gp) * 10) / 10,
          assistsPerGame: Math.round((p.assists / gp) * 10) / 10,
          stealsPerGame: Math.round((p.steals / gp) * 10) / 10,
          blocksPerGame: Math.round((p.blocks / gp) * 10) / 10,
          turnoversPerGame: Math.round((p.turnovers / gp) * 10) / 10,
          totalPoints: p.points, totalRebounds: p.rebounds, totalAssists: p.assists,
          totalSteals: p.steals, totalBlocks: p.blocks, totalTurnovers: p.turnovers,
          fieldGoalPercentage: fgPct, threePointPercentage: threePct, freeThrowPercentage: ftPct,
          fieldGoalsMade: p.fieldGoalsMade, fieldGoalsAttempted: p.fieldGoalsAttempted,
          threePointersMade: p.threePointersMade, threePointersAttempted: p.threePointersAttempted,
          freeThrowsMade: p.freeThrowsMade, freeThrowsAttempted: p.freeThrowsAttempted,
        };
      });

    logger.debug('✅ TournamentLeadersService: Calculated', leaders.length, 'leaders (fallback)');
    return this.sortLeaders(leaders, category);
  }
}

