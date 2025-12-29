-- ============================================================================
-- MULTI-CLIPPING SYSTEM DATABASE SCHEMA
-- ============================================================================
-- Purpose: Enable automatic clip generation from video-tracked stats
-- Version: 1.0.0
-- Date: December 28, 2025
-- ============================================================================

-- ============================================================================
-- TABLE 1: clip_generation_jobs
-- ============================================================================
-- Tracks overall clip generation jobs per game
-- One job = one game's worth of clips

CREATE TABLE IF NOT EXISTS clip_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES game_videos(id) ON DELETE CASCADE,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting QC approval
    'approved',     -- QC approved, ready to process
    'processing',   -- Currently generating clips
    'completed',    -- All clips generated successfully
    'failed',       -- Job failed (catastrophic error)
    'cancelled'     -- Job cancelled by admin
  )),
  
  -- Progress tracking
  total_clips INTEGER NOT NULL DEFAULT 0,
  completed_clips INTEGER NOT NULL DEFAULT 0,
  failed_clips INTEGER NOT NULL DEFAULT 0,
  
  -- Timing
  approved_at TIMESTAMPTZ,           -- When QC approved
  started_at TIMESTAMPTZ,            -- When processing began
  completed_at TIMESTAMPTZ,          -- When all clips done
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Audit
  approved_by UUID REFERENCES users(id),  -- Admin who approved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(game_id, video_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_clip_jobs_status ON clip_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_game ON clip_generation_jobs(game_id);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_created ON clip_generation_jobs(created_at DESC);

-- ============================================================================
-- TABLE 2: generated_clips
-- ============================================================================
-- Individual clips generated from stat events

CREATE TABLE IF NOT EXISTS generated_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES clip_generation_jobs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  stat_event_id UUID NOT NULL REFERENCES game_stats(id) ON DELETE CASCADE,
  
  -- Player reference (one or the other, not both)
  player_id UUID REFERENCES users(id),
  custom_player_id UUID REFERENCES custom_players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  
  -- Clip storage
  bunny_clip_url TEXT,
  bunny_storage_path TEXT,
  
  -- Timing data (in seconds)
  video_timestamp_start DECIMAL(10,3) NOT NULL,  -- Start of clip in video
  video_timestamp_end DECIMAL(10,3) NOT NULL,    -- End of clip in video
  clip_duration_seconds DECIMAL(5,2) NOT NULL,   -- Duration of clip
  
  -- Game context
  quarter INTEGER NOT NULL,
  game_clock_minutes INTEGER NOT NULL,
  game_clock_seconds INTEGER NOT NULL,
  
  -- Categorization
  stat_type TEXT NOT NULL,      -- 'field_goal', 'rebound', 'assist', 'steal', 'block'
  stat_modifier TEXT,           -- 'made', 'offensive', 'defensive', etc.
  points_value INTEGER,         -- 2 or 3 for made shots, NULL otherwise
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Queued for generation
    'processing',   -- Currently being generated
    'ready',        -- Clip available for viewing
    'failed'        -- Generation failed
  )),
  generation_attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at TIMESTAMPTZ,     -- When clip was successfully generated
  
  -- Constraints
  CONSTRAINT check_player_reference CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR
    (player_id IS NULL AND custom_player_id IS NOT NULL)
  ),
  CONSTRAINT check_clip_duration CHECK (clip_duration_seconds > 0),
  CONSTRAINT check_timestamp_order CHECK (video_timestamp_end > video_timestamp_start)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_clips_job ON generated_clips(job_id);
CREATE INDEX IF NOT EXISTS idx_clips_game ON generated_clips(game_id);
CREATE INDEX IF NOT EXISTS idx_clips_player ON generated_clips(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clips_custom_player ON generated_clips(custom_player_id) WHERE custom_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clips_stat_type ON generated_clips(stat_type);
CREATE INDEX IF NOT EXISTS idx_clips_status ON generated_clips(status);

-- ============================================================================
-- TABLE 3: clip_purchases
-- ============================================================================
-- Track player purchases of clip packages

CREATE TABLE IF NOT EXISTS clip_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  
  -- Player reference (which player's clips were purchased)
  player_id UUID REFERENCES users(id),
  custom_player_id UUID REFERENCES custom_players(id),
  
  -- Purchase details
  amount_cents INTEGER NOT NULL,        -- Price in cents (e.g., 500 = $5.00)
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Stripe integration (nullable for Phase 1)
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Checkout started
    'completed',    -- Payment successful
    'failed',       -- Payment failed
    'refunded'      -- Payment refunded
  )),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT check_purchase_player_reference CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR
    (player_id IS NULL AND custom_player_id IS NOT NULL)
  ),
  UNIQUE(user_id, game_id, player_id),
  UNIQUE(user_id, game_id, custom_player_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user ON clip_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_game ON clip_purchases(game_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON clip_purchases(status);

-- ============================================================================
-- HELPER FUNCTION: Check if stat type is clip-eligible
-- ============================================================================
-- Returns TRUE for stat types that generate clips

CREATE OR REPLACE FUNCTION is_clip_eligible_stat(
  p_stat_type TEXT,
  p_modifier TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Clip-eligible stats:
  -- ✅ Made shots (field_goal + made)
  -- ✅ Free throws made
  -- ✅ Rebounds (offensive and defensive)
  -- ✅ Assists
  -- ✅ Steals
  -- ✅ Blocks
  -- ❌ Missed shots
  -- ❌ Turnovers
  -- ❌ Fouls
  
  IF p_stat_type = 'field_goal' AND p_modifier = 'made' THEN
    RETURN TRUE;
  ELSIF p_stat_type = 'free_throw' AND p_modifier = 'made' THEN
    RETURN TRUE;
  ELSIF p_stat_type = 'rebound' THEN
    RETURN TRUE;
  ELSIF p_stat_type = 'assist' THEN
    RETURN TRUE;
  ELSIF p_stat_type = 'steal' THEN
    RETURN TRUE;
  ELSIF p_stat_type = 'block' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Get clip window for stat type
-- ============================================================================
-- Returns clip window in seconds (before, after)
-- Phase 1: Fixed ±2 seconds for all types

CREATE OR REPLACE FUNCTION get_clip_window(p_stat_type TEXT)
RETURNS TABLE(seconds_before DECIMAL, seconds_after DECIMAL)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Phase 1: All stats use ±2 second window (5 seconds total)
  -- Phase 2: Will have stat-type specific windows
  RETURN QUERY SELECT 2.0::DECIMAL, 2.0::DECIMAL;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE clip_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clip_jobs_admin_all" ON clip_generation_jobs;
DROP POLICY IF EXISTS "clip_jobs_stat_admin_view" ON clip_generation_jobs;
DROP POLICY IF EXISTS "clips_admin_all" ON generated_clips;
DROP POLICY IF EXISTS "clips_coach_view_team" ON generated_clips;
DROP POLICY IF EXISTS "clips_player_view_purchased" ON generated_clips;
DROP POLICY IF EXISTS "purchases_user_own" ON clip_purchases;
DROP POLICY IF EXISTS "purchases_admin_view" ON clip_purchases;

-- clip_generation_jobs policies
CREATE POLICY "clip_jobs_admin_all" ON clip_generation_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "clip_jobs_stat_admin_view" ON clip_generation_jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_videos gv
      WHERE gv.id = clip_generation_jobs.video_id
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- generated_clips policies
CREATE POLICY "clips_admin_all" ON generated_clips
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Coaches can view clips for their team's games
CREATE POLICY "clips_coach_view_team" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN teams t ON (t.id = g.team_a_id OR t.id = g.team_b_id)
      WHERE g.id = generated_clips.game_id
      AND t.coach_id = auth.uid()
      AND generated_clips.status = 'ready'
    )
  );

-- Players can view clips they've purchased
CREATE POLICY "clips_player_view_purchased" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clip_purchases cp
      WHERE cp.game_id = generated_clips.game_id
      AND cp.user_id = auth.uid()
      AND cp.status = 'completed'
      AND (
        (cp.player_id IS NOT NULL AND cp.player_id = generated_clips.player_id) OR
        (cp.custom_player_id IS NOT NULL AND cp.custom_player_id = generated_clips.custom_player_id)
      )
    )
  );

-- Stat admins can view clips for their assigned videos
CREATE POLICY "clips_stat_admin_view" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clip_generation_jobs cj
      JOIN game_videos gv ON gv.id = cj.video_id
      WHERE cj.id = generated_clips.job_id
      AND gv.assigned_stat_admin_id = auth.uid()
    )
  );

-- clip_purchases policies
CREATE POLICY "purchases_user_own" ON clip_purchases
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "purchases_admin_view" ON clip_purchases
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on clip_generation_jobs
CREATE OR REPLACE FUNCTION update_clip_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clip_job_updated_at ON clip_generation_jobs;
CREATE TRIGGER clip_job_updated_at
  BEFORE UPDATE ON clip_generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_clip_job_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clip_generation_jobs', 'generated_clips', 'clip_purchases');

-- Verify functions created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_clip_eligible_stat', 'get_clip_window');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Phase 1 Implementation:
-- - Fixed ±2 second clip window for all stat types
-- - Clips only for: made shots, FT made, rebounds, assists, steals, blocks
-- - No missed shots, turnovers, or fouls
--
-- Phase 2 Enhancements:
-- - Stat-type specific clip windows
-- - Manual clip time adjustment
-- - Clip trimming UI
--
-- Backend Worker Integration:
-- - Railway backend calls Supabase to update job/clip status
-- - Uses service role key for direct database access
-- - Webhook triggers from Supabase when job is approved
--
-- ============================================================================

