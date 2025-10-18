/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase';

// Types for game stats aggregation
export interface GameStatsSummary {
  gameId: string;
  gameDate: string;
  opponent: string;
  opponentId: string;
  tournamentName: string;
  isHome: boolean;
  result: 'W' | 'L' | 'N/A';
  finalScore: string; // "85-78"
  minutesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
}

interface RawGameStat {
  game_id: string;
  stat_type: string;
  stat_value: number;
  modifier: string | null;
  quarter: number;
}

interface GameInfo {
  id: string;
  created_at: string;
  team_a_id: string;
  team_b_id: string;
  home_score: number;
  away_score: number;
  tournament_id: string;
  tournaments: {
    name: string;
  };
  team_a: {
    id: string;
    name: string;
  };
  team_b: {
    id: string;
    name: string;
  };
}

export class PlayerGameStatsService {
  /**
   * Fetch all game stats for a player and aggregate by game
   */
  static async getPlayerGameStats(userId: string): Promise<GameStatsSummary[]> {
    try {
      console.log('🏀 PlayerGameStatsService: Fetching game stats for player:', userId);

      // Step 1: Get all raw stats for this player from game_stats table
      const { data: rawStats, error: statsError } = await supabase
        .from('game_stats')
        .select('game_id, stat_type, stat_value, modifier, quarter')
        .eq('player_id', userId)
        .order('created_at', { ascending: false });

      if (statsError) {
        console.error('❌ Error fetching player game stats:', statsError);
        return [];
      }

      if (!rawStats || rawStats.length === 0) {
        console.log('📊 No game stats found for player');
        return [];
      }

      console.log(`📊 Found ${rawStats.length} raw stats for player`);

      // Step 2: Get unique game IDs
      const gameIds = [...new Set(rawStats.map(s => s.game_id))];
      console.log(`🎮 Player participated in ${gameIds.length} games`);

      // Step 3: Fetch game info for all games
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select(`
          id,
          created_at,
          team_a_id,
          team_b_id,
          home_score,
          away_score,
          tournament_id,
          tournaments (name),
          team_a:teams!team_a_id (id, name),
          team_b:teams!team_b_id (id, name)
        `)
        .in('id', gameIds);

      if (gamesError) {
        console.error('❌ Error fetching game info:', gamesError);
        return [];
      }

      if (!games || games.length === 0) {
        console.log('📊 No game info found');
        return [];
      }

      // Step 4: Get player's team assignments to determine home/away
      const { data: teamPlayers, error: teamError } = await supabase
        .from('team_players')
        .select('team_id')
        .eq('player_id', userId);

      if (teamError) {
        console.error('❌ Error fetching player teams:', teamError);
        return [];
      }

      const playerTeamIds = teamPlayers?.map(tp => tp.team_id) || [];

      // Step 5: Aggregate stats by game
      const gameStatsSummaries = gameIds.map(gameId => {
        const gameStats = rawStats.filter(s => s.game_id === gameId) as RawGameStat[];
        const gameInfo = games.find(g => g.id === gameId) as GameInfo | undefined;

        if (!gameInfo) {
          return null;
        }

        // Determine if player is on team A or B
        const isTeamA = playerTeamIds.includes(gameInfo.team_a_id);
        const isTeamB = playerTeamIds.includes(gameInfo.team_b_id);
        const isHome = isTeamA; // Assuming team_a is home
        const playerTeam = isTeamA ? gameInfo.team_a : gameInfo.team_b;
        const opponentTeam = isTeamA ? gameInfo.team_b : gameInfo.team_a;
        const playerScore = isTeamA ? gameInfo.home_score : gameInfo.away_score;
        const opponentScore = isTeamA ? gameInfo.away_score : gameInfo.home_score;

        // Calculate result
        let result: 'W' | 'L' | 'N/A' = 'N/A';
        if (playerScore > opponentScore) result = 'W';
        else if (playerScore < opponentScore) result = 'L';

        // Aggregate stats
        const stats = this.aggregateGameStats(gameStats);

        return {
          gameId,
          gameDate: gameInfo.created_at,
          opponent: opponentTeam?.name || 'Unknown',
          opponentId: opponentTeam?.id || '',
          tournamentName: gameInfo.tournaments?.name || 'Unknown Tournament',
          isHome,
          result,
          finalScore: `${playerScore}-${opponentScore}`,
          ...stats
        } as GameStatsSummary;
      }).filter(Boolean) as GameStatsSummary[];

      console.log(`✅ Aggregated stats for ${gameStatsSummaries.length} games`);
      return gameStatsSummaries;

    } catch (error) {
      console.error('❌ PlayerGameStatsService: Unexpected error:', error);
      return [];
    }
  }

  /**
   * Aggregate raw stats into box score format
   */
  private static aggregateGameStats(gameStats: RawGameStat[]) {
    // Initialize counters
    let points = 0;
    let rebounds = 0;
    let assists = 0;
    let steals = 0;
    let blocks = 0;
    let turnovers = 0;
    let fouls = 0;

    let fieldGoalsMade = 0;
    let fieldGoalsAttempted = 0;
    let threePointersMade = 0;
    let threePointersAttempted = 0;
    let freeThrowsMade = 0;
    let freeThrowsAttempted = 0;

    // Count quarters played for minutes estimation
    const quartersPlayed = new Set(gameStats.map(s => s.quarter)).size;
    const minutesPlayed = quartersPlayed * 10; // Rough estimate: 10 min per quarter

    // Aggregate stats
    gameStats.forEach(stat => {
      const statType = stat.stat_type;
      const modifier = stat.modifier;
      const value = stat.stat_value;

      // Points from made shots
      if (modifier === 'made') {
        points += value;

        if (statType === 'field_goal' || statType === 'two_pointer') {
          fieldGoalsMade++;
          fieldGoalsAttempted++;
        } else if (statType === 'three_pointer') {
          threePointersMade++;
          threePointersAttempted++;
          fieldGoalsMade++; // 3-pointers also count as field goals
          fieldGoalsAttempted++;
        } else if (statType === 'free_throw') {
          freeThrowsMade++;
          freeThrowsAttempted++;
        }
      }

      // Missed shots
      if (modifier === 'missed') {
        if (statType === 'field_goal' || statType === 'two_pointer') {
          fieldGoalsAttempted++;
        } else if (statType === 'three_pointer') {
          threePointersAttempted++;
          fieldGoalsAttempted++;
        } else if (statType === 'free_throw') {
          freeThrowsAttempted++;
        }
      }

      // Non-shooting stats
      if (statType === 'rebound') rebounds += value;
      if (statType === 'assist') assists += value;
      if (statType === 'steal') steals += value;
      if (statType === 'block') blocks += value;
      if (statType === 'turnover') turnovers += value;
      if (statType === 'foul') fouls += value;
    });

    // Calculate percentages
    const fieldGoalPercentage = fieldGoalsAttempted > 0
      ? Math.round((fieldGoalsMade / fieldGoalsAttempted) * 100)
      : 0;

    const threePointPercentage = threePointersAttempted > 0
      ? Math.round((threePointersMade / threePointersAttempted) * 100)
      : 0;

    const freeThrowPercentage = freeThrowsAttempted > 0
      ? Math.round((freeThrowsMade / freeThrowsAttempted) * 100)
      : 0;

    return {
      minutesPlayed,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fouls,
      fieldGoalsMade,
      fieldGoalsAttempted,
      threePointersMade,
      threePointersAttempted,
      freeThrowsMade,
      freeThrowsAttempted,
      fieldGoalPercentage,
      threePointPercentage,
      freeThrowPercentage
    };
  }
}
