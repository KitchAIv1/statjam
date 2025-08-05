import { supabase } from '@/lib/supabase';
import { Game, GameStat, PlayerGameStats, GameSubstitution, AuditLog } from '@/lib/types/game';

export class GameService {
  // ===== GAME SCHEDULING METHODS =====
  
  // Create a new game
  static async createGame(gameData: {
    tournamentId: string;
    teamAId: string;
    teamBId: string;
    startTime: string;
    venue?: string;
    statAdminId?: string;
  }): Promise<Game | null> {
    try {
      console.log('🔍 GameService: Creating game:', gameData);
      
      const { data: game, error } = await supabase
        .from('games')
        .insert({
          tournament_id: gameData.tournamentId,
          team_a_id: gameData.teamAId,
          team_b_id: gameData.teamBId,
          stat_admin_id: gameData.statAdminId || null,
          status: 'scheduled',
          start_time: gameData.startTime,
          quarter: 1,
          game_clock_minutes: 12,
          game_clock_seconds: 0,
          is_clock_running: false,
          home_score: 0,
          away_score: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error creating game:', error);
        throw new Error(`Failed to create game: ${error.message}`);
      }

      console.log('✅ Game created successfully:', game.id);
      return game;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  // Get games by tournament
  static async getGamesByTournament(tournamentId: string): Promise<Game[]> {
    try {
      console.log('🔍 GameService: Fetching games for tournament:', tournamentId);
      
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Supabase error getting games:', error);
        throw new Error(`Failed to get games: ${error.message}`);
      }

      console.log('🔍 GameService: Found games:', games?.length || 0);
      return games || [];
    } catch (error) {
      console.error('Error getting games by tournament:', error);
      throw error;
    }
  }

  // Update a game
  static async updateGame(gameId: string, updateData: {
    teamAId?: string;
    teamBId?: string;
    startTime?: string;
    venue?: string;
    statAdminId?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  }): Promise<Game | null> {
    try {
      console.log('🔍 GameService: Updating game:', gameId, updateData);
      
      const dbUpdateData: any = {};
      if (updateData.teamAId !== undefined) dbUpdateData.team_a_id = updateData.teamAId;
      if (updateData.teamBId !== undefined) dbUpdateData.team_b_id = updateData.teamBId;
      if (updateData.startTime !== undefined) dbUpdateData.start_time = updateData.startTime;
      if (updateData.statAdminId !== undefined) dbUpdateData.stat_admin_id = updateData.statAdminId;
      if (updateData.status !== undefined) dbUpdateData.status = updateData.status;

      const { data: game, error } = await supabase
        .from('games')
        .update(dbUpdateData)
        .eq('id', gameId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error updating game:', error);
        throw new Error(`Failed to update game: ${error.message}`);
      }

      console.log('✅ Game updated successfully:', gameId);
      return game;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  }

  // Delete a game
  static async deleteGame(gameId: string): Promise<boolean> {
    try {
      console.log('🔍 GameService: Deleting game:', gameId);
      
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) {
        console.error('❌ Supabase error deleting game:', error);
        throw new Error(`Failed to delete game: ${error.message}`);
      }

      console.log('✅ Game deleted successfully:', gameId);
      return true;
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }

  // Get game by ID
  static async getGame(gameId: string): Promise<Game | null> {
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error getting game:', error);
        return null;
      }

      return game;
    } catch (error) {
      console.error('Error in getGame:', error);
      return null;
    }
  }

  // Get all games assigned to a stat admin
  static async getAssignedGames(statAdminId: string): Promise<any[]> {
    try {
      console.log('🔍 GameService: Fetching assigned games for stat admin:', statAdminId);
      
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          *,
          tournaments!inner(name, venue),
          teams!team_a_id(name),
          teamB:teams!team_b_id(name)
        `)
        .eq('stat_admin_id', statAdminId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ Supabase error getting assigned games:', error);
        return [];
      }

      console.log('🔍 GameService: Found assigned games:', games?.length || 0);

      // Transform data to match expected format
      const transformedGames = (games || []).map(game => ({
        id: game.id,
        tournamentName: game.tournaments?.name || 'Unknown Tournament',
        teamA: game.teams?.name || 'Team A',
        teamB: game.teamB?.name || 'Team B',
        scheduledDate: game.start_time,
        venue: game.tournaments?.venue || 'TBD',
        status: game.status,
        tournamentId: game.tournament_id
      }));

      console.log('🔍 GameService: Transformed assigned games:', transformedGames);
      return transformedGames;
    } catch (error) {
      console.error('Error getting assigned games:', error);
      return [];
    }
  }

  // ===== LIVE GAME MANAGEMENT METHODS =====

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