/**
 * Analysis Cache Service - Manage cached AI analysis
 * 
 * PURPOSE: Check cache and save generated analysis
 * Follows .cursorrules: <200 lines, single responsibility
 * 
 * FIX (Jan 2026): Removed 24-hour TTL - analysis is permanent for completed games
 * FIX (Jan 2026): Changed INSERT to UPSERT to handle re-generation properly
 */

export class AnalysisCacheService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getCachedAnalysis(gameId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis')
        .select('analysis_data, generated_at')
        .eq('game_id', gameId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Cache lookup error:', error);
        return null;
      }

      if (!data) return null;

      // ✅ FIX: No TTL check - analysis is permanent for completed games
      // Users can manually regenerate via "Retry" button if needed
      console.log('✅ Using cached analysis');
      return data.analysis_data;
    } catch (err) {
      console.error('❌ AnalysisCacheService.getCachedAnalysis error:', err);
      return null;
    }
  }

  async saveAnalysis(
    gameId: string,
    analysisData: any,
    generatedBy: string
  ): Promise<void> {
    try {
      // ✅ FIX: Use UPSERT instead of INSERT to handle re-generation
      // This updates the existing row if game_id already exists
      const { error } = await this.supabase
        .from('ai_analysis')
        .upsert(
          {
            game_id: gameId,
            analysis_data: analysisData,
            generated_by: generatedBy,
            generated_at: new Date().toISOString(),
            version: 1,
          },
          { onConflict: 'game_id' }
        );

      if (error) {
        console.error('❌ Failed to save analysis:', error);
        throw new Error(`Failed to save analysis: ${error.message}`);
      }

      console.log('✅ Analysis saved to cache');
    } catch (err) {
      console.error('❌ AnalysisCacheService.saveAnalysis error:', err);
      throw err;
    }
  }

  isCacheValid(analysisData: any): boolean {
    if (!analysisData || typeof analysisData !== 'object') return false;
    
    const required = ['gameOverview', 'winningFactors', 'keyPlayers', 'quarters', 'actionItems', 'bottomLine'];
    return required.every(key => analysisData[key] !== undefined);
  }
}
