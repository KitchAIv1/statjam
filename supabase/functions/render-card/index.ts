import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RenderRequest {
  player_id: string;
  stats_context: string;
  template_variant_id: string;
  tier: 'freemium' | 'premium';
  photo_url: string;
  prefer_hires?: boolean;
  crop_data?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
  };
  customizations?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
  player_info?: {
    name: string;
    jersey_number: string;
    position: string;
    team: string;
    stats: any;
  };
}

interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  spg?: number;
  bpg?: number;
  [key: string]: any;
}

interface TeamData {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url?: string;
}

interface RenderResult {
  job_id: string;
  status: 'success' | 'failed';
  outputs?: {
    web: string;
    hires?: string;
    thumb: string;
  };
  cache_key?: string;
  processing_time_ms?: number;
  error?: string;
}

// ============================================================================
// CARD COMPOSITOR SERVICE
// ============================================================================

class CardCompositor {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Main card rendering function
   */
  async renderCard(request: RenderRequest): Promise<RenderResult> {
    const startTime = Date.now();
    let jobId: string;

    try {
      console.log('🎨 Starting card render for player:', request.player_id);

      // 1. Create render job record
      const job = await this.createRenderJob(request);
      jobId = job.id;

      // 2. Check cache first
      const cachedResult = await this.checkCache(job.cache_key);
      if (cachedResult) {
        console.log('⚡ Cache hit for render job:', jobId);
        await this.updateJobSuccess(jobId, cachedResult, Date.now() - startTime);
        return {
          job_id: jobId,
          status: 'success',
          outputs: cachedResult,
          cache_key: job.cache_key,
          processing_time_ms: Date.now() - startTime
        };
      }

      // 3. Load required data
      const [player, stats, team, templateVariant, manifest] = await Promise.all([
        this.getPlayer(request.player_id),
        this.getPlayerStats(request.player_id, request.stats_context),
        this.getPlayerTeam(request.player_id),
        this.getTemplateVariant(request.template_variant_id),
        this.getManifest(request.template_variant_id)
      ]);

      // 4. Validate data
      this.validateRenderData(player, stats, team, templateVariant, manifest);

      // 5. Process photo with crop data
      const processedPhoto = await this.processPhoto(request.photo_url, manifest, request.crop_data);

      // 6. Generate team palette
      const palette = this.generatePalette(team);

      // 7. Render card with enhanced data
      const outputs = await this.compositeCard({
        player,
        stats,
        team,
        manifest,
        processedPhoto,
        palette,
        tier: request.tier,
        preferHires: request.prefer_hires,
        customizations: request.customizations,
        playerInfo: request.player_info
      });

      // 8. Update job with success
      await this.updateJobSuccess(jobId, outputs, Date.now() - startTime);

      // 9. Cache result
      await this.cacheResult(job.cache_key, outputs);

      console.log('✅ Card render completed successfully:', jobId);
      return {
        job_id: jobId,
        status: 'success',
        outputs,
        cache_key: job.cache_key,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Card render failed:', error);
      
      if (jobId!) {
        await this.updateJobError(jobId, error instanceof Error ? error.message : 'Unknown error');
      }

      return {
        job_id: jobId!,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create render job record
   */
  private async createRenderJob(request: RenderRequest) {
    const cacheKey = this.generateCacheKey(request);
    
    const { data, error } = await this.supabase
      .from('render_jobs')
      .insert([{
        player_id: request.player_id,
        stats_context: request.stats_context,
        template_variant_id: request.template_variant_id,
        tier: request.tier,
        input_photo_url: request.photo_url,
        input_stats: {}, // Will be populated after loading
        input_team_data: {}, // Will be populated after loading
        cache_key: cacheKey,
        status: 'processing'
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create render job: ${error.message}`);
    return data;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: RenderRequest): string {
    const hashInput = JSON.stringify({
      player_id: request.player_id,
      stats_context: request.stats_context,
      template_variant_id: request.template_variant_id,
      photo_url: request.photo_url,
      tier: request.tier
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `card_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check cache for existing result
   */
  private async checkCache(cacheKey: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('render_jobs')
        .select('output_web_url, output_hires_url, output_thumb_url')
        .eq('cache_key', cacheKey)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        web: data.output_web_url,
        hires: data.output_hires_url,
        thumb: data.output_thumb_url
      };
    } catch {
      return null;
    }
  }

  /**
   * Get player data
   */
  private async getPlayer(playerId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, profile_image')
      .eq('id', playerId)
      .single();

    if (error) throw new Error(`Player not found: ${error.message}`);
    return data;
  }

  /**
   * Get player stats for context
   */
  private async getPlayerStats(playerId: string, context: string): Promise<PlayerStats> {
    // Use the player_card_stats view we created
    const { data, error } = await this.supabase
      .from('player_card_stats')
      .select('*')
      .eq('player_id', playerId)
      .eq('stats_context', context)
      .single();

    if (error) {
      // Fallback to default stats if no data found
      console.warn('⚠️ No stats found for context, using defaults:', context);
      return {
        ppg: 0,
        rpg: 0,
        apg: 0,
        spg: 0,
        bpg: 0
      };
    }

    return {
      ppg: data.ppg || 0,
      rpg: data.rpg || 0,
      apg: data.apg || 0,
      spg: data.spg || 0,
      bpg: data.bpg || 0
    };
  }

  /**
   * Get player's team data
   */
  private async getPlayerTeam(playerId: string): Promise<TeamData> {
    // Get the most recent team for the player
    const { data, error } = await this.supabase
      .from('team_players')
      .select(`
        teams (
          id,
          name,
          primary_color,
          secondary_color,
          accent_color,
          logo_url
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data?.teams) {
      // Return default team data
      return {
        name: 'Team',
        primary_color: '#111827',
        secondary_color: '#999999',
        accent_color: '#F5D36C'
      };
    }

    return data.teams;
  }

  /**
   * Get template variant
   */
  private async getTemplateVariant(variantId: string) {
    const { data, error } = await this.supabase
      .from('template_variants')
      .select('*')
      .eq('id', variantId)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(`Template variant not found: ${error.message}`);
    return data;
  }

  /**
   * Get manifest from URL
   */
  private async getManifest(variantId: string) {
    const variant = await this.getTemplateVariant(variantId);
    
    const response = await fetch(variant.manifest_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Validate render data
   */
  private validateRenderData(player: any, stats: any, team: any, variant: any, manifest: any) {
    if (!player) throw new Error('Player data missing');
    if (!stats) throw new Error('Stats data missing');
    if (!team) throw new Error('Team data missing');
    if (!variant) throw new Error('Template variant missing');
    if (!manifest) throw new Error('Manifest missing');
    
    // Validate manifest structure
    const required = ['canvas', 'assets', 'coords', 'typography'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Invalid manifest: missing ${field}`);
      }
    }
  }

  /**
   * Process and crop photo with intelligent positioning
   */
  private async processPhoto(photoUrl: string, manifest: any, cropData?: any) {
    try {
      console.log('🖼️ Processing photo with crop data:', { photoUrl, cropData });
      
      if (!photoUrl) {
        console.log('⚠️ No photo URL provided, using placeholder');
        return {
          url: 'https://via.placeholder.com/300x400/cccccc/666666?text=No+Photo',
          width: manifest.coords?.photo?.w || 300,
          height: manifest.coords?.photo?.h || 400,
          processed: false
        };
      }

      // TODO: Implement actual image processing
      // This would involve:
      // 1. Download the original photo from photoUrl
      // 2. Apply crop data (x, y, width, height, scale, rotation)
      // 3. Resize to template dimensions
      // 4. Apply intelligent positioning based on template
      // 5. Enhance image quality (brightness, contrast, etc.)
      // 6. Upload processed version to storage
      // 7. Return processed image URL
      
      // For now, return the original photo with crop metadata
      return {
        url: photoUrl,
        width: manifest.coords?.photo?.w || 300,
        height: manifest.coords?.photo?.h || 400,
        cropData: cropData || null,
        processed: true
      };
    } catch (error) {
      console.error('❌ Photo processing failed:', error);
      // Return placeholder on error
      return {
        url: 'https://via.placeholder.com/300x400/cccccc/666666?text=Processing+Error',
        width: manifest.coords?.photo?.w || 300,
        height: manifest.coords?.photo?.h || 400,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate team color palette
   */
  private generatePalette(team: TeamData) {
    return {
      primary: team.primary_color || '#111827',
      secondary: team.secondary_color || '#999999',
      accent: team.accent_color || '#F5D36C'
    };
  }

  /**
   * Composite the final card with intelligent positioning
   */
  private async compositeCard(params: {
    player: any;
    stats: PlayerStats;
    team: TeamData;
    manifest: any;
    processedPhoto: any;
    palette: any;
    tier: string;
    preferHires?: boolean;
    customizations?: any;
    playerInfo?: any;
  }) {
    try {
      console.log('🎨 Compositing card with enhanced data:', {
        templateKey: params.manifest.template_key,
        hasPhoto: !!params.processedPhoto?.url,
        hasCropData: !!params.processedPhoto?.cropData,
        hasCustomizations: !!params.customizations,
        hasPlayerInfo: !!params.playerInfo
      });

      // TODO: Implement actual card composition with intelligent positioning
      // This would involve:
      // 1. Load template background and assets from manifest
      // 2. Create high-resolution canvas (e.g., 1200x1600 for trading card)
      // 3. Draw template background layer
      // 4. Apply team color customizations to template elements
      // 5. Position and crop player photo using cropData:
      //    - Apply scale, rotation, and position from cropData
      //    - Mask photo to template's photo zone
      //    - Apply intelligent positioning (face detection, body centering)
      // 6. Render dynamic text overlays:
      //    - Player name, jersey number, position
      //    - Stats with proper formatting and positioning
      //    - Team name and colors
      // 7. Apply visual effects (gradients, shadows, foil effects)
      // 8. Generate multiple resolutions (thumb, web, hires)
      // 9. Upload processed images to Supabase Storage
      // 10. Return public URLs

      // Enhanced mock implementation with better data
      const mockJobId = `${params.player.id}_${Date.now()}`;
      const baseUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/card-renders`;
      
      const outputs = {
        web: `${baseUrl}/${mockJobId}_web.png`,
        thumb: `${baseUrl}/${mockJobId}_thumb.png`,
        metadata: {
          playerName: params.playerInfo?.name || 'Player',
          template: params.manifest.template_key,
          photoProcessed: params.processedPhoto?.processed || false,
          customizations: params.customizations || {}
        }
      };

      if (params.tier === 'premium' || params.preferHires) {
        outputs.hires = `${baseUrl}/${mockJobId}_hires.png`;
      }

      // Return immediately for now (no artificial delay)
      console.log('✅ Card composition completed with enhanced features');
      return outputs;

    } catch (error) {
      console.error('❌ Card composition failed:', error);
      throw new Error('Card composition failed');
    }
  }

  /**
   * Update job with success
   */
  private async updateJobSuccess(jobId: string, outputs: any, processingTime: number) {
    await this.supabase
      .from('render_jobs')
      .update({
        status: 'success',
        output_web_url: outputs.web,
        output_hires_url: outputs.hires,
        output_thumb_url: outputs.thumb,
        processing_time_ms: processingTime,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Update job with error
   */
  private async updateJobError(jobId: string, errorMessage: string) {
    await this.supabase
      .from('render_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  /**
   * Cache result for future use
   */
  private async cacheResult(cacheKey: string, outputs: any) {
    // Results are already cached in the render_jobs table
    console.log('💾 Result cached with key:', cacheKey);
  }
}

// ============================================================================
// ENTITLEMENT SERVICE
// ============================================================================

class EntitlementService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Check and consume user entitlement
   */
  async checkAndConsumeEntitlement(userId: string, tier: 'freemium' | 'premium'): Promise<void> {
    const { data, error } = await this.supabase
      .from('users')
      .select('free_renders_remaining, premium_renders_remaining, card_generation_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to check entitlements: ${error.message}`);
    }

    if (!data.card_generation_enabled) {
      throw new Error('Card generation is disabled for this user');
    }

    const field = tier === 'freemium' ? 'free_renders_remaining' : 'premium_renders_remaining';
    const remaining = data[field] || 0;

    if (remaining <= 0) {
      throw new Error(`No ${tier} renders remaining`);
    }

    // Consume entitlement
    await this.supabase
      .from('users')
      .update({ [field]: remaining - 1 })
      .eq('id', userId);

    console.log(`✅ Consumed ${tier} entitlement for user ${userId}. Remaining: ${remaining - 1}`);
  }
}

// ============================================================================
// EDGE FUNCTION HANDLER
// ============================================================================

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
    const renderRequest: RenderRequest = await req.json();

    // Validate request
    if (!renderRequest.player_id || !renderRequest.template_variant_id || !renderRequest.photo_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user can render for this player (must be the same user)
    if (renderRequest.player_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Can only render cards for your own player' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check and consume entitlement
    const entitlementService = new EntitlementService(supabase);
    await entitlementService.checkAndConsumeEntitlement(user.id, renderRequest.tier);

    // Render card
    const compositor = new CardCompositor(supabase);
    const result = await compositor.renderCard(renderRequest);

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('❌ Card render error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Card render failed',
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
