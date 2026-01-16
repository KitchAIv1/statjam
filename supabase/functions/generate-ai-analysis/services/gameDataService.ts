/**
 * Game Data Service - Fetch and transform game data for AI
 * 
 * PURPOSE: Call RPC function and transform data for GPT-4
 * Follows .cursorrules: <200 lines, single responsibility
 */

export class GameDataService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async fetchGameData(gameId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc(
        'get_ai_analysis_data',
        { p_game_id: gameId }
      );

      if (error) {
        console.error('❌ RPC error:', error);
        throw new Error(`Failed to fetch game data: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from RPC function');
      }

      return this.transformForAI(data);
    } catch (err) {
      console.error('❌ GameDataService.fetchGameData error:', err);
      throw err;
    }
  }

  private transformForAI(rawData: any): any {
    // RPC function already returns structured data
    // This method exists for future transformations if needed
    return rawData;
  }

  validateGameData(data: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!data.game) errors.push('Missing game data');
    if (!data.quarters || !Array.isArray(data.quarters)) errors.push('Missing quarters array');
    if (!data.team_totals) errors.push('Missing team_totals');
    if (!data.players || !Array.isArray(data.players)) errors.push('Missing players array');

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true };
  }
}
