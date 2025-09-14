-- StatJam Card Generation System - Database Schema Migration
-- Date: January 3, 2025
-- Description: Adds card generation tables and extends existing tables for NBA-style card creation

-- Start transaction
BEGIN;

-- ============================================================================
-- 1. EXTEND EXISTING TABLES
-- ============================================================================

-- Extend teams table with branding support for card generation
ALTER TABLE teams ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#111827';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#999999';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#F5D36C';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add update trigger for teams table if it doesn't exist
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teams_timestamp ON teams;
CREATE TRIGGER update_teams_timestamp
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Extend users table with card generation entitlements
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_renders_remaining INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_renders_remaining INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_generation_enabled BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 2. CREATE NEW CARD GENERATION TABLES
-- ============================================================================

-- Templates table - stores template families (Modern Chrome, Vintage Foil, etc.)
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

-- Template variants table - stores individual variants (A, B, C, D for each template)
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

-- Render jobs table - tracks card generation requests and outputs
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
  completed_at TIMESTAMPTZ
);

-- Card analytics table - track usage and performance
CREATE TABLE IF NOT EXISTS card_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  render_job_id UUID REFERENCES render_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('generated', 'downloaded', 'shared', 'viewed')),
  user_id UUID REFERENCES users(id),
  template_variant_id UUID REFERENCES template_variants(id),
  tier TEXT CHECK (tier IN ('freemium', 'premium')),
  metadata JSONB,                    -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Render jobs indexes
CREATE INDEX IF NOT EXISTS idx_render_jobs_player_id ON render_jobs(player_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_cache_key ON render_jobs(cache_key);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_render_jobs_composite ON render_jobs(player_id, template_variant_id, tier, status);

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_template_variants_active ON template_variants(template_id, is_active, is_premium);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active, style);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_card_analytics_event_type ON card_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_card_analytics_user_id ON card_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_card_analytics_created_at ON card_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_card_analytics_reporting ON card_analytics(event_type, created_at, template_variant_id);

-- Teams indexes for card generation
CREATE INDEX IF NOT EXISTS idx_teams_tournament_colors ON teams(tournament_id, primary_color, secondary_color);

-- ============================================================================
-- 4. CREATE AGGREGATED PLAYER STATS VIEW
-- ============================================================================

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

-- ============================================================================
-- 5. SETUP ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_analytics ENABLE ROW LEVEL SECURITY;

-- Templates & Template Variants - Public read for active, admin full access
CREATE POLICY "Public read active templates" ON templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active template variants" ON template_variants
  FOR SELECT USING (is_active = true);

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

-- Render Jobs - Users own jobs, service role full access
CREATE POLICY "Users own render jobs" ON render_jobs
  FOR ALL USING (player_id = auth.uid());

CREATE POLICY "Service role full access render jobs" ON render_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Card Analytics - Users own analytics, service role insert, admin view all
CREATE POLICY "Users own analytics" ON card_analytics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role insert analytics" ON card_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin view all analytics" ON card_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 6. INSERT SEED DATA (INITIAL TEMPLATES)
-- ============================================================================

-- Insert initial template families
INSERT INTO templates (template_key, style, display_name, description, is_active) VALUES
  ('modern_chrome', 'modern', 'Modern Chrome', 'Sleek metallic design with chrome effects and geometric borders', true),
  ('vintage_foil', 'vintage', 'Vintage Foil', 'Classic basketball card style with holographic foil accents', true),
  ('championship_gold', 'championship', 'Championship Gold', 'Premium gold design for tournament champions', true),
  ('neon_night', 'neon', 'Neon Night', 'Futuristic neon-lit design with electric blue accents', true),
  ('clean_geometric', 'modern', 'Clean Geometric', 'Minimalist design with clean lines and subtle effects', true)
ON CONFLICT (template_key) DO NOTHING;

-- Note: Template variants will be added through the admin interface
-- as they require actual asset files and manifest.json

-- ============================================================================
-- 7. SETUP STORAGE BUCKETS (Run separately in Supabase dashboard)
-- ============================================================================

-- These need to be run in the Supabase dashboard SQL editor:
/*
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('card-templates', 'card-templates', true),
  ('card-renders', 'card-renders', true),
  ('card-uploads', 'card-uploads', false)
ON CONFLICT (id) DO NOTHING;

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
*/

-- Commit all changes
COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration success
DO $$
BEGIN
  -- Check if all tables exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'templates') THEN
    RAISE EXCEPTION 'Migration failed: templates table not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'template_variants') THEN
    RAISE EXCEPTION 'Migration failed: template_variants table not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'render_jobs') THEN
    RAISE EXCEPTION 'Migration failed: render_jobs table not created';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'card_analytics') THEN
    RAISE EXCEPTION 'Migration failed: card_analytics table not created';
  END IF;
  
  -- Check if columns were added to existing tables
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'primary_color') THEN
    RAISE EXCEPTION 'Migration failed: teams.primary_color column not added';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'free_renders_remaining') THEN
    RAISE EXCEPTION 'Migration failed: users.free_renders_remaining column not added';
  END IF;
  
  RAISE NOTICE 'Card Generation Schema Migration completed successfully!';
END $$;
