-- ============================================================================
-- MULTI-CLIPPING SYSTEM DATABASE SCHEMA - FIXED VERSION
-- ============================================================================
-- Run this in 2 parts if needed:
-- PART 1: Tables and Functions (run first)
-- PART 2: RLS Policies (run after Part 1 succeeds)
-- ============================================================================

-- ============================================================================
-- PART 1: TABLES AND FUNCTIONS
-- ============================================================================

-- TABLE 1: clip_generation_jobs
CREATE TABLE IF NOT EXISTS clip_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES game_videos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'
  )),
  total_clips INTEGER NOT NULL DEFAULT 0,
  completed_clips INTEGER NOT NULL DEFAULT 0,
  failed_clips INTEGER NOT NULL DEFAULT 0,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_clip_jobs_status ON clip_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_game ON clip_generation_jobs(game_id);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_created ON clip_generation_jobs(created_at DESC);

-- TABLE 2: generated_clips
CREATE TABLE IF NOT EXISTS generated_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES clip_generation_jobs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  stat_event_id UUID NOT NULL REFERENCES game_stats(id) ON DELETE CASCADE,
  player_id UUID REFERENCES users(id),
  custom_player_id UUID REFERENCES custom_players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  bunny_clip_url TEXT,
  bunny_storage_path TEXT,
  video_timestamp_start DECIMAL(10,3) NOT NULL,
  video_timestamp_end DECIMAL(10,3) NOT NULL,
  clip_duration_seconds DECIMAL(5,2) NOT NULL,
  quarter INTEGER NOT NULL,
  game_clock_minutes INTEGER NOT NULL,
  game_clock_seconds INTEGER NOT NULL,
  stat_type TEXT NOT NULL,
  stat_modifier TEXT,
  points_value INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'ready', 'failed'
  )),
  generation_attempts INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_at TIMESTAMPTZ,
  CONSTRAINT check_player_reference CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR
    (player_id IS NULL AND custom_player_id IS NOT NULL)
  ),
  CONSTRAINT check_clip_duration CHECK (clip_duration_seconds > 0),
  CONSTRAINT check_timestamp_order CHECK (video_timestamp_end > video_timestamp_start)
);

CREATE INDEX IF NOT EXISTS idx_clips_job ON generated_clips(job_id);
CREATE INDEX IF NOT EXISTS idx_clips_game ON generated_clips(game_id);
CREATE INDEX IF NOT EXISTS idx_clips_player ON generated_clips(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clips_custom_player ON generated_clips(custom_player_id) WHERE custom_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clips_stat_type ON generated_clips(stat_type);
CREATE INDEX IF NOT EXISTS idx_clips_status ON generated_clips(status);

-- TABLE 3: clip_purchases
CREATE TABLE IF NOT EXISTS clip_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  player_id UUID REFERENCES users(id),
  custom_player_id UUID REFERENCES custom_players(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'completed', 'failed', 'refunded'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT check_purchase_player_reference CHECK (
    (player_id IS NOT NULL AND custom_player_id IS NULL) OR
    (player_id IS NULL AND custom_player_id IS NOT NULL)
  )
);

-- Note: Can't have two UNIQUE constraints on nullable columns the same way
-- Using a partial unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_game_player 
  ON clip_purchases(user_id, game_id, player_id) 
  WHERE player_id IS NOT NULL;
  
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_game_custom_player 
  ON clip_purchases(user_id, game_id, custom_player_id) 
  WHERE custom_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_user ON clip_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_game ON clip_purchases(game_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON clip_purchases(status);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION is_clip_eligible_stat(
  p_stat_type TEXT,
  p_modifier TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_stat_type = 'field_goal' AND p_modifier = 'made' THEN RETURN TRUE; END IF;
  IF p_stat_type = 'free_throw' AND p_modifier = 'made' THEN RETURN TRUE; END IF;
  IF p_stat_type = 'rebound' THEN RETURN TRUE; END IF;
  IF p_stat_type = 'assist' THEN RETURN TRUE; END IF;
  IF p_stat_type = 'steal' THEN RETURN TRUE; END IF;
  IF p_stat_type = 'block' THEN RETURN TRUE; END IF;
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION get_clip_window(p_stat_type TEXT)
RETURNS TABLE(seconds_before DECIMAL, seconds_after DECIMAL)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN QUERY SELECT 2.0::DECIMAL, 2.0::DECIMAL;
END;
$$;

-- Trigger for updated_at
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
-- PART 2: RLS POLICIES (Run after Part 1 succeeds)
-- ============================================================================

-- Enable RLS
ALTER TABLE clip_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "clip_jobs_admin_all" ON clip_generation_jobs;
DROP POLICY IF EXISTS "clip_jobs_stat_admin_view" ON clip_generation_jobs;
DROP POLICY IF EXISTS "clips_admin_all" ON generated_clips;
DROP POLICY IF EXISTS "clips_coach_view_team" ON generated_clips;
DROP POLICY IF EXISTS "clips_player_view_purchased" ON generated_clips;
DROP POLICY IF EXISTS "clips_stat_admin_view" ON generated_clips;
DROP POLICY IF EXISTS "purchases_user_own" ON clip_purchases;
DROP POLICY IF EXISTS "purchases_admin_view" ON clip_purchases;

-- clip_generation_jobs policies
CREATE POLICY "clip_jobs_admin_all" ON clip_generation_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
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
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "clips_coach_view_team" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    generated_clips.status = 'ready'
    AND EXISTS (
      SELECT 1 FROM games g
      JOIN teams t ON (t.id = g.team_a_id OR t.id = g.team_b_id)
      WHERE g.id = generated_clips.game_id
      AND t.coach_id = auth.uid()
    )
  );

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
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clip_generation_jobs', 'generated_clips', 'clip_purchases');

