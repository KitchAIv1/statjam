/**
 * Tournament Standings Service
 * Calculates team standings from completed games
 */

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';
import { TeamService } from '@/lib/services/tournamentService';

export interface TeamStanding {
  rank: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  streak: string; // "W3" or "L2"
  gamesPlayed: number;
}

interface GameResult {
  id: string;
  team_a_id: string;
  team_b_id: string;
  home_score: number;
  away_score: number;
  status: string;
}

interface GameStat {
  game_id: string;
  team_id: string;
  stat_value: number;
  modifier: string;
}

export class TournamentStandingsService {
  /**
   * Get tournament standings calculated from completed games
   */
  static async getTournamentStandings(tournamentId: string): Promise<TeamStanding[]> {
    try {
      console.log('📊 TournamentStandingsService: Calculating standings for tournament:', tournamentId);

      // Fetch all completed games for this tournament
      const games = await hybridSupabaseService.query<GameResult>(
        'games',
        'id, team_a_id, team_b_id, home_score, away_score, status',
        { tournament_id: `eq.${tournamentId}`, status: `eq.completed` }
      );

      if (!games || games.length === 0) {
        console.log('📊 TournamentStandingsService: No completed games found');
        return [];
      }

      // Fetch game_stats for all completed games to calculate scores as fallback
      const gameIds = games.map(g => g.id);
      let gameStatsMap = new Map<string, GameStat[]>();
      
      if (gameIds.length > 0) {
        try {
          // Fetch stats for all games at once (more efficient)
          const allStats = await hybridSupabaseService.query<GameStat>(
            'game_stats',
            'game_id, team_id, stat_value, modifier',
            { game_id: `in.(${gameIds.join(',')})` }
          );
          
          // Group stats by game_id
          allStats.forEach(stat => {
            if (!gameStatsMap.has(stat.game_id)) {
              gameStatsMap.set(stat.game_id, []);
            }
            gameStatsMap.get(stat.game_id)!.push(stat);
          });
        } catch (error) {
          console.warn('⚠️ TournamentStandingsService: Failed to fetch game_stats, using DB scores only:', error);
        }
      }

      /**
       * Calculate scores from game_stats as fallback if DB scores are 0
       */
      const calculateScoresFromStats = (gameId: string, teamAId: string, teamBId: string): { teamAScore: number; teamBScore: number } => {
        const stats = gameStatsMap.get(gameId) || [];
        let teamAScore = 0;
        let teamBScore = 0;
        
        stats.forEach(stat => {
          // Only count made shots (modifier = 'made')
          if (stat.modifier === 'made') {
            const points = stat.stat_value || 0;
            if (stat.team_id === teamAId) {
              teamAScore += points;
            } else if (stat.team_id === teamBId) {
              teamBScore += points;
            }
          }
        });
        
        return { teamAScore, teamBScore };
      };

      // Fetch all teams for this tournament to get names/logos
      const teams = await TeamService.getTeamsByTournament(tournamentId);
      const teamMap = new Map(teams.map(t => [t.id, { name: t.name, logo: (t as any).logo_url || (t as any).logo }]));

      // Initialize standings map
      const standingsMap = new Map<string, {
        teamId: string;
        wins: number;
        losses: number;
        pointsFor: number;
        pointsAgainst: number;
        recentResults: ('W' | 'L')[];
      }>();

      // Process each completed game
      games.forEach(game => {
        const teamAId = game.team_a_id;
        const teamBId = game.team_b_id;
        
        // Use DB scores if available, otherwise calculate from game_stats as fallback
        let teamAScore = game.home_score || 0;
        let teamBScore = game.away_score || 0;
        
        // If scores are 0 or missing, calculate from game_stats as fallback
        // This handles cases where the database trigger didn't update scores properly
        const gameStats = gameStatsMap.get(game.id) || [];
        const hasStats = gameStats.length > 0;
        
        if ((teamAScore === 0 && teamBScore === 0) && hasStats) {
          const calculatedScores = calculateScoresFromStats(game.id, teamAId, teamBId);
          teamAScore = calculatedScores.teamAScore;
          teamBScore = calculatedScores.teamBScore;
          
          if (teamAScore > 0 || teamBScore > 0) {
            console.log(`📊 TournamentStandingsService: Calculated scores from stats for game ${game.id}:`, {
              dbScores: { home: game.home_score, away: game.away_score },
              calculatedScores: { teamAScore, teamBScore },
              statsCount: gameStats.length
            });
          }
        }

        // Initialize team A if not exists
        if (!standingsMap.has(teamAId)) {
          standingsMap.set(teamAId, {
            teamId: teamAId,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            recentResults: [],
          });
        }

        // Initialize team B if not exists
        if (!standingsMap.has(teamBId)) {
          standingsMap.set(teamBId, {
            teamId: teamBId,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            recentResults: [],
          });
        }

        const teamA = standingsMap.get(teamAId)!;
        const teamB = standingsMap.get(teamBId)!;

        // Update scores
        teamA.pointsFor += teamAScore;
        teamA.pointsAgainst += teamBScore;
        teamB.pointsFor += teamBScore;
        teamB.pointsAgainst += teamAScore;

        // Update wins/losses and recent results
        if (teamAScore > teamBScore) {
          teamA.wins++;
          teamA.recentResults.push('W');
          teamB.losses++;
          teamB.recentResults.push('L');
        } else if (teamBScore > teamAScore) {
          teamB.wins++;
          teamB.recentResults.push('W');
          teamA.losses++;
          teamA.recentResults.push('L');
        }
        // Tie handling (if needed in future)
      });

      // Convert to standings array and calculate streaks
      const standings: TeamStanding[] = Array.from(standingsMap.values()).map(team => {
        const teamInfo = teamMap.get(team.teamId);
        const pointDifferential = team.pointsFor - team.pointsAgainst;
        const streak = this.calculateStreak(team.recentResults);

        return {
          rank: 0, // Will be set after sorting
          teamId: team.teamId,
          teamName: teamInfo?.name || 'Unknown Team',
          teamLogo: teamInfo?.logo,
          wins: team.wins,
          losses: team.losses,
          pointsFor: team.pointsFor,
          pointsAgainst: team.pointsAgainst,
          pointDifferential,
          streak,
          gamesPlayed: team.wins + team.losses,
        };
      });

      // Sort standings: wins (desc), then point differential (desc), then points for (desc)
      standings.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pointDifferential !== a.pointDifferential) return b.pointDifferential - a.pointDifferential;
        return b.pointsFor - a.pointsFor;
      });

      // Assign ranks
      standings.forEach((standing, index) => {
        standing.rank = index + 1;
      });

      console.log('✅ TournamentStandingsService: Calculated standings for', standings.length, 'teams');
      return standings;
    } catch (error) {
      console.error('❌ TournamentStandingsService: Error calculating standings:', error);
      return [];
    }
  }

  /**
   * Calculate win/loss streak from recent results
   */
  private static calculateStreak(recentResults: ('W' | 'L')[]): string {
    if (recentResults.length === 0) return '-';

    const lastResult = recentResults[recentResults.length - 1];
    let streakCount = 1;

    // Count backwards from the last result
    for (let i = recentResults.length - 2; i >= 0; i--) {
      if (recentResults[i] === lastResult) {
        streakCount++;
      } else {
        break;
      }
    }

    return `${lastResult}${streakCount}`;
  }
}

