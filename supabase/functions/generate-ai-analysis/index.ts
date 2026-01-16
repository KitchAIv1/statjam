/**
 * Generate AI Analysis Edge Function
 * 
 * PURPOSE: Generate AI-powered game analysis using GPT-4
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { GameDataService } from './services/gameDataService.ts';
import { AIGeneratorService } from './services/aiGeneratorService.ts';
import { AnalysisCacheService } from './services/analysisCacheService.ts';

interface GenerateAnalysisRequest {
  game_id: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const request: GenerateAnalysisRequest = await req.json();

    if (!request.game_id) {
      return new Response(
        JSON.stringify({ error: 'Missing game_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize services
    const cacheService = new AnalysisCacheService(supabase);
    const gameDataService = new GameDataService(supabase);
    const aiGeneratorService = new AIGeneratorService();

    // Check cache first
    const cached = await cacheService.getCachedAnalysis(request.game_id);
    if (cached) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: cached,
          cached: true,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Fetch game data
    console.log(`📊 Fetching game data for: ${request.game_id}`);
    const gameData = await gameDataService.fetchGameData(request.game_id);

    // Validate data
    const validation = gameDataService.validateGameData(gameData);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: `Invalid game data: ${validation.errors?.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate analysis
    console.log('🤖 Generating AI analysis...');
    const analysis = await aiGeneratorService.generateAnalysis(gameData);

    // Save to cache
    try {
      await cacheService.saveAnalysis(request.game_id, analysis, user.id);
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache analysis (continuing):', cacheError);
    }

    // Return result
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        cached: false,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Generate AI analysis error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Analysis generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
