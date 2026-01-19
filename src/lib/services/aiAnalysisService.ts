/**
 * AI Analysis Service - Frontend service for AI analysis
 * 
 * PURPOSE: Call Edge Function to generate/fetch AI analysis
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { supabase, ensureSupabaseSession } from '@/lib/supabase';

// ============================================================================
// IN-MEMORY CACHE - Instant tab switching without re-fetching
// ============================================================================
interface CachedAnalysis {
  data: AIAnalysisData;
  timestamp: number;
}

const memoryCache = new Map<string, CachedAnalysis>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedAnalysis(gameId: string): AIAnalysisData | null {
  const cached = memoryCache.get(gameId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  // Expired - remove from cache
  if (cached) memoryCache.delete(gameId);
  return null;
}

function setCachedAnalysis(gameId: string, data: AIAnalysisData): void {
  memoryCache.set(gameId, { data, timestamp: Date.now() });
}

function clearMemoryCache(gameId: string): void {
  memoryCache.delete(gameId);
}
// ============================================================================

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
   * Uses in-memory cache for instant tab switching
   */
  static async getAnalysis(gameId: string): Promise<AIAnalysisData | null> {
    // Check memory cache first - instant return if cached
    const cached = getCachedAnalysis(gameId);
    if (cached) {
      console.log('⚡ AI Analysis Service: Returning cached analysis for:', gameId);
      return cached;
    }

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

      const analysis = data.analysis as AIAnalysisData;
      
      // Store in memory cache for instant tab switching
      setCachedAnalysis(gameId, analysis);
      
      return analysis;
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
   * Clears both database cache and in-memory cache
   */
  static async clearCache(gameId: string): Promise<boolean> {
    // Clear memory cache first
    clearMemoryCache(gameId);
    
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
