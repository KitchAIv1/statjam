/**
 * AI Analysis Service - Frontend service for AI analysis
 * 
 * PURPOSE: Call Edge Function to generate/fetch AI analysis
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { supabase, ensureSupabaseSession } from '@/lib/supabase';

export interface AIAnalysisData {
  gameOverview: {
    narrative: string;
    keyInsight: string;
    marginCategory: string;
  };
  winningFactors: Array<{
    title: string;
    value: string;
    onCourt: string[];
    takeaways: string[];
  }>;
  keyPlayers: Array<{
    name: string;
    jersey: number;
    stats: string;
    impact: number;
    badge: string | null;
    strengths: string[];
    risks: string[];
    focus: string[];
  }>;
  quarterAnalysis: {
    pattern: string;
    bestQuarter: { q: string; margin: string; reason: string };
    worstQuarter: { q: string; margin: string; reason: string };
    quarters: Array<{
      q: string;
      team: number;
      opp: number;
      diff: string;
      status: string;
    }>;
  };
  actionItems: Array<{
    priority: 'critical' | 'important' | 'monitor';
    action: string;
    owner: string;
  }>;
  bottomLine: {
    summary: string;
    goodNews: string;
    badNews: string;
    grade: string;
  };
}

export class AIAnalysisService {
  /**
   * Generate or fetch AI analysis for a game
   */
  static async getAnalysis(gameId: string): Promise<AIAnalysisData | null> {
    try {
      await ensureSupabaseSession();

      const { data: { user }, error: authError } = await supabase!.auth.getUser();
      if (authError || !user) {
        console.error('❌ AI Analysis Service: Authentication error:', authError);
        throw new Error('User not authenticated');
      }

      console.log('📤 AI Analysis Service: Calling Edge Function for game:', gameId);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      // Get auth token for function call
      const { data: { session } } = await supabase!.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        console.error('❌ No auth token available for Edge Function call');
        throw new Error('Authentication required');
      }

      // Call Edge Function directly via fetch
      const functionUrl = `${supabaseUrl}/functions/v1/generate-ai-analysis`;
      console.log('📤 Calling Edge Function at:', functionUrl);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Edge Function error response:', response.status, errorText);
        throw new Error(`Edge Function failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      console.log('✅ AI Analysis Service: Edge Function response received');

      if (!data || !data.success || !data.analysis) {
        const errorMsg = data?.error || 'Analysis generation failed';
        console.error('❌ AI Analysis Service: Invalid response:', errorMsg);
        throw new Error(errorMsg);
      }

      return data.analysis as AIAnalysisData;
    } catch (err) {
      console.error('❌ AIAnalysisService.getAnalysis error:', err);
      return null;
    }
  }

  /**
   * Check if analysis exists (without generating)
   */
  static async hasAnalysis(gameId: string): Promise<boolean> {
    try {
      await ensureSupabaseSession();

      const { data, error } = await supabase!
        .from('ai_analysis')
        .select('id')
        .eq('game_id', gameId)
        .limit(1)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear cached analysis to force regeneration
   */
  static async clearCache(gameId: string): Promise<boolean> {
    try {
      await ensureSupabaseSession();

      const { error } = await supabase!
        .from('ai_analysis')
        .delete()
        .eq('game_id', gameId);

      return !error;
    } catch {
      return false;
    }
  }
}
