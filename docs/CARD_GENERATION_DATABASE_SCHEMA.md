# StatJam Card Generation - Database Schema Extensions

## Overview
This document outlines the database schema extensions required for the NBA-style card generation feature. The schema extends existing STATJAM tables and adds new card-specific tables while maintaining full compatibility with the existing system.

## Date
- **Created**: January 3, 2025
- **Status**: Implementation Ready

---

## 🔄 **Existing Table Extensions**

### Teams Table Extension
The existing `teams` table needs color and branding support for card generation:

```sql
-- Add team branding fields to existing teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#111827';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#999999';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#F5D36C';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add update trigger for teams table
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_timestamp
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### User Entitlements Extension
Add card generation entitlements to existing users:

```sql
-- Add card generation entitlements to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_renders_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_renders_remaining INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_generation_enabled BOOLEAN DEFAULT TRUE;
```

---

## 🆕 **New Card Generation Tables**

### Templates Table
Stores template families (Modern Chrome, Vintage Foil, etc.):

```sql
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL, -- 'modern_chrome', 'vintage_foil', etc.
  style TEXT NOT NULL,               -- 'modern' | 'vintage' | 'championship' | 'neon'
  display_name TEXT NOT NULL,        -- 'Modern Chrome'
  description TEXT,                  -- 'Sleek metallic design with chrome effects'
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_templates_timestamp
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Template Variants Table
Stores individual template variants (A, B, C, D for each template):

```sql
CREATE TABLE IF NOT EXISTS template_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  variant_key TEXT NOT NULL,         -- 'A' | 'B' | 'C' | 'D'
  display_name TEXT NOT NULL,        -- 'Chrome Variant A'
  manifest_url TEXT NOT NULL,        -- URL to manifest.json
  preview_url TEXT,                  -- Small preview image URL
  is_premium BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, variant_key)
);

CREATE TRIGGER update_template_variants_timestamp
    BEFORE UPDATE ON template_variants
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### Render Jobs Table
Tracks card generation requests and outputs:

```sql
CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stats_context TEXT NOT NULL,       -- e.g., 'Summer League 2025'
  template_variant_id UUID REFERENCES template_variants(id),
  tier TEXT NOT NULL CHECK (tier IN ('freemium', 'premium')),
  
  -- Input data (for cache key generation)
  input_photo_url TEXT NOT NULL,
  input_stats JSONB NOT NULL,        -- {ppg: 22.4, rpg: 6.1, apg: 4.3, etc.}
  input_team_data JSONB NOT NULL,    -- {name, colors, logo_url}
  
  -- Processing metadata
  cache_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'success', 'failed')),
  cost_usd_estimate NUMERIC(10,4),
  processing_time_ms INTEGER,
  
  -- Output URLs
  output_web_url TEXT,               -- 1080x1920 web version
  output_hires_url TEXT,             -- 2160x3840 premium version
  output_thumb_url TEXT,             -- 512x512 thumbnail
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes for performance
  INDEX idx_render_jobs_player_id (player_id),
  INDEX idx_render_jobs_cache_key (cache_key),
  INDEX idx_render_jobs_status (status),
  INDEX idx_render_jobs_created_at (created_at)
);
```

### Card Analytics Table
Track card generation usage and performance:

```sql
CREATE TABLE IF NOT EXISTS card_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_job_id UUID REFERENCES render_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('generated', 'downloaded', 'shared', 'viewed')),
  user_id UUID REFERENCES users(id),
  template_variant_id UUID REFERENCES template_variants(id),
  tier TEXT CHECK (tier IN ('freemium', 'premium')),
  metadata JSONB,                    -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_card_analytics_event_type (event_type),
  INDEX idx_card_analytics_user_id (user_id),
  INDEX idx_card_analytics_created_at (created_at)
);
```

---

## 🔐 **Row Level Security (RLS) Policies**

### Templates & Template Variants
```sql
-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variants ENABLE ROW LEVEL SECURITY;

-- Public read access for active templates
CREATE POLICY "Public read active templates" ON templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active template variants" ON template_variants
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access templates" ON templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin full access template variants" ON template_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### Render Jobs
```sql
-- Enable RLS
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own render jobs
CREATE POLICY "Users own render jobs" ON render_jobs
  FOR ALL USING (player_id = auth.uid());

-- Service role can access all (for background processing)
CREATE POLICY "Service role full access render jobs" ON render_jobs
  FOR ALL USING (auth.role() = 'service_role');
```

### Card Analytics
```sql
-- Enable RLS
ALTER TABLE card_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analytics
CREATE POLICY "Users own analytics" ON card_analytics
  FOR SELECT USING (user_id = auth.uid());

-- Service role can insert analytics
CREATE POLICY "Service role insert analytics" ON card_analytics
  FOR INSERT WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admin view all analytics" ON card_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

---

## 📊 **Aggregated Player Stats View**

Create a view to easily access aggregated player statistics for card generation:

```sql
CREATE OR REPLACE VIEW player_card_stats AS
SELECT 
  s.player_id,
  u.email as player_email,
  CONCAT(u.email) as player_name, -- Using email as name for now
  g.tournament_id,
  t.name as tournament_name,
  
  -- Aggregated stats
  ROUND(AVG(
    COALESCE((s.points_made->>'2')::numeric, 0) * 2 + 
    COALESCE((s.points_made->>'3')::numeric, 0) * 3 + 
    COALESCE((s.points_made->>'1')::numeric, 0) * 1
  ), 1) as ppg,
  
  ROUND(AVG(
    COALESCE((s.rebounds->>'offensive')::numeric, 0) + 
    COALESCE((s.rebounds->>'defensive')::numeric, 0)
  ), 1) as rpg,
  
  ROUND(AVG(COALESCE(s.assists, 0)), 1) as apg,
  ROUND(AVG(COALESCE(s.steals, 0)), 1) as spg,
  ROUND(AVG(COALESCE(s.blocks, 0)), 1) as bpg,
  
  -- Context for card
  CONCAT(t.name, ' ', EXTRACT(YEAR FROM g.start_time)) as stats_context,
  
  COUNT(*) as games_played,
  MAX(g.start_time) as last_game_date
  
FROM stats s
JOIN games g ON s.game_id = g.id
JOIN tournaments t ON g.tournament_id = t.id
JOIN users u ON s.player_id = u.id
WHERE g.status = 'completed'
GROUP BY s.player_id, u.email, g.tournament_id, t.name
HAVING COUNT(*) >= 1; -- At least 1 game played
```

---

## 🗂️ **Storage Bucket Structure**

### Supabase Storage Buckets
```sql
-- Create storage buckets for card generation assets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('card-templates', 'card-templates', true),
  ('card-renders', 'card-renders', true),
  ('card-uploads', 'card-uploads', false);

-- Storage policies for card templates (public read)
CREATE POLICY "Public read card templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'card-templates');

CREATE POLICY "Admin upload card templates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'card-templates' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Storage policies for card renders (user access)
CREATE POLICY "Users read own card renders" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'card-renders' AND
    (owner = auth.uid() OR bucket_id = 'card-renders')
  );

-- Storage policies for card uploads (user uploads)
CREATE POLICY "Users upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'card-uploads' AND
    owner = auth.uid()
  );
```

---

## 📈 **Performance Indexes**

```sql
-- Additional indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament_colors ON teams(tournament_id, primary_color, secondary_color);
CREATE INDEX IF NOT EXISTS idx_render_jobs_composite ON render_jobs(player_id, template_variant_id, tier, status);
CREATE INDEX IF NOT EXISTS idx_template_variants_active ON template_variants(template_id, is_active, is_premium);
CREATE INDEX IF NOT EXISTS idx_card_analytics_reporting ON card_analytics(event_type, created_at, template_variant_id);
```

---

## 🔄 **Migration Script**

Complete migration script to run all changes:

```sql
-- Run all schema extensions in a transaction
BEGIN;

-- 1. Extend existing tables
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#111827';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#999999';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#F5D36C';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE users ADD COLUMN IF NOT EXISTS free_renders_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_renders_remaining INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_generation_enabled BOOLEAN DEFAULT TRUE;

-- 2. Create new tables
-- (Insert all CREATE TABLE statements from above)

-- 3. Create RLS policies
-- (Insert all RLS policies from above)

-- 4. Create storage buckets and policies
-- (Insert storage setup from above)

-- 5. Create performance indexes
-- (Insert all indexes from above)

COMMIT;
```

---

## ✅ **Validation Checklist**

- [ ] All existing STATJAM functionality remains intact
- [ ] New tables follow existing naming conventions
- [ ] RLS policies properly secure data access
- [ ] Storage buckets configured with appropriate permissions
- [ ] Performance indexes created for expected query patterns
- [ ] Migration script tested on development environment
- [ ] Rollback plan prepared for production deployment

---

## 🚀 **Next Steps**

1. **Review & Approve Schema** - Validate all extensions with existing system
2. **Run Migration** - Execute schema changes on development environment
3. **Build Template Admin Interface** - Create UI for template management
4. **Implement Compositor Engine** - Build card generation backend
5. **Create Card Studio UI** - Build player-facing card creation interface

This schema provides a solid foundation for the card generation system while maintaining full compatibility with existing STATJAM functionality.
