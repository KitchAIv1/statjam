import { supabase } from '@/lib/supabase';
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
  }): Promise<boolean> {
    try {
      console.log('🔄 GameService: Updating game state for:', gameId);
      console.log('🔄 GameService: State data:', gameStateData);

      const { error } = await supabase
        .from('games')
        .update({
          quarter: gameStateData.quarter,
          game_clock_minutes: gameStateData.game_clock_minutes,
          game_clock_seconds: gameStateData.game_clock_seconds,
          is_clock_running: gameStateData.is_clock_running,
          home_score: gameStateData.home_score,
          away_score: gameStateData.away_score,
          updated_at: new Date().toISOString()
        })
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
      console.log('🔍 GameService: Fetching assigned games for stat admin:', statAdminId);
      
      // First, try a simple query to see if there are any games at all
      console.log('🔍 GameService: Step 1 - Checking for any games with stat_admin_id:', statAdminId);
      console.log('🔍 GameService: statAdminId type:', typeof statAdminId, 'length:', statAdminId?.length);
      
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
      
      console.log('🔍 GameService: Simple query result:', { count: simpleGames?.length || 0, error: simpleError });
      
      if (simpleError) {
        console.error('❌ Simple query failed:', simpleError);
        throw new Error(`Database error in simple query: ${simpleError.message}`);
      }
      
      if (!simpleGames || simpleGames.length === 0) {
        console.log('ℹ️ GameService: No games found for stat admin:', statAdminId);
        
        // Debug: Check if there are ANY games in the table
        console.log('🔍 GameService: Debug - Checking all games in table...');
        const { data: allGames, error: allGamesError } = await supabase
          .from('games')
          .select('id, stat_admin_id, status')
          .limit(5);
        
        console.log('🔍 GameService: All games sample:', allGames);
        console.log('🔍 GameService: Looking for stat_admin_id:', statAdminId);
        
        if (allGames && allGames.length > 0) {
          console.log('🔍 GameService: Available stat_admin_ids:', 
            [...new Set(allGames.map(g => g.stat_admin_id))]);
        }
        
        return [];
      }
      
      // Step 2: Fetch related data separately to avoid complex JOINs
      console.log('🔍 GameService: Step 2 - Fetching related data separately for performance');
      
      // Get unique tournament and team IDs
      const tournamentIds = [...new Set(simpleGames.map(g => g.tournament_id).filter(Boolean))];
      const teamIds = [...new Set([
        ...simpleGames.map(g => g.team_a_id).filter(Boolean),
        ...simpleGames.map(g => g.team_b_id).filter(Boolean)
      ])];
      
      // Fetch tournaments and teams separately (much faster than JOINs)
      const [tournamentsResult, teamsResult] = await Promise.all([
        tournamentIds.length > 0 ? supabase
          .from('tournaments')
          .select('id, name, venue')
          .in('id', tournamentIds) : { data: [], error: null },
        teamIds.length > 0 ? supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds) : { data: [], error: null }
      ]);
      
      // Create lookup maps for fast access
      const tournamentMap = new Map(tournamentsResult.data?.map(t => [t.id, t]) || []);
      const teamMap = new Map(teamsResult.data?.map(t => [t.id, t]) || []);
      
      // Combine data efficiently
      const games = simpleGames.map(game => {
        const tournament = tournamentMap.get(game.tournament_id);
        const teamA = teamMap.get(game.team_a_id);
        const teamB = teamMap.get(game.team_b_id);
        
        return {
          ...game,
          tournaments: tournament ? { name: tournament.name, venue: tournament.venue } : null,
          team_a: teamA ? { name: teamA.name } : null,
          team_b: teamB ? { name: teamB.name } : null
        };
      });
      
      const error = tournamentsResult.error || teamsResult.error;

      if (error) {
        console.error('❌ Supabase error getting assigned games with JOINs:', error);
        console.error('❌ Error details:', error.message, error.details, error.hint);
        
        // Fallback: Return simple games data if JOINs fail
        console.log('🔄 GameService: JOINs failed, falling back to simple data');
        const fallbackGames = simpleGames.map(game => ({
          id: game.id,
          tournamentName: 'Loading...',
          teamA: 'Team A',
          teamB: 'Team B',
          scheduledDate: game.start_time,
          venue: 'TBD',
          status: game.status,
          tournamentId: game.tournament_id
        }));
        
        console.log('✅ GameService: Returning fallback games:', fallbackGames.length);
        return fallbackGames;
      }

      console.log('✅ GameService: Found assigned games:', games?.length || 0);
      console.log('🔍 GameService: Raw games data:', games);

      // Transform data to match expected format
      const transformedGames = (games || []).map(game => {
        console.log('🔄 Transforming game:', game.id, game);
        return {
          id: game.id,
          tournamentName: game.tournaments?.name || 'Unknown Tournament',
          teamA: game.team_a?.name || 'Team A',
          teamB: game.team_b?.name || 'Team B',
          scheduledDate: game.start_time,
          venue: game.tournaments?.venue || 'TBD',
          status: game.status,
          tournamentId: game.tournament_id
        };
      });

      console.log('✅ GameService: Transformed assigned games:', transformedGames.length, 'games');
      console.log('🔍 GameService: Final transformed data:', transformedGames);
      return transformedGames;
    } catch (error) {
      console.error('❌ Error getting assigned games:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
  }): Promise<boolean> {
    try {
      console.log('🔍 GameService: Recording stat with data:', JSON.stringify(statData, null, 2));
      
      // DEBUG: Check authentication before making the request
      console.log('🔍 DEBUG: Checking authentication before INSERT...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return false;
      }
      
      if (!session) {
        console.error('❌ No active session found');
        return false;
      }
      
      if (!session.user) {
        console.error('❌ No user in session');
        return false;
      }
      
      console.log('✅ Session validation passed:');
      console.log('  - User ID:', session.user.id);
      console.log('  - User email:', session.user.email);
      console.log('  - Session expires at:', session.expires_at);
      console.log('  - Access token length:', session.access_token.length);
      console.log('  - Access token (first 50 chars):', session.access_token.substring(0, 50) + '...');
      
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
      
      console.log('📊 GameService: Insert data:', JSON.stringify(insertData, null, 2));
      
      // Validate data before insert
      if (!insertData.game_id || !insertData.player_id || !insertData.team_id) {
        console.error('❌ Missing required IDs:', insertData);
        return false;
      }
      
      console.log('🔍 DEBUG: About to make Supabase INSERT request...');
      console.log('🔍 DEBUG: Request will go to: /rest/v1/game_stats');
      
      // Try a test query first to see if authentication context works
      console.log('🔍 DEBUG: Testing authentication with simple SELECT...');
      try {
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', session.user.id)
          .single();
          
        if (testError) {
          console.error('❌ Test SELECT failed:', testError);
        } else {
          console.log('✅ Test SELECT succeeded:', testData);
        }
      } catch (testErr) {
        console.error('❌ Test SELECT exception:', testErr);
      }
      
      const { data, error } = await supabase
        .from('game_stats')
        .insert(insertData);

      if (error) {
        console.error('❌ Supabase error recording stat:');
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ Stat recorded successfully:', data);

      // Note: Audit logging temporarily disabled due to 404 endpoint issue
      // TODO: Re-enable once backend provides audit_logs API endpoint
      
      return true;
    } catch (error) {
      console.error('❌ Unexpected error in recordStat:');
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Full error:', error);
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
      const { data: { user } } = await supabase.auth.getUser();
      
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