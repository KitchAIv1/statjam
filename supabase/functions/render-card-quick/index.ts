import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface QuickRenderRequest {
  player_id: string;
  photo_base64: string | null;
  player_info: {
    name: string;
    jersey_number: string;
    position: string;
    team: string;
    stats: {
      ppg: number;
      rpg: number;
      apg: number;
      [key: string]: any;
    };
  };
  template_preference?: 'holographic' | 'vintage' | 'modern' | 'random';
  tier: 'freemium' | 'premium';
}

interface CardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'holographic' | 'vintage' | 'modern' | 'premium';
  player_zone: {
    position: string;
    dimensions: { width: number; height: number };
    placement_hint: string;
  };
  stats_overlay: {
    name: { x: number; y: number; style: string };
    number: { x: number; y: number; style: string };
    team: { x: number; y: number; style: string };
    position: { x: number; y: number; style: string };
    stats: { x: number; y: number; style: string };
  };
  ai_generation_prompt: string;
  estimated_cost: number;
}

interface QuickRenderResult {
  job_id: string;
  status: 'success' | 'failed';
  outputs?: {
    web: string;
    hires?: string;
    thumb: string;
  };
  template_used: string;
  processing_time_ms: number;
  cost_estimate: number;
  error?: string;
}

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

const HOLOGRAPHIC_FOIL_TEMPLATE: CardTemplate = {
  id: 'holographic_foil_v1',
  name: 'Holographic Foil Card',
  description: 'Premium holographic NBA trading card with rainbow foil effects',
  category: 'holographic',
  player_zone: {
    position: 'center_left',
    dimensions: { width: 200, height: 300 },
    placement_hint: 'Player figure should be positioned in the center-left area, occupying roughly 50% of the card width'
  },
  stats_overlay: {
    name: { x: 50, y: 400, style: 'holographic_text_large' },
    number: { x: 300, y: 50, style: 'large_foil_number' },
    team: { x: 50, y: 450, style: 'team_accent_holographic' },
    position: { x: 50, y: 480, style: 'position_text_small' },
    stats: { x: 250, y: 400, style: 'stats_overlay_compact' }
  },
  ai_generation_prompt: `Create a holographic NBA trading card, 400x600 pixels vertical. 

STYLE: Premium holographic foil with rainbow iridescent effects, futuristic design, metallic borders.

LAYOUT: 
- Holographic background with swirling rainbow patterns
- Center-left space (200x300px) for player figure
- Geometric border frame with metallic finish

PLAYER INTEGRATION:
- Remove background from uploaded player photo
- Position player in center-left area
- Add holographic shimmer effect to player
- Blend naturally with card design

TEXT OVERLAYS:
- Player name at bottom: Large holographic text
- Jersey number top-right: Large foil number
- Team name below player name
- Position and stats as overlay

OUTPUT: Complete NBA card with integrated player and all text rendered as single PNG.`,
  estimated_cost: 0.08
};

const VINTAGE_CLASSIC_TEMPLATE: CardTemplate = {
  id: 'vintage_classic_v1',
  name: 'Vintage Classic Card',
  description: 'Retro-style NBA card with classic design elements',
  category: 'vintage',
  player_zone: {
    position: 'center',
    dimensions: { width: 180, height: 280 },
    placement_hint: 'Player figure centered with vintage photo treatment'
  },
  stats_overlay: {
    name: { x: 50, y: 420, style: 'vintage_serif_bold' },
    number: { x: 320, y: 60, style: 'classic_number_style' },
    team: { x: 50, y: 460, style: 'team_vintage_script' },
    position: { x: 50, y: 490, style: 'position_classic_small' },
    stats: { x: 200, y: 520, style: 'stats_vintage_table' }
  },
  ai_generation_prompt: `Create a vintage-style NBA trading card:

CARD DIMENSIONS: 400x600 pixels, vertical portrait

VINTAGE STYLE:
- 1980s-1990s basketball card aesthetic
- Warm, muted color palette with cream/beige backgrounds
- Classic typography and design elements
- Subtle texture resembling aged cardboard

COMPOSITION:
- Traditional rectangular border with rounded corners
- Decorative corner elements in team colors
- Classic NBA logo placement
- Vintage-style background patterns

PLAYER INTEGRATION:
- Remove background from uploaded player photo
- Position player in center (180x280 pixels) 
- Apply vintage photo treatment with slight sepia tone
- Add subtle vignette effect around player
- Player should look like classic sports photography

TEXT OVERLAYS:
- Player name (x:50, y:420): Bold vintage serif font
- Jersey number (x:320, y:60): Classic number styling
- Team name (x:50, y:460): Vintage script font
- Position (x:50, y:490): Small classic text
- Stats (x:200, y:520): Vintage table format

COLOR SCHEME:
- Warm earth tones: cream, brown, gold accents
- Team color highlights
- Aged paper texture throughout
- Subtle gradient backgrounds

FINAL OUTPUT: Complete vintage NBA card with player integrated and all text rendered`,
  estimated_cost: 0.05
};

const MODERN_MINIMALIST_TEMPLATE: CardTemplate = {
  id: 'modern_minimalist_v1',
  name: 'Modern Minimalist Card',
  description: 'Clean, contemporary design with bold typography',
  category: 'modern',
  player_zone: {
    position: 'right_side',
    dimensions: { width: 160, height: 320 },
    placement_hint: 'Player positioned on right side with clean background'
  },
  stats_overlay: {
    name: { x: 30, y: 450, style: 'modern_sans_bold' },
    number: { x: 30, y: 80, style: 'huge_modern_number' },
    team: { x: 30, y: 490, style: 'team_modern_caps' },
    position: { x: 30, y: 520, style: 'position_modern_light' },
    stats: { x: 30, y: 350, style: 'stats_modern_grid' }
  },
  ai_generation_prompt: `Create a modern minimalist NBA trading card:

CARD DIMENSIONS: 400x600 pixels, vertical portrait

MODERN STYLE:
- Clean, contemporary design
- Bold geometric shapes
- Minimal color palette
- Strong typography focus
- Lots of white space

COMPOSITION:
- Asymmetrical layout
- Bold color blocks
- Clean lines and sharp edges
- Modern sans-serif typography areas

PLAYER INTEGRATION:
- Remove background from uploaded player photo
- Position player on right side (160x320 pixels)
- Clean, crisp cutout with sharp edges
- Modern photo treatment with high contrast
- Player should pop against minimal background

TEXT OVERLAYS:
- Player name (x:30, y:450): Bold modern sans-serif
- Jersey number (x:30, y:80): Huge modern number
- Team name (x:30, y:490): Modern caps text
- Position (x:30, y:520): Light modern text
- Stats (x:30, y:350): Modern grid layout

COLOR SCHEME:
- Monochromatic base with single accent color
- High contrast black and white
- Bold team color highlights
- Clean gradients

FINAL OUTPUT: Complete modern NBA card with player integrated and all text rendered`,
  estimated_cost: 0.04
};

const CARD_TEMPLATES: CardTemplate[] = [
  HOLOGRAPHIC_FOIL_TEMPLATE,
  VINTAGE_CLASSIC_TEMPLATE,
  MODERN_MINIMALIST_TEMPLATE
];

// ============================================================================
// QUICK CARD GENERATOR SERVICE
// ============================================================================

class QuickCardGenerator {
  private supabase: any;
  private aiApiKey: string;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.aiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
    
    console.log('🔑 Gemini API key configured:', !!this.aiApiKey);
    
    if (!this.aiApiKey) {
      console.error('❌ Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }
  }

  /**
   * Generate card with single AI call
   */
  async generateQuickCard(request: QuickRenderRequest): Promise<QuickRenderResult> {
    const startTime = Date.now();
    let jobId: string;

    try {
      console.log('🚀 Starting quick card generation for player:', request.player_id);

      // 1. Select template
      const template = this.selectTemplate(request.template_preference);
      console.log('🎨 Selected template:', template.name);

      // 2. Create job record (simplified for testing)
      jobId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 3. Generate card directly with Gemini 2.5 Flash Image Preview
      const cardUrl = await this.generateCardWithGemini(request, template);

      // 5. Create output URLs (for now, same URL for all sizes)
      const outputs = {
        web: cardUrl,
        thumb: cardUrl,
        hires: request.tier === 'premium' ? cardUrl : undefined
      };

      // 6. Save to player_cards table (skip job update for now)
      await this.savePlayerCard(request, template.id, cardUrl);

      console.log('✅ Quick card generation completed:', jobId);
      return {
        job_id: jobId,
        status: 'success',
        outputs,
        template_used: template.name,
        processing_time_ms: Date.now() - startTime,
        cost_estimate: template.estimated_cost
      };

    } catch (error) {
      console.error('❌ Quick card generation failed:', error);
      
      // Skip job error update for now
      console.error('Job ID for failed generation:', jobId);

      return {
        job_id: jobId!,
        status: 'failed',
        template_used: 'unknown',
        processing_time_ms: Date.now() - startTime,
        cost_estimate: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Select template based on preference
   */
  private selectTemplate(preference?: string): CardTemplate {
    if (preference && preference !== 'random') {
      const template = CARD_TEMPLATES.find(t => t.category === preference);
      if (template) return template;
    }
    
    // Random selection
    const randomIndex = Math.floor(Math.random() * CARD_TEMPLATES.length);
    return CARD_TEMPLATES[randomIndex];
  }


  /**
   * Generate card directly with Gemini 2.5 Flash Image Preview
   */
  private async generateCardWithGemini(request: QuickRenderRequest, template: CardTemplate): Promise<string> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Calling Gemini 2.5 Flash Image Preview for card generation (attempt ${attempt}/${maxRetries})...`);

        // Build comprehensive prompt for direct card generation
        const fullPrompt = this.buildGeminiPrompt(request, template);
        
        console.log('🔍 Photo base64 provided:', !!request.photo_base64);
        console.log('📝 Gemini Prompt length:', fullPrompt.length);

        // Prepare request body for Gemini 2.5 Flash multi-modal generation
        const contentParts = [
          { text: fullPrompt }
        ];

        // Add player photo if provided
        if (request.photo_base64) {
          console.log('📸 Including player photo in multi-modal request (data URL length:', request.photo_base64.length, ')');
          
          // Parse the data URL to extract mime type and base64 data
          let mimeType = "image/jpeg";
          let base64Data = request.photo_base64;
          
          if (request.photo_base64.startsWith('data:')) {
            try {
              const [header, encoded] = request.photo_base64.split(',');
              mimeType = header.split(';')[0].split(':')[1];
              base64Data = encoded;
              console.log('📸 Parsed data URL - mime type:', mimeType, 'base64 length:', base64Data.length);
            } catch (error) {
              console.warn('⚠️ Failed to parse data URL, using as-is:', error);
            }
          }
          
          contentParts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          });
        }

        const requestBody = {
          contents: [{
            parts: contentParts
          }]
        };

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
          method: 'POST',
          headers: {
            'x-goog-api-key': this.aiApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini generation failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('🔍 Gemini API response structure:', Object.keys(result));
        
        // Check for generated image data according to Google's documentation
        // The response should have: result.parts[0].inline_data.data
        if (result.parts && result.parts.length > 0) {
          console.log('🔍 Found parts in response:', result.parts.length);
          
          for (const part of result.parts) {
            console.log('🔍 Part structure:', Object.keys(part));
            if (part.inline_data?.data) {
              console.log('✅ Found generated image in Gemini response (parts format)');
              
              // Upload to Supabase Storage
              const fileName = `gemini_card_${request.player_id}_${Date.now()}.png`;
              const filePath = `quick-cards/${fileName}`;
              
              // Convert base64 to Uint8Array for Deno
              const binaryString = atob(part.inline_data.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('card-templates')
                .upload(filePath, bytes, {
                  contentType: 'image/png',
                  cacheControl: '3600'
                });

              if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
              }

              // Get public URL
              const { data: urlData } = this.supabase.storage
                .from('card-templates')
                .getPublicUrl(filePath);

              console.log('✅ Card generated with Gemini and uploaded successfully');
              return urlData.publicUrl;
            }
          }
        }
        
        // Fallback: Check candidates format (alternative response structure)
        if (result.candidates?.[0]?.content?.parts) {
          const parts = result.candidates[0].content.parts;
          console.log('🔍 Checking candidates format - Parts found:', parts.length, 'parts');
          
          // Look for image data in the response parts
          for (const part of parts) {
            console.log('🔍 Part structure:', Object.keys(part));
            if (part.inline_data?.data) {
              console.log('✅ Found generated image in Gemini response (candidates format)');
              
              // Upload to Supabase Storage
              const fileName = `gemini_card_${request.player_id}_${Date.now()}.png`;
              const filePath = `quick-cards/${fileName}`;
              
              // Convert base64 to Uint8Array for Deno
              const binaryString = atob(part.inline_data.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              const { data: uploadData, error: uploadError } = await this.supabase.storage
                .from('card-templates')
                .upload(filePath, bytes, {
                  contentType: 'image/png',
                  cacheControl: '3600'
                });

              if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
              }

              // Get public URL
              const { data: urlData } = this.supabase.storage
                .from('card-templates')
                .getPublicUrl(filePath);

              console.log('✅ Card generated with Gemini and uploaded successfully');
              return urlData.publicUrl;
            }
          }
        }
        
        // Log the full response for debugging
        console.error('❌ No image data found in Gemini response');
        console.error('📋 Full response:', JSON.stringify(result, null, 2));
        
        // Check if Gemini provided any text response explaining why no image was generated
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.error('📝 Gemini response text:', result.candidates[0].content.parts[0].text);
        }
        
        throw new Error('No image data found in Gemini response. Check logs for details.');

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Gemini card generation attempt ${attempt} failed:`, error);
        
        // Retry with exponential backoff for certain errors
        if (attempt < maxRetries && (
          error instanceof Error && (
            error.message.includes('503') || 
            error.message.includes('DEADLINE_EXCEEDED') ||
            error.message.includes('UNAVAILABLE')
          )
        )) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry for other errors
        break;
      }
    }

    throw lastError;
  }


  /**
   * Build prompt specifically for Gemini 2.5 Flash Image Preview
   */
  private buildGeminiPrompt(request: QuickRenderRequest, template: CardTemplate): string {
    const { player_info } = request;
    
    if (request.photo_base64) {
      // Multi-modal prompt when photo is provided
      return `You are an expert graphic designer specializing in NBA trading cards.

Your task is to create a professional NBA trading card featuring the player in the provided photo.

Instructions:
1. Use the player from the uploaded photo as the main subject
2. Remove the background from the player photo and place them prominently on the card
3. Create a ${template.name} style NBA card (${template.description})
4. Include these text elements on the card:
   - Player Name: "${player_info.name}"
   - Jersey Number: "${player_info.jersey_number}"
   - Team: "${player_info.team}"
   - Position: "${player_info.position}"
   - Stats: ${player_info.stats.ppg} PPG, ${player_info.stats.rpg} RPG, ${player_info.stats.apg} APG

5. The final output must be a single, complete NBA trading card image (400x600px)
6. Make it look professional and authentic like real NBA cards

Generate the complete trading card now.`;
    } else {
      // Text-only prompt when no photo provided
      return `Create a professional NBA trading card image (400x600px):

Player Details:
- Name: "${player_info.name}"
- Number: ${player_info.jersey_number}
- Team: ${player_info.team}
- Position: ${player_info.position}
- Stats: ${player_info.stats.ppg} PPG, ${player_info.stats.rpg} RPG, ${player_info.stats.apg} APG

Style: ${template.name} - ${template.description}

Generate a dynamic basketball player figure and create a complete, professional NBA trading card.`;
    }
  }


  /**
   * Create quick job record
   */
  private async createQuickJob(request: QuickRenderRequest, templateId: string) {
      // Create job record with required fields
      const { data, error } = await this.supabase
        .from('render_jobs')
        .insert([{
          player_id: request.player_id,
          stats_context: 'quick_generation',
          template_variant_id: templateId,
          tier: request.tier,
          input_photo_provided: !!request.photo_base64,
          input_stats: request.player_info.stats || {},
          input_team_data: { name: request.player_info.team || 'Team' },
          status: 'processing'
        }])
        .select()
        .single();

    if (error) throw new Error(`Failed to create job: ${error.message}`);
    return data;
  }

  /**
   * Save generated card to player_cards table
   */
  private async savePlayerCard(request: QuickRenderRequest, templateId: string, cardUrl: string) {
    const { error } = await this.supabase
      .from('player_cards')
      .insert([{
        user_id: request.player_id,
        template_variant_id: templateId,
        generated_image_url: cardUrl,
        card_data: {
          template_type: 'quick_generation',
          player_info: request.player_info,
          generation_method: 'ai_single_call'
        }
      }]);

    if (error) {
      console.warn('⚠️ Failed to save player card record:', error.message);
      // Don't throw - this is not critical for the generation process
    } else {
      console.log('✅ Player card saved to database');
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
}

// ============================================================================
// ENTITLEMENT SERVICE
// ============================================================================

class EntitlementService {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async checkAndConsumeEntitlement(userId: string, tier: 'freemium' | 'premium'): Promise<void> {
    const { data, error } = await this.supabase
      .from('users')
      .select('free_renders_remaining, premium_renders_remaining, card_generation_enabled')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to check entitlements: ${error.message}`);
    }

    // Enable card generation if not set
    if (!data.card_generation_enabled) {
      await this.supabase
        .from('users')
        .update({ card_generation_enabled: true })
        .eq('id', userId);
      console.log(`✅ Enabled card generation for user ${userId}`);
    }

    const field = tier === 'freemium' ? 'free_renders_remaining' : 'premium_renders_remaining';
    let remaining = data[field] || 0;

    // Give users 5 free renders if they have none (for testing)
    if (remaining <= 0 && tier === 'freemium') {
      console.log(`🎁 Granting 5 free renders to user ${userId}`);
      await this.supabase
        .from('users')
        .update({ free_renders_remaining: 5 })
        .eq('id', userId);
      remaining = 5;
    }

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
  console.log('🚀 render-card-quick function called with method:', req.method);
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('🔧 Starting request processing...');
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
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
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Parse request
    const renderRequest: QuickRenderRequest = await req.json();
    
    // Log the received request for debugging
    console.log('🔍 Received request:', JSON.stringify(renderRequest, null, 2));

    // Validate request
    if (!renderRequest.player_id || !renderRequest.player_info) {
      console.error('❌ Validation failed:', {
        player_id: !!renderRequest.player_id,
        photo_base64: !!renderRequest.photo_base64,
        player_info: !!renderRequest.player_info,
        actual_player_info: renderRequest.player_info
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: player_id, player_info',
          details: {
            player_id: !!renderRequest.player_id,
            photo_base64: !!renderRequest.photo_base64,
            player_info: !!renderRequest.player_info
          }
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Verify user can render for this player
    if (renderRequest.player_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Can only render cards for your own player' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Check and consume entitlement
    const entitlementService = new EntitlementService(supabase);
    await entitlementService.checkAndConsumeEntitlement(user.id, renderRequest.tier);

    // Generate quick card
    const generator = new QuickCardGenerator(supabase);
    const result = await generator.generateQuickCard(renderRequest);

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
    console.error('❌ Quick card generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Quick card generation failed',
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
