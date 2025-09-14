import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface GeminiGenerationRequest {
  template_id: string;
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

interface GeneratedAsset {
  layer: string;
  url: string;
  filename: string;
}

interface GeneratedPack {
  variant_key: string;
  assets: GeneratedAsset[];
}

// ============================================================================
// GEMINI 2.5 INTEGRATION
// ============================================================================

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate template pack using Gemini 2.5
   */
  async generateTemplatePack(request: GeminiGenerationRequest): Promise<GeneratedPack[]> {
    try {
      console.log('🎨 Generating template pack with Gemini 2.5:', request.style);

      // Generate each variant with single intelligent prompts
      const packs: GeneratedPack[] = [];
      
      for (let i = 0; i < request.variants; i++) {
        const variantKey = String.fromCharCode(65 + i); // A, B, C, D
        console.log(`🎨 Generating variant ${variantKey}...`);

        const asset = await this.generateCompleteTemplate(variantKey, request.style);

        if (asset) {
          packs.push({
            variant_key: variantKey,
            assets: [asset] // Single complete template
          });
        }
      }

      console.log('✅ Template pack generation completed');
      return packs;

    } catch (error) {
      console.error('❌ Error generating template pack:', error);
      throw error;
    }
  }

  /**
   * Generate complete NBA card template using single intelligent prompt
   */
  private async generateCompleteTemplate(variantKey: string, style: string): Promise<GeneratedAsset | null> {
    try {
      const colorTheme = variantKey === 'A' ? 'blue and silver metallic with chrome accents' : 'red and gold metallic with bronze accents';
      
      // Use Imagen API for actual image generation
      const response = await fetch(`${this.baseUrl}/models/imagen-4.0-generate-001:predict`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{
            prompt: `Create a complete, professional NBA basketball card background template for variant ${variantKey}. Style: ${style} basketball card with ${colorTheme}. Professional sports trading card with metallic borders, beveled edges, realistic light reflections, angular geometric overlays, modern design patterns, arena atmosphere background, subtle crowd/court lighting, hexagonal stat display area in top-right corner, clean negative space in center for player photo placement, subtle glow effects, light streaks for depth, championship-level professional finish with metallic textures. NO player images, NO text, NO numbers, NO team logos - background template only. High contrast areas for text readability, modern sophisticated design, premium NBA card aesthetics, studio lighting quality, sharp focus on geometric details. Photorealistic professional sports trading card, ultra-realistic metallic textures, premium quality finish.`
          }],
          parameters: {
            sampleCount: 1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Debug: Log the full response structure
      console.log(`🔍 Imagen API response for variant ${variantKey}:`, JSON.stringify(result, null, 2));
      
      // Extract image data from Imagen API response
      const predictions = result.predictions;
      
      if (!predictions || predictions.length === 0) {
        console.warn(`⚠️ No predictions returned for variant ${variantKey}`);
        console.log(`🔍 Full result structure:`, JSON.stringify(result, null, 2));
        return null;
      }

      // Get the first prediction (since sampleCount = 1)
      const prediction = predictions[0];
      console.log(`🔍 Prediction for variant ${variantKey}:`, JSON.stringify(prediction, null, 2));

      // Extract base64 image data from prediction
      let imageData = null;
      if (prediction.bytesBase64Encoded) {
        imageData = prediction.bytesBase64Encoded;
        console.log(`✅ Found image data for variant ${variantKey}, length: ${imageData.length}`);
      } else if (prediction.image && prediction.image.bytesBase64Encoded) {
        imageData = prediction.image.bytesBase64Encoded;
        console.log(`✅ Found nested image data for variant ${variantKey}, length: ${imageData.length}`);
      }

      if (!imageData) {
        console.warn(`⚠️ No image data returned for variant ${variantKey}`);
        console.log(`🔍 Available prediction keys:`, Object.keys(prediction));
        return null;
      }

      // Upload the complete template
      const filename = `template_${variantKey.toLowerCase()}.png`;
      const uploadUrl = await this.uploadAsset(imageData, filename, 'image/png');

      console.log(`✅ Generated complete template for variant ${variantKey}`);
      
      return {
        layer: 'template',
        url: uploadUrl,
        filename
      };

    } catch (error) {
      console.error(`❌ Error generating template for variant ${variantKey}:`, error);
      return null;
    }
  }

  // Removed old complex prompt building methods - now using single intelligent prompts

  // Old complex multi-layer generation removed - now using single intelligent prompts

  // Removed old layer-specific prompt building - using single intelligent prompts now

  // Removed old generateSingleAsset method - now using generateCompleteTemplate

  /**
   * Upload generated asset to Supabase Storage
   */
  private async uploadAsset(base64Data: string, filename: string, contentType?: string): Promise<string> {
    try {
      // Convert base64 to Uint8Array
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase Storage
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data, error } = await supabaseClient.storage
        .from('card-templates')
        .upload(`drafts/${Date.now()}_${filename}`, bytes, {
          contentType: contentType || (filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png'),
          upsert: false
        });

      if (error) {
        throw new Error(`Storage upload error: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
        .from('card-templates')
        .getPublicUrl(data.path);

      return publicUrl;

    } catch (error) {
      console.error('❌ Error uploading asset:', error);
      throw error;
    }
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const requestData: GeminiGenerationRequest = await req.json();

    // Validate request
    if (!requestData.style || !requestData.deliver_layers || requestData.variants < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Gemini service
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('🔑 Gemini API Key available:', !!geminiApiKey);
    console.log('🔑 API Key length:', geminiApiKey?.length || 0);
    
    if (!geminiApiKey) {
      console.error('❌ Gemini API key not found in environment');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiService = new GeminiService(geminiApiKey);

    // Generate template pack
    console.log('🚀 Starting template generation for admin:', user.id);
    const generatedPacks = await geminiService.generateTemplatePack(requestData);

    // Save generated variants to database (reuse existing supabaseClient)

    const savedVariants = [];
    for (const pack of generatedPacks) {
      // Create template variant record
      const displayName = `${requestData.style} Variant ${pack.variant_key}`;
      const manifestUrl = `https://placeholder-manifest-${pack.variant_key.toLowerCase()}.json`; // TODO: Generate actual manifest
      const previewUrl = pack.assets.length > 0 ? pack.assets[0].url : null;
      
      const { data: variant, error: variantError } = await supabaseClient
        .from('template_variants')
        .upsert({
          template_id: requestData.template_id,
          variant_key: pack.variant_key,
          display_name: displayName,
          manifest_url: manifestUrl,
          preview_url: previewUrl,
          is_active: true,
          is_premium: true
        }, {
          onConflict: 'template_id,variant_key'
        })
        .select()
        .single();

      if (variantError) {
        console.error(`❌ Error saving variant ${pack.variant_key}:`, variantError);
      } else {
        console.log(`✅ Saved variant ${pack.variant_key} to database`);
        savedVariants.push(variant);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        packs: generatedPacks,
        saved_variants: savedVariants,
        generated_at: new Date().toISOString(),
        style: requestData.style,
        variants: savedVariants.length
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
    console.error('❌ Template generation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Template generation failed',
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
