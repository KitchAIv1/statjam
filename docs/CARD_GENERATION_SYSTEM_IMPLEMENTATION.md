# StatJam Card Generation System - Implementation Guide

## Overview
This document provides a comprehensive guide to the NBA-style card generation system implemented in StatJam. The system allows players to create professional trading cards using AI-generated templates and their live game statistics.

## Date
- **Created**: January 3, 2025
- **Status**: Phase 1 Complete - Ready for Testing

---

## 🏗️ **System Architecture**

### **Template-First Approach**
The system uses a template-first architecture where:
1. **Admins** create and manage template families using Gemini 2.5 AI
2. **Templates** contain multiple variants (A, B, C, D) with different visual styles
3. **Runtime Compositor** combines templates with player data to generate cards
4. **Caching System** ensures fast subsequent renders

### **Component Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Card Studio   │    │  Edge Functions │
│                 │    │                 │    │                 │
│ - Template Mgmt │    │ - Player UI     │    │ - AI Generation │
│ - AI Generation │◄──►│ - Card Creation │◄──►│ - Compositor    │
│ - Publishing    │    │ - Preview/Share │    │ - Asset Pipeline│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Database     │    │   Supabase      │    │   Gemini 2.5    │
│                 │    │   Storage       │    │                 │
│ - Templates     │    │ - Assets        │    │ - AI Generation │
│ - Render Jobs   │    │ - Rendered Cards│    │ - Style Transfer│
│ - Analytics     │    │ - User Photos   │    │ - Asset Creation│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📊 **Database Schema**

### **New Tables Added**
- **`templates`** - Template families (Modern Chrome, Vintage Foil, etc.)
- **`template_variants`** - Individual variants (A, B, C, D) with assets
- **`render_jobs`** - Card generation requests and outputs
- **`card_analytics`** - Usage tracking and performance metrics

### **Extended Tables**
- **`teams`** - Added color fields (`primary_color`, `secondary_color`, `accent_color`, `logo_url`)
- **`users`** - Added entitlements (`free_renders_remaining`, `premium_renders_remaining`)

### **Key Views**
- **`player_card_stats`** - Aggregated player statistics for card generation

---

## 🎨 **Template System**

### **Template Structure**
```
/templates/{template_key}/{version}/{variant}/
├── background.webp          # Arena/court background
├── overlay_border.webp      # Metallic geometric borders
├── overlay_glow.webp        # Light effects and atmosphere
├── photo_mask.png           # Player photo silhouette
├── foil_map.png            # Holographic effect mask
├── light_map.png           # HDR lighting highlights
├── nameplate.svg           # Player name frame
├── statbox.svg             # Statistics container
└── manifest.json           # Coordinate and styling data
```

### **Manifest Schema**
```json
{
  "template_key": "modern_chrome",
  "variant_key": "A",
  "version": 1,
  "canvas": { "w": 1080, "h": 1920, "dpi": 144 },
  "assets": {
    "background": "background.webp",
    "overlays": ["overlay_border.webp", "overlay_glow.webp"],
    "photo_mask": "photo_mask.png",
    "foil_map": "foil_map.png",
    "nameplate_svg": "nameplate.svg",
    "statbox_svg": "statbox.svg"
  },
  "coords": {
    "photo": { "x": 120, "y": 220, "w": 840, "h": 1300, "z": 2 },
    "nameplate": { "x": 80, "y": 1640, "w": 920, "h": 140, "z": 5 },
    "primary_stats": { "x": 720, "y": 140, "w": 320, "h": 360, "z": 6 },
    "team_logo": { "x": 880, "y": 1740, "w": 140, "h": 140, "z": 6 }
  },
  "typography": {
    "nameplate": { "size": 56, "weight": 800 },
    "stats_primary": { "size": 48, "weight": 900 }
  },
  "theming": {
    "palette_slots": ["primary", "secondary", "accent"],
    "recolor_rules": [
      { "target": "overlay_border.webp", "slot": "primary", "mode": "multiply" }
    ]
  },
  "effects": { "grain": 0.12, "vignette": 0.2, "foil_intensity": 0.55 }
}
```

---

## 🤖 **AI Integration (Gemini 2.5)**

### **Template Generation Process**
1. **Admin Input**: Style, motifs, palette preferences
2. **System Prompt**: Consistent NBA-style guidelines
3. **User Prompt**: Specific style and constraint requirements
4. **Layer Generation**: Separate assets for each template layer
5. **Asset Processing**: Optimization and storage
6. **Manifest Creation**: Coordinate and styling configuration

### **Gemini Prompts**

#### **System Prompt**
```
You are a senior sports trading-card visual designer. Produce cohesive basketball card template variants sized 1080×1920. Each variant must include:

• background (arena/crowd lighting, depth)
• overlay_border (metallic/chrome geometric frame with beveled edges)  
• overlay_glow (light streaks/atmosphere)
• photo_mask (central silhouette area where the player cutout will fit)
• foil_map (grayscale mask for holographic sheen; white = max foil)
• light_map (HDR-style highlight pass)
• nameplate.svg (clean bar frame for player name/position/number)
• statbox.svg (hexagonal frame sized for 3–4 big numbers)

Keep designs original; do not use any NBA trademarks, logos, or distinctive marks.
```

#### **Style Guidelines**
- **Modern**: Clean geometric shapes, metallic chrome effects, minimalist approach
- **Vintage**: Classic basketball card aesthetics, aged textures, retro typography
- **Championship**: Premium gold accents, trophy-like elements, luxury feel
- **Neon**: Electric blue/purple neons, futuristic elements, cyberpunk aesthetics
- **Holographic**: Rainbow foil effects, prismatic elements, premium collectible feel

---

## 🔧 **API Endpoints**

### **Edge Functions**
- **`/supabase/functions/generate-template`** - AI template generation
- **`/supabase/functions/render-card`** - Card composition and rendering

### **Service Classes**
- **`TemplateService`** - Template and variant management
- **`CardCompositor`** - Runtime card generation
- **`EntitlementService`** - User quota management

### **Key Methods**
```typescript
// Template Management
TemplateService.createTemplate(data)
TemplateService.getActiveTemplates()
TemplateService.createTemplateVariant(data)
TemplateService.publishTemplateVariant(id)

// Card Generation
CardCompositor.renderCard(request)
EntitlementService.checkAndConsumeEntitlement(userId, tier)

// Manifest Handling
TemplateService.getManifest(manifestUrl)
TemplateService.validateManifest(manifest)
```

---

## 💳 **Monetization System**

### **Tier Structure**
- **Freemium**: 1 free render per user, basic templates, watermarked output
- **Premium**: Unlimited renders, advanced templates, high-res output, no watermark

### **Entitlement Management**
```sql
-- User entitlements
ALTER TABLE users ADD COLUMN free_renders_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN premium_renders_remaining INTEGER DEFAULT 0;

-- Consumption tracking
CREATE FUNCTION decrement_user_renders(user_id UUID, render_type TEXT);
```

### **Pricing Hooks**
- Stripe integration for premium subscriptions
- Promo code system for beta access
- Organizer unlimited access (future feature)

---

## 🎯 **User Interfaces**

### **Admin Template Builder** (`/admin/templates`)
- **Template Management**: Create, edit, publish template families
- **AI Generation**: Gemini 2.5 integration for asset creation
- **Layer Editor**: Toggle visibility, inspect assets
- **Coordinate Editor**: Drag-and-drop positioning system
- **Theming Controls**: Color palettes, effects, typography
- **Publishing Workflow**: Validation and activation

### **Card Studio** (`/dashboard/player/cards`) - *Coming Next*
- **Player Selection**: Auto-detect current user
- **Photo Upload**: Drag-and-drop with AI cropping
- **Template Selection**: Grid of available variants
- **Live Preview**: Real-time card generation
- **Export Options**: Multiple formats and resolutions
- **Social Sharing**: Direct integration with platforms

---

## 🔐 **Security & Access Control**

### **Role-Based Access**
- **Admin**: Full template management access
- **Player**: Card creation for own profile only
- **Organizer**: Future unlimited access for tournament players

### **RLS Policies**
```sql
-- Templates: Public read for active, admin full access
CREATE POLICY "Public read active templates" ON templates
  FOR SELECT USING (is_active = true);

-- Render Jobs: Users own jobs only
CREATE POLICY "Users own render jobs" ON render_jobs
  FOR ALL USING (player_id = auth.uid());
```

### **Content Moderation**
- No NBA trademarks in AI generation
- User photo content validation
- Automated offensive content detection

---

## 📈 **Performance Optimization**

### **Caching Strategy**
- **Template Assets**: CDN caching with long TTL
- **Rendered Cards**: Cache key based on input hash
- **Manifest Files**: In-memory caching with LRU eviction

### **Performance Targets**
- **Cold Render**: < 1200ms (first-time generation)
- **Warm Render**: < 400ms (cached assets)
- **Template Load**: < 200ms (manifest + preview)

### **Optimization Techniques**
- Asset preloading and compression
- Parallel processing for multiple layers
- Progressive image enhancement
- Background job processing for heavy operations

---

## 🚀 **Deployment Guide**

### **Environment Variables**
```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Feature Flags
NEXT_PUBLIC_CARD_GENERATION_ENABLED=true
```

### **Database Migration**
```bash
# Run schema migrations
psql -f database/migrations/001_card_generation_schema.sql
psql -f database/migrations/002_add_admin_role.sql
psql -f database/functions/decrement_user_renders.sql
```

### **Storage Setup**
```sql
-- Create storage buckets in Supabase dashboard
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('card-templates', 'card-templates', true),
  ('card-renders', 'card-renders', true),
  ('card-uploads', 'card-uploads', false);
```

### **Edge Functions Deployment**
```bash
# Deploy to Supabase
supabase functions deploy generate-template
supabase functions deploy render-card
```

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- Template service methods
- Manifest validation
- Cache key generation
- Entitlement calculations

### **Integration Tests**
- End-to-end card generation
- AI template creation workflow
- User permission validation
- Storage operations

### **Performance Tests**
- Concurrent render job handling
- Template asset loading speed
- Cache hit/miss ratios
- Memory usage under load

---

## 📊 **Analytics & Monitoring**

### **Key Metrics**
- **Generation Volume**: Cards created per day/week/month
- **Template Usage**: Most popular templates and variants
- **Performance**: Average render times and success rates
- **User Engagement**: Conversion from freemium to premium

### **Monitoring Dashboards**
- Real-time render job status
- AI generation success rates
- Storage usage and costs
- User entitlement consumption

---

## 🔮 **Future Enhancements**

### **Phase 2 Features**
- **Animated Cards**: MP4/WebM with parallax effects
- **Team Collections**: Bulk generation for entire rosters
- **Historical Cards**: Generate cards from past seasons
- **Achievement Badges**: Special designs for milestones

### **Advanced AI Features**
- **Style Transfer**: Apply team-specific visual themes
- **Dynamic Layouts**: AI-optimized positioning based on stats
- **Photo Enhancement**: AI-powered background removal and lighting
- **Personalization**: User preference-based template recommendations

### **Mobile Optimization**
- React Native card studio
- Offline generation capabilities
- Mobile-specific template variants
- Touch-optimized coordinate editor

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Template Generation Fails**
- Check Gemini API key configuration
- Verify storage bucket permissions
- Review AI generation prompts for compliance

#### **Card Rendering Errors**
- Validate manifest.json structure
- Check template asset availability
- Verify user entitlements

#### **Performance Issues**
- Monitor cache hit rates
- Check database query performance
- Review asset optimization

### **Debug Tools**
- Edge function logs in Supabase dashboard
- Database query performance analyzer
- Storage usage monitoring
- Real-time render job tracking

---

## 📞 **Support & Maintenance**

### **Monitoring Alerts**
- Failed render jobs > 5% error rate
- Template generation timeouts
- Storage quota approaching limits
- Unusual entitlement consumption patterns

### **Maintenance Tasks**
- Weekly template asset cleanup
- Monthly analytics report generation
- Quarterly performance optimization review
- Annual security audit and updates

---

## ✅ **Implementation Checklist**

### **Phase 1: Foundation** ✅
- [x] Database schema extensions
- [x] Template service implementation
- [x] Admin template builder UI
- [x] Gemini 2.5 integration
- [x] Edge functions for generation and rendering
- [x] Basic entitlement system

### **Phase 2: Card Studio** 🚧
- [ ] Player dashboard integration
- [ ] Photo upload and processing
- [ ] Template selection interface
- [ ] Real-time card preview
- [ ] Export and sharing features

### **Phase 3: Advanced Features** 📋
- [ ] Animated card variants
- [ ] Advanced AI enhancements
- [ ] Mobile optimization
- [ ] Team collection features

---

## 🎯 **Success Metrics**

### **Technical KPIs**
- **Render Success Rate**: > 99%
- **Average Render Time**: < 800ms
- **Cache Hit Rate**: > 85%
- **Template Generation Success**: > 95%

### **Business KPIs**
- **User Adoption**: 50% of active players create at least one card
- **Premium Conversion**: 15% freemium to premium upgrade rate
- **Engagement**: Average 3 cards per user per month
- **Satisfaction**: > 4.5/5 user rating

---

This implementation provides a solid foundation for the NBA-style card generation system while maintaining scalability, performance, and user experience standards. The modular architecture allows for easy extension and enhancement as the feature evolves.
