import { safeSupabase } from '@/lib/supabaseClient';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Template {
  id: string;
  template_key: string;
  style: string;
  display_name: string;
  description?: string;
  version: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariant {
  id: string;
  template_id: string;
  variant_key: string;
  display_name: string;
  manifest_url: string;
  preview_url?: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateManifest {
  template_key: string;
  variant_key: string;
  version: number;
  canvas: {
    w: number;
    h: number;
    dpi: number;
  };
  assets: {
    background: string;
    overlays: string[];
    photo_mask: string;
    foil_map?: string;
    light_map?: string;
    nameplate_svg: string;
    statbox_svg: string;
  };
  coords: {
    photo: CoordinateBox;
    nameplate: CoordinateBox;
    primary_stats: CoordinateBox;
    secondary_stats?: CoordinateBox;
    year_badge?: CoordinateBox;
    team_logo?: CoordinateBox;
  };
  typography: {
    font_family: string;
    nameplate: TypographyStyle;
    stats_primary: TypographyStyle;
    stats_labels: TypographyStyle;
    badge: TypographyStyle;
  };
  theming: {
    palette_slots: string[];
    recolor_rules: RecolorRule[];
  };
  effects: {
    grain: number;
    vignette: number;
    foil_intensity: number;
    bloom: number;
  };
  constraints: {
    min_face_size_px: number;
    safe_text_margin_px: number;
    allow_action_shots: boolean;
  };
}

export interface CoordinateBox {
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  fit?: 'cover' | 'contain' | 'fill';
  shape?: 'rect' | 'hex' | 'circle';
}

export interface TypographyStyle {
  size: number;
  weight: number;
  letterSpacing?: number;
}

export interface RecolorRule {
  target: string;
  slot: string;
  mode: 'multiply' | 'replace' | 'overlay';
}

export interface RenderJob {
  id: string;
  player_id: string;
  stats_context: string;
  template_variant_id: string;
  tier: 'freemium' | 'premium';
  input_photo_url: string;
  input_stats: Record<string, any>;
  input_team_data: Record<string, any>;
  cache_key?: string;
  status: 'queued' | 'processing' | 'success' | 'failed';
  cost_usd_estimate?: number;
  processing_time_ms?: number;
  output_web_url?: string;
  output_hires_url?: string;
  output_thumb_url?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  completed_at?: string;
}

export interface GeminiGenerationRequest {
  style: 'modern' | 'vintage' | 'championship' | 'neon' | 'holographic';
  visual_motifs: string[];
  palette: {
    base: string[];
    accents: string[];
  };
  render_size: {
    w: number;
    h: number;
  };
  deliver_layers: string[];
  constraints: {
    no_trademarks: boolean;
    no_team_specific_icons: boolean;
    high_text_legibility: boolean;
    photo_silhouette_center: boolean;
  };
  variants: number;
}

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export class TemplateService {
  
  // --------------------------------------------------------------------------
  // TEMPLATE MANAGEMENT
  // --------------------------------------------------------------------------
  
  /**
   * Get all active templates for public use
   */
  static async getActiveTemplates(): Promise<Template[]> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('style', { ascending: true });

      if (error) {
        console.error('❌ Error fetching active templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getActiveTemplates:', error);
      throw error;
    }
  }

  /**
   * Get all templates (admin only)
   */
  static async getAllTemplates(): Promise<Template[]> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllTemplates:', error);
      throw error;
    }
  }

  /**
   * Create a new template family
   */
  static async createTemplate(templateData: {
    template_key: string;
    style: string;
    display_name: string;
    description?: string;
  }): Promise<Template> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          template_key: templateData.template_key,
          style: templateData.style,
          display_name: templateData.display_name,
          description: templateData.description,
          version: 1,
          is_active: false, // Start inactive until variants are added
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating template:', error);
        
        // Handle duplicate key error specifically
        if (error.code === '23505' && error.message.includes('templates_template_key_key')) {
          throw new Error('A template with this key already exists. Please try a different name.');
        }
        
        throw new Error(`Failed to create template: ${error.message}`);
      }

      console.log('✅ Template created successfully:', data.template_key);
      return data;
    } catch (error) {
      console.error('❌ Error in createTemplate:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating template:', error);
        throw new Error(`Failed to update template: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in updateTemplate:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // TEMPLATE VARIANTS MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Get active variants for a template
   */
  static async getTemplateVariants(templateId: string): Promise<TemplateVariant[]> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('template_variants')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching template variants:', error);
        throw new Error(`Failed to fetch variants: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getTemplateVariants:', error);
      throw error;
    }
  }

  /**
   * Get all variants for admin
   */
  static async getAllTemplateVariants(templateId: string): Promise<TemplateVariant[]> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('template_variants')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching all template variants:', error);
        throw new Error(`Failed to fetch variants: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllTemplateVariants:', error);
      throw error;
    }
  }

  /**
   * Create a new template variant
   */
  static async createTemplateVariant(variantData: {
    template_id: string;
    variant_key: string;
    display_name: string;
    manifest_url: string;
    preview_url?: string;
    is_premium?: boolean;
    sort_order?: number;
  }): Promise<TemplateVariant> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('template_variants')
        .insert([{
          ...variantData,
          is_premium: variantData.is_premium ?? true,
          is_active: false, // Start inactive until published
          sort_order: variantData.sort_order ?? 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating template variant:', error);
        throw new Error(`Failed to create variant: ${error.message}`);
      }

      console.log('✅ Template variant created successfully:', data.variant_key);
      return data;
    } catch (error) {
      console.error('❌ Error in createTemplateVariant:', error);
      throw error;
    }
  }

  /**
   * Update template variant
   */
  static async updateTemplateVariant(variantId: string, updates: Partial<TemplateVariant>): Promise<TemplateVariant> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('template_variants')
        .update(updates)
        .eq('id', variantId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating template variant:', error);
        throw new Error(`Failed to update variant: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in updateTemplateVariant:', error);
      throw error;
    }
  }

  /**
   * Publish template variant (activate it)
   */
  static async publishTemplateVariant(variantId: string): Promise<TemplateVariant> {
    try {
      const supabase = safeSupabase();
      
      // First validate that the variant has all required assets
      const variant = await this.getTemplateVariant(variantId);
      if (!variant.manifest_url) {
        throw new Error('Cannot publish variant without manifest URL');
      }

      const { data, error } = await supabase
        .from('template_variants')
        .update({ is_active: true })
        .eq('id', variantId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error publishing template variant:', error);
        throw new Error(`Failed to publish variant: ${error.message}`);
      }

      console.log('✅ Template variant published successfully:', data.variant_key);
      return data;
    } catch (error) {
      console.error('❌ Error in publishTemplateVariant:', error);
      throw error;
    }
  }

  /**
   * Get single template variant
   */
  static async getTemplateVariant(variantId: string): Promise<TemplateVariant> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('template_variants')
        .select('*')
        .eq('id', variantId)
        .single();

      if (error) {
        console.error('❌ Error fetching template variant:', error);
        throw new Error(`Failed to fetch variant: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in getTemplateVariant:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // MANIFEST MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Fetch and parse manifest from URL
   */
  static async getManifest(manifestUrl: string): Promise<TemplateManifest> {
    try {
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }

      const manifest = await response.json();
      
      // Validate manifest structure
      this.validateManifest(manifest);
      
      return manifest;
    } catch (error) {
      console.error('❌ Error fetching manifest:', error);
      throw error;
    }
  }

  /**
   * Validate manifest structure
   */
  static validateManifest(manifest: any): void {
    const required = [
      'template_key', 'variant_key', 'version', 'canvas', 
      'assets', 'coords', 'typography', 'theming', 'effects'
    ];

    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Invalid manifest: missing required field '${field}'`);
      }
    }

    // Validate canvas
    if (!manifest.canvas.w || !manifest.canvas.h) {
      throw new Error('Invalid manifest: canvas must have width and height');
    }

    // Validate coordinates
    const requiredCoords = ['photo', 'nameplate', 'primary_stats'];
    for (const coord of requiredCoords) {
      if (!manifest.coords[coord]) {
        throw new Error(`Invalid manifest: missing required coordinate '${coord}'`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // RENDER JOBS MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create a new render job
   */
  static async createRenderJob(jobData: {
    player_id: string;
    stats_context: string;
    template_variant_id: string;
    tier: 'freemium' | 'premium';
    input_photo_url: string;
    input_stats: Record<string, any>;
    input_team_data: Record<string, any>;
  }): Promise<RenderJob> {
    try {
      const supabase = safeSupabase();
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(jobData);
      
      const { data, error } = await supabase
        .from('render_jobs')
        .insert([{
          ...jobData,
          cache_key: cacheKey,
          status: 'queued',
          retry_count: 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating render job:', error);
        throw new Error(`Failed to create render job: ${error.message}`);
      }

      console.log('✅ Render job created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error in createRenderJob:', error);
      throw error;
    }
  }

  /**
   * Get render jobs for a user
   */
  static async getUserRenderJobs(userId: string, limit: number = 20): Promise<RenderJob[]> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('render_jobs')
        .select('*')
        .eq('player_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching user render jobs:', error);
        throw new Error(`Failed to fetch render jobs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getUserRenderJobs:', error);
      throw error;
    }
  }

  /**
   * Update render job status
   */
  static async updateRenderJob(jobId: string, updates: Partial<RenderJob>): Promise<RenderJob> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('render_jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating render job:', error);
        throw new Error(`Failed to update render job: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in updateRenderJob:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // UTILITY METHODS
  // --------------------------------------------------------------------------

  /**
   * Generate cache key for render job
   */
  static generateCacheKey(jobData: {
    player_id: string;
    template_variant_id: string;
    input_stats: Record<string, any>;
    input_team_data: Record<string, any>;
    input_photo_url: string;
  }): string {
    const hashInput = JSON.stringify({
      player_id: jobData.player_id,
      template_variant_id: jobData.template_variant_id,
      stats: jobData.input_stats,
      team: jobData.input_team_data,
      photo: jobData.input_photo_url,
    });

    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `cache_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Check user entitlements for card generation
   */
  static async checkUserEntitlements(userId: string): Promise<{
    free_renders_remaining: number;
    premium_renders_remaining: number;
    card_generation_enabled: boolean;
  }> {
    try {
      const supabase = safeSupabase();
      
      const { data, error } = await supabase
        .from('users')
        .select('free_renders_remaining, premium_renders_remaining, card_generation_enabled')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error checking user entitlements:', error);
        throw new Error(`Failed to check entitlements: ${error.message}`);
      }

      return {
        free_renders_remaining: data.free_renders_remaining || 0,
        premium_renders_remaining: data.premium_renders_remaining || 0,
        card_generation_enabled: data.card_generation_enabled ?? true,
      };
    } catch (error) {
      console.error('❌ Error in checkUserEntitlements:', error);
      throw error;
    }
  }

  /**
   * Consume user entitlement
   */
  static async consumeEntitlement(userId: string, tier: 'freemium' | 'premium'): Promise<void> {
    try {
      const supabase = safeSupabase();
      
      const field = tier === 'freemium' ? 'free_renders_remaining' : 'premium_renders_remaining';
      
      const { error } = await supabase.rpc('decrement_user_renders', {
        user_id: userId,
        render_type: tier
      });

      if (error) {
        console.error('❌ Error consuming entitlement:', error);
        throw new Error(`Failed to consume entitlement: ${error.message}`);
      }

      console.log('✅ Entitlement consumed successfully:', { userId, tier });
    } catch (error) {
      console.error('❌ Error in consumeEntitlement:', error);
      throw error;
    }
  }
}
