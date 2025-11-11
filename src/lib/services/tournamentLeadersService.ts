/**
 * Tournament Leaders Service
 * Aggregates player statistics across all tournament games
 */

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';

export interface PlayerLeader {
  rank: number;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  profilePhotoUrl?: string;
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

export class TournamentLeadersService {
  /**
   * Get player leaders for a tournament
   */
  static async getTournamentPlayerLeaders(
    tournamentId: string,
    category: 'points' | 'rebounds' | 'assists' | 'steals' | 'blocks' = 'points',
    minGames: number = 1
  ): Promise<PlayerLeader[]> {
    try {
      console.log('🏆 TournamentLeadersService: Calculating leaders for tournament:', tournamentId, 'category:', category);

      // Fetch all games for this tournament
      const games = await hybridSupabaseService.query<Game>(
        'games',
        'id, team_a_id, team_b_id',
        { tournament_id: `eq.${tournamentId}` }
      );

      if (!games || games.length === 0) {
        console.log('🏆 TournamentLeadersService: No games found');
        return [];
      }

      const gameIds = games.map(g => g.id);

      // Fetch all game stats for these games
      // Note: This might be a large query for tournaments with many games
      const allStats: GameStat[] = [];
      for (const gameId of gameIds) {
        const stats = await hybridSupabaseService.query<GameStat>(
          'game_stats',
          'game_id, player_id, custom_player_id, team_id, stat_type, stat_value, modifier',
          { game_id: `eq.${gameId}` }
        );
        allStats.push(...stats);
      }

      if (allStats.length === 0) {
        console.log('🏆 TournamentLeadersService: No stats found');
        return [];
      }

      // Get all teams to map team IDs to names
      const teams = await TeamService.getTeamsByTournament(tournamentId);
      const teamMap = new Map(teams.map(t => [t.id, { name: t.name }]));

      // Aggregate stats by player
      const playerStatsMap = new Map<string, {
        playerId: string;
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
        if (!playerId) return;

        // Initialize player if not exists
        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            playerId,
            teamId: stat.team_id,
            gamesPlayed: new Set(),
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            threePointersMade: 0,
            threePointersAttempted: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
          });
        }

        const playerStats = playerStatsMap.get(playerId)!;
        playerStats.gamesPlayed.add(stat.game_id);

        const statType = stat.stat_type;
        const modifier = stat.modifier;
        const value = stat.stat_value || 1;

        // Aggregate stats
        switch (statType) {
          case 'field_goal':
          case 'two_pointer':
            if (modifier === 'made') {
              playerStats.points += 2;
              playerStats.fieldGoalsMade += 1;
              playerStats.fieldGoalsAttempted += 1;
            } else if (modifier === 'missed') {
              playerStats.fieldGoalsAttempted += 1;
            }
            break;
          case 'three_pointer':
            if (modifier === 'made') {
              playerStats.points += 3;
              playerStats.threePointersMade += 1;
              playerStats.threePointersAttempted += 1;
              playerStats.fieldGoalsMade += 1;
              playerStats.fieldGoalsAttempted += 1;
            } else if (modifier === 'missed') {
              playerStats.threePointersAttempted += 1;
              playerStats.fieldGoalsAttempted += 1;
            }
            break;
          case 'free_throw':
            if (modifier === 'made') {
              playerStats.points += 1;
              playerStats.freeThrowsMade += 1;
              playerStats.freeThrowsAttempted += 1;
            } else if (modifier === 'missed') {
              playerStats.freeThrowsAttempted += 1;
            }
            break;
          case 'rebound':
            playerStats.rebounds += value;
            break;
          case 'assist':
            playerStats.assists += value;
            break;
          case 'steal':
            playerStats.steals += value;
            break;
          case 'block':
            playerStats.blocks += value;
            break;
          case 'turnover':
            playerStats.turnovers += value;
            break;
        }
      });

      // Get player info (name, photo) for regular players
      const regularPlayerIds = Array.from(playerStatsMap.keys()).filter(id => !id.includes('custom'));
      const playerInfoMap = new Map<string, { name: string; profilePhotoUrl?: string }>();

      if (regularPlayerIds.length > 0) {
        // Fetch players in batches to avoid query length limits
        const batchSize = 50;
        for (let i = 0; i < regularPlayerIds.length; i += batchSize) {
          const batch = regularPlayerIds.slice(i, i + batchSize);
          const idFilter = batch.map(id => `eq.${id}`).join(',');
          
          // Use multiple queries for each ID (hybridSupabaseService doesn't support complex in() syntax)
          const playerPromises = batch.map(playerId =>
            hybridSupabaseService.query<{ id: string; name: string; profile_photo_url?: string }>(
              'users',
              'id, name, profile_photo_url',
              { id: `eq.${playerId}` }
            )
          );
          
          const playerResults = await Promise.all(playerPromises);
          playerResults.forEach(players => {
            players.forEach(player => {
              playerInfoMap.set(player.id, {
                name: player.name || 'Unknown Player',
                profilePhotoUrl: player.profile_photo_url || undefined,
              });
            });
          });
        }
      }

      // Convert to leaders array
      const leaders: PlayerLeader[] = Array.from(playerStatsMap.values())
        .filter(player => player.gamesPlayed.size >= minGames)
        .map(player => {
          const gamesPlayed = player.gamesPlayed.size;
          const playerInfo = playerInfoMap.get(player.playerId);
          const teamInfo = teamMap.get(player.teamId);

          // Calculate percentages
          const fieldGoalPercentage = player.fieldGoalsAttempted > 0
            ? Math.round((player.fieldGoalsMade / player.fieldGoalsAttempted) * 1000) / 10
            : 0;
          const threePointPercentage = player.threePointersAttempted > 0
            ? Math.round((player.threePointersMade / player.threePointersAttempted) * 1000) / 10
            : 0;
          const freeThrowPercentage = player.freeThrowsAttempted > 0
            ? Math.round((player.freeThrowsMade / player.freeThrowsAttempted) * 1000) / 10
            : 0;

          return {
            rank: 0, // Will be set after sorting
            playerId: player.playerId,
            playerName: playerInfo?.name || 'Unknown Player',
            teamId: player.teamId,
            teamName: teamInfo?.name || 'Unknown Team',
            profilePhotoUrl: playerInfo?.profilePhotoUrl,
            gamesPlayed,
            pointsPerGame: gamesPlayed > 0 ? Math.round((player.points / gamesPlayed) * 10) / 10 : 0,
            reboundsPerGame: gamesPlayed > 0 ? Math.round((player.rebounds / gamesPlayed) * 10) / 10 : 0,
            assistsPerGame: gamesPlayed > 0 ? Math.round((player.assists / gamesPlayed) * 10) / 10 : 0,
            stealsPerGame: gamesPlayed > 0 ? Math.round((player.steals / gamesPlayed) * 10) / 10 : 0,
            blocksPerGame: gamesPlayed > 0 ? Math.round((player.blocks / gamesPlayed) * 10) / 10 : 0,
            turnoversPerGame: gamesPlayed > 0 ? Math.round((player.turnovers / gamesPlayed) * 10) / 10 : 0,
            totalPoints: player.points,
            totalRebounds: player.rebounds,
            totalAssists: player.assists,
            totalSteals: player.steals,
            totalBlocks: player.blocks,
            totalTurnovers: player.turnovers,
            fieldGoalPercentage,
            threePointPercentage,
            freeThrowPercentage,
            fieldGoalsMade: player.fieldGoalsMade,
            fieldGoalsAttempted: player.fieldGoalsAttempted,
            threePointersMade: player.threePointersMade,
            threePointersAttempted: player.threePointersAttempted,
            freeThrowsMade: player.freeThrowsMade,
            freeThrowsAttempted: player.freeThrowsAttempted,
          };
        });

      // Sort by category
      leaders.sort((a, b) => {
        switch (category) {
          case 'points':
            return b.pointsPerGame - a.pointsPerGame;
          case 'rebounds':
            return b.reboundsPerGame - a.reboundsPerGame;
          case 'assists':
            return b.assistsPerGame - a.assistsPerGame;
          case 'steals':
            return b.stealsPerGame - a.stealsPerGame;
          case 'blocks':
            return b.blocksPerGame - a.blocksPerGame;
          default:
            return b.pointsPerGame - a.pointsPerGame;
        }
      });

      // Assign ranks
      leaders.forEach((leader, index) => {
        leader.rank = index + 1;
      });

      console.log('✅ TournamentLeadersService: Calculated leaders for', leaders.length, 'players');
      return leaders;
    } catch (error) {
      console.error('❌ TournamentLeadersService: Error calculating leaders:', error);
      return [];
    }
  }
}

