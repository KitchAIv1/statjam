// ============================================================================
// SEASON SERVICE - CRUD operations (<200 lines)
// Purpose: Database operations for seasons
// Follows .cursorrules: Single responsibility, <200 lines, business logic only
// ============================================================================

import { supabase } from '@/lib/supabase';
import { Season, SeasonCreateRequest, SeasonUpdateRequest, SeasonGame } from '@/lib/types/season';

export const SeasonService = {
  // ========================================
  // CREATE
  // ========================================
  
  async createSeason(data: SeasonCreateRequest, coachId: string): Promise<Season> {
    
    const { data: season, error } = await supabase
      .from('seasons')
      .insert({
        coach_id: coachId,
        team_id: data.team_id,
        name: data.name,
        description: data.description,
        logo: data.logo,
        league_name: data.league_name,
        season_type: data.season_type,
        season_year: data.season_year,
        conference: data.conference,
        home_venue: data.home_venue,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        start_date: data.start_date,
        end_date: data.end_date,
        is_public: data.is_public,
        status: 'active',
      })
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create season: ${error.message}`);
    
    // Link games if provided
    if (data.game_ids?.length > 0) {
      await this.linkGamesToSeason(season.id, data.game_ids);
      await this.recalculateSeasonStats(season.id);
    }
    
    return season;
  },

  // ========================================
  // READ
  // ========================================
  
  async getSeasonById(seasonId: string): Promise<Season | null> {
    
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single();
    
    if (error) return null;
    return data;
  },

  async getSeasonsByCoach(coachId: string): Promise<Season[]> {
    
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch seasons: ${error.message}`);
    return data || [];
  },

  async getSeasonsByTeam(teamId: string): Promise<Season[]> {
    
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Failed to fetch seasons: ${error.message}`);
    return data || [];
  },

  async getSeasonGames(seasonId: string): Promise<SeasonGame[]> {
    
    const { data, error } = await supabase
      .from('season_games')
      .select('*')
      .eq('season_id', seasonId)
      .order('added_at', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch season games: ${error.message}`);
    return data || [];
  },

  // ========================================
  // UPDATE
  // ========================================
  
  async updateSeason(seasonId: string, data: Partial<SeasonUpdateRequest>): Promise<Season> {
    // Exclude game_ids - handled separately by syncSeasonGames
    const { game_ids, ...seasonData } = data as any;
    
    const { data: season, error } = await supabase
      .from('seasons')
      .update({
        ...seasonData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seasonId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update season: ${error.message}`);
    return season;
  },

  async linkGamesToSeason(seasonId: string, gameIds: string[]): Promise<void> {
    
    const records = gameIds.map(gameId => ({
      season_id: seasonId,
      game_id: gameId,
      is_home_game: true,
    }));
    
    const { error } = await supabase
      .from('season_games')
      .upsert(records, { onConflict: 'season_id,game_id' });
    
    if (error) throw new Error(`Failed to link games: ${error.message}`);
  },

  async unlinkGameFromSeason(seasonId: string, gameId: string): Promise<void> {
    const { error } = await supabase
      .from('season_games').delete().eq('season_id', seasonId).eq('game_id', gameId);
    if (error) throw new Error(`Failed to unlink game: ${error.message}`);
  },

  async syncSeasonGames(seasonId: string, newGameIds: string[]): Promise<void> {
    // Get current games
    const current = await this.getSeasonGames(seasonId);
    const currentIds = new Set(current.map(g => g.game_id));
    const newIds = new Set(newGameIds);
    
    // Remove games no longer in selection
    const toRemove = current.filter(g => !newIds.has(g.game_id));
    for (const g of toRemove) {
      await this.unlinkGameFromSeason(seasonId, g.game_id);
    }
    
    // Add new games
    const toAdd = newGameIds.filter(id => !currentIds.has(id));
    if (toAdd.length > 0) {
      await this.linkGamesToSeason(seasonId, toAdd);
    }
    
    // Recalculate stats
    await this.recalculateSeasonStats(seasonId);
  },

  // ========================================
  // DELETE
  // ========================================
  
  async deleteSeason(seasonId: string): Promise<void> {
    
    // season_games will cascade delete
    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', seasonId);
    
    if (error) throw new Error(`Failed to delete season: ${error.message}`);
  },

  // ========================================
  // STATS RECALCULATION
  // ========================================
  
  async recalculateSeasonStats(seasonId: string): Promise<void> {
    
    // Get all games linked to this season with scores
    const { data: seasonGames, error: gamesError } = await supabase
      .from('season_games')
      .select(`
        game_id,
        is_home_game,
        games:game_id (
          home_score,
          away_score,
          status
        )
      `)
      .eq('season_id', seasonId);
    
    if (gamesError) throw new Error(`Failed to fetch games: ${gamesError.message}`);
    
    let wins = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;
    
    for (const sg of seasonGames || []) {
      const game = sg.games as any;
      if (!game || game.status !== 'completed') continue;
      
      const teamScore = game.home_score;
      const oppScore = game.away_score;
      
      pointsFor += teamScore;
      pointsAgainst += oppScore;
      
      if (teamScore > oppScore) wins++;
      else if (teamScore < oppScore) losses++;
    }
    
    await supabase
      .from('seasons')
      .update({
        total_games: wins + losses,
        wins,
        losses,
        points_for: pointsFor,
        points_against: pointsAgainst,
        updated_at: new Date().toISOString(),
      })
      .eq('id', seasonId);
  },
};

