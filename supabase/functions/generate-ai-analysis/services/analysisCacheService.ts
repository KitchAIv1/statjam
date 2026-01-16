/**
 * Analysis Cache Service - Manage cached AI analysis
 * 
 * PURPOSE: Check cache and save generated analysis
 * Follows .cursorrules: <200 lines, single responsibility
 */

export class AnalysisCacheService {
  private supabase: any;
  private readonly CACHE_TTL_HOURS = 24;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getCachedAnalysis(gameId: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis')
        .select('analysis_data, generated_at')
        .eq('game_id', gameId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Cache lookup error:', error);
        return null;
      }

      if (!data) return null;

      // Check if cache is still valid (within TTL)
      const generatedAt = new Date(data.generated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > this.CACHE_TTL_HOURS) {
        console.log(`⏰ Cache expired (${hoursDiff.toFixed(1)} hours old)`);
        return null;
      }

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
      const { error } = await this.supabase
        .from('ai_analysis')
        .insert({
          game_id: gameId,
          analysis_data: analysisData,
          generated_by: generatedBy,
          version: 1,
        });

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
