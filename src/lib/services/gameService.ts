import { supabase } from '@/lib/supabase';
import { Game, GameStat, PlayerGameStats, GameSubstitution, AuditLog } from '@/lib/types/game';

export class GameService {
  // Get current game for stat admin
  static async getCurrentGame(statAdminId: string): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('stat_admin_id', statAdminId)
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error getting current game:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentGame:', error);
      return null;
    }
  }

  // Start a game
  static async startGame(gameId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
          quarter: 1,
          game_clock_minutes: 12,
          game_clock_seconds: 0,
          is_clock_running: false
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error starting game:', error);
        return false;
      }

      // Log the action
      await this.createAuditLog(gameId, 'game_start', { gameId });

      return true;
    } catch (error) {
      console.error('Error in startGame:', error);
      return false;
    }
  }

  // Update game clock
  static async updateGameClock(gameId: string, clockData: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          game_clock_minutes: clockData.minutes,
          game_clock_seconds: clockData.seconds,
          is_clock_running: clockData.isRunning
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error updating game clock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateGameClock:', error);
      return false;
    }
  }

  // Record a stat
  static async recordStat(statData: {
    gameId: string;
    playerId: string;
    teamId: string;
    statType: string;
    statValue: number;
    modifier?: string;
    quarter: number;
    gameTimeMinutes: number;
    gameTimeSeconds: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_stats')
        .insert({
          game_id: statData.gameId,
          player_id: statData.playerId,
          team_id: statData.teamId,
          stat_type: statData.statType,
          stat_value: statData.statValue,
          modifier: statData.modifier,
          quarter: statData.quarter,
          game_time_minutes: statData.gameTimeMinutes,
          game_time_seconds: statData.gameTimeSeconds
        });

      if (error) {
        console.error('Error recording stat:', error);
        return false;
      }

      // Log the action
      await this.createAuditLog(statData.gameId, 'stat_recorded', statData);

      return true;
    } catch (error) {
      console.error('Error in recordStat:', error);
      return false;
    }
  }

  // Record substitution
  static async recordSubstitution(subData: {
    gameId: string;
    playerInId: string;
    playerOutId: string;
    teamId: string;
    quarter: number;
    gameTimeMinutes: number;
    gameTimeSeconds: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_substitutions')
        .insert({
          game_id: subData.gameId,
          player_in_id: subData.playerInId,
          player_out_id: subData.playerOutId,
          team_id: subData.teamId,
          quarter: subData.quarter,
          game_time_minutes: subData.gameTimeMinutes,
          game_time_seconds: subData.gameTimeSeconds
        });

      if (error) {
        console.error('Error recording substitution:', error);
        return false;
      }

      // Log the action
      await this.createAuditLog(subData.gameId, 'substitution', subData);

      return true;
    } catch (error) {
      console.error('Error in recordSubstitution:', error);
      return false;
    }
  }

  // Update player game stats
  static async updatePlayerGameStats(statsData: {
    gameId: string;
    playerId: string;
    teamId: string;
    minutesPlayed: number;
    points: number;
    assists: number;
    rebounds: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    personalFouls: number;
    technicalFouls: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    fieldGoals2ptMade: number;
    fieldGoals2ptAttempted: number;
    fieldGoals3ptMade: number;
    fieldGoals3ptAttempted: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('player_game_stats')
        .upsert({
          game_id: statsData.gameId,
          player_id: statsData.playerId,
          team_id: statsData.teamId,
          minutes_played: statsData.minutesPlayed,
          points: statsData.points,
          assists: statsData.assists,
          rebounds: statsData.rebounds,
          offensive_rebounds: statsData.offensiveRebounds,
          defensive_rebounds: statsData.defensiveRebounds,
          steals: statsData.steals,
          blocks: statsData.blocks,
          turnovers: statsData.turnovers,
          fouls: statsData.fouls,
          personal_fouls: statsData.personalFouls,
          technical_fouls: statsData.technicalFouls,
          free_throws_made: statsData.freeThrowsMade,
          free_throws_attempted: statsData.freeThrowsAttempted,
          field_goals_2pt_made: statsData.fieldGoals2ptMade,
          field_goals_2pt_attempted: statsData.fieldGoals2ptAttempted,
          field_goals_3pt_made: statsData.fieldGoals3ptMade,
          field_goals_3pt_attempted: statsData.fieldGoals3ptAttempted
        });

      if (error) {
        console.error('Error updating player game stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePlayerGameStats:', error);
      return false;
    }
  }

  // Create audit log entry
  static async createAuditLog(gameId: string, action: string, details: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found for audit log');
        return false;
      }

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          game_id: gameId,
          user_id: user.id,
          action,
          details
        });

      if (error) {
        console.error('Error creating audit log:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createAuditLog:', error);
      return false;
    }
  }

  // Get game stats for a player
  static async getPlayerGameStats(gameId: string, playerId: string): Promise<PlayerGameStats | null> {
    try {
      const { data, error } = await supabase
        .from('player_game_stats')
        .select('*')
        .eq('game_id', gameId)
        .eq('player_id', playerId)
        .single();

      if (error) {
        console.error('Error getting player game stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPlayerGameStats:', error);
      return null;
    }
  }
} 