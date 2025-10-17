/**
 * NBA Card Template Library
 * JSON-based templates for AI-powered card generation
 */

export interface CardTemplate {
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
  estimated_cost: number; // in USD
}

export const HOLOGRAPHIC_FOIL_TEMPLATE: CardTemplate = {
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
  ai_generation_prompt: `Create a premium holographic NBA trading card template with these specifications:

CARD DIMENSIONS: 400x600 pixels, vertical portrait orientation

OVERALL STYLE:
- Primary effect: holographic foil with rainbow iridescent surface
- Secondary effects: futuristic, abstract, psychedelic, dynamic
- Mood: vibrant, energetic, chaotic, premium collectible feel

COMPOSITION:
- Layout: Central art panel with geometric border frame
- Background: Simple neutral light-gray backdrop with soft drop shadow for depth
- Frame: Futuristic technological border with beveled edges and clipped corners forming octagonal inner shape
- Frame texture: Distressed holographic foil, silver base with muted rainbow spectrum reflections, subtle scratches and metallic sheen
- Central area: Complex abstract design filling octagonal space

VISUAL ELEMENTS:
- Swirling ribbons: Thick, flowing, interwoven lines creating fluid motion with volume and light reflection
- Splatters and specks: Fine dots, specks, and spray paint-like splatters for chaotic texture and energy
- Orbs and bubbles: Circular and spherical shapes of varying sizes, some translucent like droplets
- Heavy layering for significant visual depth and complexity

COLOR AND LIGHTING:
- Full spectrum rainbow palette: red, orange, yellow, green, cyan, blue, magenta
- Accent colors: deep black shadows, bright white specular highlights
- Very high saturation with high contrast
- Iridescent and prismatic effects simulating color-shifting as light hits from multiple angles
- Multi-directional lighting creating intense highlights and smooth gradients

TEXTURE:
- Fine, grainy, glittery texture across entire surface for holographic foil effect
- Contrast between smooth gradient ribbons and gritty splatter elements

CRITICAL PLAYER INTEGRATION ZONE:
- Reserve center-left area (approximately 200x300 pixels) for player figure placement
- This area should have complementary background that works with human silhouette
- Ensure holographic effects flow naturally around where player will be positioned
- Background in this zone should be slightly less busy to allow player to stand out

FINAL OUTPUT: High-resolution PNG template ready for player figure compositing, optimized for AI processing`,
  estimated_cost: 0.06
};

export const VINTAGE_CLASSIC_TEMPLATE: CardTemplate = {
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
  ai_generation_prompt: `Create a vintage-style NBA trading card template:

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

PLAYER ZONE:
- Center position (180x280 pixels) for player photo
- Vintage photo treatment area with subtle vignette
- Classic sports photography style integration

COLOR SCHEME:
- Warm earth tones: cream, brown, gold accents
- Team color highlights
- Aged paper texture throughout
- Subtle gradient backgrounds

Reserve center area for player figure placement with vintage photo styling.`,
  estimated_cost: 0.05
};

export const MODERN_MINIMALIST_TEMPLATE: CardTemplate = {
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
  ai_generation_prompt: `Create a modern minimalist NBA trading card template:

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

PLAYER ZONE:
- Right side placement (160x320 pixels)
- Clean background for player figure
- Modern photo treatment integration

COLOR SCHEME:
- Monochromatic base with single accent color
- High contrast black and white
- Bold team color highlights
- Clean gradients

Reserve right side area for player figure with modern clean background.`,
  estimated_cost: 0.04
};

// Template library for random selection
export const CARD_TEMPLATES: CardTemplate[] = [
  HOLOGRAPHIC_FOIL_TEMPLATE,
  VINTAGE_CLASSIC_TEMPLATE,
  MODERN_MINIMALIST_TEMPLATE
];

// Utility functions
export function getRandomTemplate(): CardTemplate {
  const randomIndex = Math.floor(Math.random() * CARD_TEMPLATES.length);
  return CARD_TEMPLATES[randomIndex];
}

export function getTemplateById(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: CardTemplate['category']): CardTemplate[] {
  return CARD_TEMPLATES.filter(template => template.category === category);
}

export function getEstimatedCost(templateId?: string): number {
  if (templateId) {
    const template = getTemplateById(templateId);
    return template?.estimated_cost || 0.06;
  }
  // Average cost for random template
  return CARD_TEMPLATES.reduce((sum, t) => sum + t.estimated_cost, 0) / CARD_TEMPLATES.length;
}
