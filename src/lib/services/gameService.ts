import { supabase } from '@/lib/supabase';
import { authServiceV2 } from '@/lib/services/authServiceV2';
import { Game, GameStat, PlayerGameStats, GameSubstitution, AuditLog } from '@/lib/types/game';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';

// Temporary feature flag to silence audit log writes until backend endpoint is ready
const ENABLE_AUDIT_LOGS = false;

export class GameService {
  // ===== GAME SCHEDULING METHODS =====
  
  // Update game state (clock, scores, quarter)
  static async updateGameState(gameId: string, gameStateData: {
    quarter: number;
    game_clock_minutes: number;
    game_clock_seconds: number;
    is_clock_running: boolean;
    home_score: number;
    away_score: number;
    team_a_fouls?: number;
    team_b_fouls?: number;
    team_a_timeouts_remaining?: number;
    team_b_timeouts_remaining?: number;
  }): Promise<boolean> {
    try {
      console.log('🔄 GameService: Updating game state for:', gameId);
      console.log('🔄 GameService: State data:', gameStateData);

      const updateData: any = {
        quarter: gameStateData.quarter,
        game_clock_minutes: gameStateData.game_clock_minutes,
        game_clock_seconds: gameStateData.game_clock_seconds,
        is_clock_running: gameStateData.is_clock_running,
        home_score: gameStateData.home_score,
        away_score: gameStateData.away_score,
        updated_at: new Date().toISOString()
      };

      // Add optional fouls/timeouts if provided
      if (gameStateData.team_a_fouls !== undefined) updateData.team_a_fouls = gameStateData.team_a_fouls;
      if (gameStateData.team_b_fouls !== undefined) updateData.team_b_fouls = gameStateData.team_b_fouls;
      if (gameStateData.team_a_timeouts_remaining !== undefined) updateData.team_a_timeouts_remaining = gameStateData.team_a_timeouts_remaining;
      if (gameStateData.team_b_timeouts_remaining !== undefined) updateData.team_b_timeouts_remaining = gameStateData.team_b_timeouts_remaining;

      const { error } = await supabase
        .from('games')
        .update(updateData)
        .eq('id', gameId);

      if (error) {
        console.error('❌ Supabase error updating game state:', error);
        return false;
      }

      console.log('✅ Game state updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating game state:', error);
      return false;
    }
  }

  // Update game status (for completion, overtime, etc.)
  static async updateGameStatus(gameId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overtime'): Promise<boolean> {
    try {
      console.log('🎯 GameService: Updating game status:', { gameId, status });

      const { error } = await supabase
        .from('games')
        .update({
          status: status,
          ...(status === 'completed' ? { end_time: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (error) {
        console.error('❌ Supabase error updating game status:', error);
        return false;
      }

      console.log('✅ Game status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating game status:', error);
      return false;
    }
  }
  
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
      
      // Build insert data - only include venue if provided (column may not exist yet)
      const insertData: any = {
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
      };
      
      // Only include venue if provided and not empty (column may not exist yet - requires migration)
      if (gameData.venue && gameData.venue.trim()) {
        insertData.venue = gameData.venue.trim();
      }

      const { data: game, error } = await supabase
        .from('games')
        .insert([insertData])
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
      // Only include venue if provided and not empty (column may not exist yet - requires migration)
      if (updateData.venue !== undefined && updateData.venue && updateData.venue.trim()) {
        dbUpdateData.venue = updateData.venue.trim();
      }
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
      
      // Step 1: Delete related records first (to avoid foreign key constraint violations)
      // Delete game_stats
      const { error: statsError } = await supabase
        .from('game_stats')
        .delete()
        .eq('game_id', gameId);

      if (statsError && statsError.code !== '42P01') {
        console.error('Error deleting game_stats:', statsError);
        throw new Error(`Failed to delete game_stats: ${statsError.message}`);
      }
      console.log('🗑️ Deleted game_stats for game:', gameId);

      // Delete game_substitutions
      const { error: substitutionsError } = await supabase
        .from('game_substitutions')
        .delete()
        .eq('game_id', gameId);

      if (substitutionsError && substitutionsError.code !== '42P01') {
        console.error('Error deleting game_substitutions:', substitutionsError);
        throw new Error(`Failed to delete game_substitutions: ${substitutionsError.message}`);
      }
      console.log('🗑️ Deleted game_substitutions for game:', gameId);

      // Delete game_timeouts
      const { error: timeoutsError } = await supabase
        .from('game_timeouts')
        .delete()
        .eq('game_id', gameId);

      if (timeoutsError && timeoutsError.code !== '42P01') {
        console.error('Error deleting game_timeouts:', timeoutsError);
        throw new Error(`Failed to delete game_timeouts: ${timeoutsError.message}`);
      }
      console.log('🗑️ Deleted game_timeouts for game:', gameId);

      // Delete legacy stats table (if exists) - uses match_id column
      const { error: legacyStatsError } = await supabase
        .from('stats')
        .delete()
        .eq('match_id', gameId);

      if (legacyStatsError && legacyStatsError.code !== '42P01') {
        console.error('Error deleting legacy stats:', legacyStatsError);
        // Don't throw - legacy table might not exist
        console.warn('⚠️ Legacy stats deletion failed (table may not exist)');
      } else {
        console.log('🗑️ Deleted legacy stats for game:', gameId);
      }

      // Step 2: Now delete the game itself (all references are gone)
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
      // Check cache first for basic game data
      const cacheKey = CacheKeys.gameBasic(gameId);
      const cachedGame = cache.get<Game>(cacheKey);
      if (cachedGame) {
        console.log('✅ GameService: Returning cached game data for:', gameId);
        return cachedGame;
      }

      const { data: game, error } = await supabase
        .from('games')
        .select(`
          *,
          team_a:teams!team_a_id(name),
          team_b:teams!team_b_id(name)
        `)
        .eq('id', gameId)
        .single();

      if (error) {
        console.error('Error getting game:', error);
        return null;
      }

      console.log('🏀 GameService: Fetched game with team names:', {
        gameId,
        teamA: game?.team_a?.name,
        teamB: game?.team_b?.name
      });

      // Cache the game data for short-term reuse
      cache.set(cacheKey, game, CacheTTL.GAME_BASIC);
      console.log('💾 GameService: Cached game data for:', gameId);

      return game;
    } catch (error) {
      console.error('Error in getGame:', error);
      return null;
    }
  }

  // Get all games assigned to a stat admin
  static async getAssignedGames(statAdminId: string): Promise<any[]> {
    try {
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );
      
      const queryPromise = supabase
        .from('games')
        .select('*')
        .eq('stat_admin_id', statAdminId);
      
      const { data: simpleGames, error: simpleError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      if (simpleError) {
        throw new Error(`Database error in simple query: ${simpleError.message}`);
      }
      
      if (!simpleGames || simpleGames.length === 0) {
        return [];
      }
      
      // Get unique tournament and team IDs
      const tournamentIds = [...new Set(simpleGames.map((g: any) => g.tournament_id).filter(Boolean))];
      const teamIds = [...new Set([
        ...simpleGames.map((g: any) => g.team_a_id).filter(Boolean),
        ...simpleGames.map((g: any) => g.team_b_id).filter(Boolean)
      ])];
      
      // Fetch tournaments, teams, and organizers separately (much faster than JOINs)
      const [tournamentsResult, teamsResult] = await Promise.all([
        tournamentIds.length > 0 ? supabase
          .from('tournaments')
          .select('id, name, venue, organizer_id')
          .in('id', tournamentIds) : { data: [], error: null },
        teamIds.length > 0 ? supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds) : { data: [], error: null }
      ]);
      
      // Get unique organizer IDs and fetch organizer info
      const organizerIds = [...new Set(tournamentsResult.data?.map(t => t.organizer_id).filter(Boolean) || [])];
      const organizersResult = organizerIds.length > 0 ? await supabase
        .from('users')
        .select('id, email')
        .in('id', organizerIds) : { data: [], error: null };
      
      // Create lookup maps for fast access
      const tournamentMap = new Map(tournamentsResult.data?.map(t => [t.id, t]) || []);
      const teamMap = new Map(teamsResult.data?.map(t => [t.id, t]) || []);
      const organizerMap = new Map(organizersResult.data?.map(o => [o.id, o]) || []);
      
      // Combine data efficiently
      const games = simpleGames.map((game: any) => {
        const tournament = tournamentMap.get(game.tournament_id);
        const teamA = teamMap.get(game.team_a_id);
        const teamB = teamMap.get(game.team_b_id);
        const organizer = tournament ? organizerMap.get(tournament.organizer_id) : null;
        
        return {
          ...game,
          tournaments: tournament ? { 
            name: tournament.name, 
            venue: tournament.venue,
            organizer_id: tournament.organizer_id
          } : null,
          team_a: teamA ? { name: teamA.name } : null,
          team_b: teamB ? { name: teamB.name } : null,
          organizer: organizer ? {
            id: organizer.id,
            name: organizer.email,
            email: organizer.email
          } : null
        };
      });
      
      const error = tournamentsResult.error || teamsResult.error || organizersResult.error;

      if (error) {
        // Fallback: Return simple games data in expected grouped structure
        const fallbackGames = simpleGames.map((game: any) => ({
          id: game.id,
          tournamentName: 'Loading...',
          teamA: 'Team A',
          teamB: 'Team B',
          scheduledDate: game.start_time,
          venue: 'TBD',
          status: game.status,
          tournamentId: game.tournament_id,
          createdAt: game.created_at,
          organizer: null
        }));
        
        // Return in grouped structure even for fallback
        const fallbackGrouped = [{
          organizerId: 'unknown',
          organizerName: 'Loading Organizer Info...',
          organizerEmail: '',
          games: fallbackGames
        }];
        
        return fallbackGrouped;
      }

      // Transform and organize data
      const transformedGames = (games || []).map((game: any) => {
        return {
          id: game.id,
          tournamentName: game.tournaments?.name || 'Unknown Tournament',
          teamA: game.team_a?.name || 'Team A',
          teamB: game.team_b?.name || 'Team B',
          scheduledDate: game.start_time,
          venue: game.tournaments?.venue || 'TBD',
          status: game.status,
          tournamentId: game.tournament_id,
          createdAt: game.created_at,
          organizer: game.organizer ? {
            id: game.organizer.id,
            name: game.organizer.name,
            email: game.organizer.email
          } : null
        };
      });

      // Sort by creation date (newest first)
      const sortedGames = transformedGames.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.scheduledDate);
        const dateB = new Date(b.createdAt || b.scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });

      // Group by organizer
      const groupedByOrganizer = sortedGames.reduce((groups: any, game: any) => {
        const organizerKey = game.organizer?.id || 'unknown';
        const organizerName = game.organizer?.name || 'Unknown Organizer';
        
        if (!groups[organizerKey]) {
          groups[organizerKey] = {
            organizerId: organizerKey,
            organizerName: organizerName,
            organizerEmail: game.organizer?.email || '',
            games: []
          };
        }
        
        groups[organizerKey].games.push(game);
        return groups;
      }, {} as Record<string, { organizerId: string; organizerName: string; organizerEmail: string; games: any[] }>);

      // Convert to array and sort organizer groups by most recent game
      const organizedGames = Object.values(groupedByOrganizer).sort((a: any, b: any) => {
        const latestA = new Date(a.games[0]?.createdAt || a.games[0]?.scheduledDate || 0);
        const latestB = new Date(b.games[0]?.createdAt || b.games[0]?.scheduledDate || 0);
        return latestB.getTime() - latestA.getTime();
      });

      return organizedGames;
    } catch (error) {
      console.error('❌ Error getting assigned games:', error);
      throw error; // Re-throw to let the component handle it
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
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 GameService: Recording stat for player:', statData.playerId);
      
      // ✅ SKIP SESSION CHECK: supabase.from().insert() will use auth token from custom storage
      // The hanging getSession() call is bypassed - auth token is automatically attached
      console.log('🔐 GameService: Using auth token from custom storage for stat recording');
      
      // Validate data before insert
      if (!statData.gameId || !statData.playerId || !statData.teamId) {
        console.error('❌ Missing required IDs:', statData);
        return { 
          success: false, 
          error: 'Invalid stat data: missing required fields'
        };
      }
      
      // Prepare insert data
      const insertData = {
        game_id: statData.gameId,
        player_id: statData.playerId,
        team_id: statData.teamId,
        stat_type: statData.statType,
        stat_value: statData.statValue,
        modifier: statData.modifier,
        quarter: statData.quarter,
        game_time_minutes: statData.gameTimeMinutes,
        game_time_seconds: statData.gameTimeSeconds
      };
      
      console.log('📊 GameService: Inserting stat:', statData.statType);
      
      // Insert stat record
      const { data, error } = await supabase
        .from('game_stats')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error recording stat:', error);
        
        // Provide specific error messages based on error code
        let userMessage = 'Failed to record stat';
        
        if (error.code === '23503') {
          // Foreign key violation
          userMessage = 'Invalid game, player, or team ID';
        } else if (error.code === '42501') {
          // Permission denied
          userMessage = 'You do not have permission to record stats for this game';
        } else if (error.message.includes('duplicate')) {
          userMessage = 'This stat has already been recorded';
        } else if (error.message.includes('timeout')) {
          userMessage = 'Database timeout - please try again';
        }
        
        return { 
          success: false, 
          error: `${userMessage}: ${error.message}`
        };
      }

      console.log('✅ Stat recorded successfully:', data);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Unexpected error in recordStat:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
          // V2: standardize on game_id only
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

      // Log the action (non-blocking, avoid noisy errors)
      try {
        void this.createAuditLog(subData.gameId, 'substitution', subData);
      } catch (_e) {}
      

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
      if (!ENABLE_AUDIT_LOGS) {
        // Silently skip until audit_logs endpoint/policies are ready
        return false;
      }
      const user = await authServiceV2.getUserProfile();
      
      if (!user) {
        // Skip without noisy logging
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
        // Avoid noisy errors in console; return false quietly
        return false;
      }

      return true;
    } catch (error) {
      // Avoid noisy errors in console; return false quietly
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