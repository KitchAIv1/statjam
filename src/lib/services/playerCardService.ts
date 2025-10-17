import { supabase } from '@/lib/supabase';

export interface Template {
  id: string;
  name: string;
  description: string;
  style: string;
  sport: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariant {
  id: string;
  template_id: string;
  variant_key: string;
  display_name: string;
  manifest_url: string | null;
  preview_url: string | null;
  created_at: string;
}

export interface PlayerCard {
  id: string;
  user_id: string;
  template_variant_id: string;
  card_data: any;
  generated_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardGenerationRequest {
  templateVariantId: string;
  playerData: {
    name: string;
    jerseyNumber: string;
    position: string;
    team: string;
    stats: {
      points: number;
      rebounds: number;
      assists: number;
      fieldGoalPct: number;
      threePointPct: number;
      freeThrowPct: number;
    };
    profilePhotoUrl?: string;
    posePhotoUrl?: string;
    cropData?: {
      x: number;
      y: number;
      width: number;
      height: number;
      scale: number;
      rotation: number;
    };
  };
  customizations?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

export interface QuickCardGenerationRequest {
  photoBase64: string | null;
  playerData: {
    name: string;
    jerseyNumber: string;
    position: string;
    team: string;
    stats: {
      ppg: number;
      rpg: number;
      apg: number;
    };
  };
  templatePreference?: 'holographic' | 'vintage' | 'modern' | 'random';
  tier?: 'freemium' | 'premium';
}

export interface QuickCardResult {
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

export class PlayerCardService {
  /**
   * Fetch all available templates for players to browse
   */
  static async getAvailableTemplates(): Promise<{ templates: Template[], variants: TemplateVariant[] }> {
    try {
      // Fetch templates
      const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw templatesError;
      }

      // Fetch template variants
      const { data: variants, error: variantsError } = await supabase
        .from('template_variants')
        .select('*')
        .not('preview_url', 'is', null) // Only variants with preview images
        .order('created_at', { ascending: false });

      if (variantsError) {
        console.error('Error fetching template variants:', variantsError);
        throw variantsError;
      }

      return {
        templates: templates || [],
        variants: variants || []
      };
    } catch (error) {
      console.error('PlayerCardService.getAvailableTemplates error:', error);
      throw error;
    }
  }

  /**
   * Get template variants for a specific template
   */
  static async getTemplateVariants(templateId: string): Promise<TemplateVariant[]> {
    try {
      const { data, error } = await supabase
        .from('template_variants')
        .select('*')
        .eq('template_id', templateId)
        .not('preview_url', 'is', null)
        .order('variant_key');

      if (error) {
        console.error('Error fetching template variants:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('PlayerCardService.getTemplateVariants error:', error);
      throw error;
    }
  }

  /**
   * Generate a player card using the render-card Edge Function
   */
  static async generatePlayerCard(request: CardGenerationRequest): Promise<PlayerCard> {
    try {
      console.log('🎨 Generating player card:', request);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call the render-card Edge Function
      const { data, error } = await supabase.functions.invoke('render-card', {
        body: {
          player_id: user.id,
          template_variant_id: request.templateVariantId,
          photo_url: request.playerData.profilePhotoUrl || request.playerData.posePhotoUrl || '',
          stats_context: 'current_season',
          tier: 'freemium',
          crop_data: request.playerData.cropData,
          customizations: request.customizations || {},
          player_info: {
            name: request.playerData.name,
            jersey_number: request.playerData.jerseyNumber,
            position: request.playerData.position,
            team: request.playerData.team,
            stats: request.playerData.stats
          }
        }
      });

      if (error) {
        console.error('Error calling render-card function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Card generation failed');
      }

      // Save the generated card to the database
      const cardData = {
        user_id: user.id,
        template_variant_id: request.templateVariantId,
        card_data: {
          playerData: request.playerData,
          customizations: request.customizations
        },
        generated_image_url: data.imageUrl
      };

      const { data: savedCard, error: saveError } = await supabase
        .from('player_cards')
        .insert(cardData)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving generated card:', saveError);
        throw saveError;
      }

      console.log('✅ Player card generated successfully:', savedCard);
      return savedCard;
    } catch (error) {
      console.error('PlayerCardService.generatePlayerCard error:', error);
      throw error;
    }
  }

  /**
   * Get player's generated cards
   */
  static async getPlayerCards(userId?: string): Promise<PlayerCard[]> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        targetUserId = user.id;
      }

      const { data, error } = await supabase
        .from('player_cards')
        .select(`
          *,
          template_variants (
            id,
            template_id,
            variant_key,
            display_name,
            preview_url,
            templates (
              id,
              name,
              description,
              style
            )
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching player cards:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('PlayerCardService.getPlayerCards error:', error);
      throw error;
    }
  }

  /**
   * Generate a quick NBA card using AI with single call (NEW HOLOGRAM SYSTEM)
   */
  static async generateQuickCard(request: QuickCardGenerationRequest): Promise<QuickCardResult> {
    try {
      console.log('🚀 Generating quick NBA card:', request);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const requestBody = {
        player_id: user.id,
        photo_base64: request.photoBase64, // Now includes full data URL prefix
        player_info: {
          name: request.playerData.name,
          jersey_number: request.playerData.jerseyNumber,
          position: request.playerData.position,
          team: request.playerData.team,
          stats: {
            ppg: request.playerData.stats.ppg,
            rpg: request.playerData.stats.rpg,
            apg: request.playerData.stats.apg
          }
        },
        template_preference: request.templatePreference || 'random',
        tier: request.tier || 'freemium'
      };

      console.log('📤 Sending request to render-card-quick:', JSON.stringify(requestBody, null, 2));

      // Call the new render-card-quick Edge Function
      const { data, error } = await supabase.functions.invoke('render-card-quick', {
        body: requestBody
      });

      if (error) {
        console.error('Error calling render-card-quick function:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      if (data.status === 'failed') {
        console.error('Card generation failed with data:', data);
        throw new Error(data.error || 'Quick card generation failed');
      }

      console.log('✅ Quick NBA card generated successfully:', data);
      return data as QuickCardResult;
    } catch (error) {
      console.error('PlayerCardService.generateQuickCard error:', error);
      throw error;
    }
  }

  /**
   * Delete a player card
   */
  static async deletePlayerCard(cardId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('player_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id); // Ensure user can only delete their own cards

      if (error) {
        console.error('Error deleting player card:', error);
        throw error;
      }

      console.log('✅ Player card deleted successfully');
    } catch (error) {
      console.error('PlayerCardService.deletePlayerCard error:', error);
      throw error;
    }
  }
}
