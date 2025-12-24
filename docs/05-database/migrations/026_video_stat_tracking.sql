-- =============================================================================
-- Migration 026: Video Stat Tracking
-- =============================================================================
-- Purpose: Add video upload, clock sync, and clip generation support
-- Feature: Video-based stat tracking for Stat Admins
-- =============================================================================

-- =============================================================================
-- GAME VIDEOS TABLE
-- =============================================================================
-- Links uploaded videos to games, stores sync calibration

CREATE TABLE IF NOT EXISTS game_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Bunny.net identifiers
  bunny_library_id TEXT NOT NULL,
  bunny_video_id TEXT NOT NULL,
  
  -- Video metadata
  original_filename TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  
  -- Upload status
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN (
    'uploading',    -- Upload in progress
    'processing',   -- Bunny.net processing
    'ready',        -- Ready for stat tracking
    'failed'        -- Upload/processing failed
  )),
  error_message TEXT,
  
  -- Clock sync calibration
  jumpball_timestamp_ms INTEGER,        -- Video ms when jumpball occurs (Q1 start)
  halftime_timestamp_ms INTEGER,        -- Video ms when halftime starts (optional)
  quarter_length_minutes INTEGER DEFAULT 12 CHECK (quarter_length_minutes IN (8, 10, 12)),
  
  -- Quarter transition markers (for precise sync)
  q2_start_timestamp_ms INTEGER,        -- Video ms when Q2 starts
  q3_start_timestamp_ms INTEGER,        -- Video ms when Q3 starts
  q4_start_timestamp_ms INTEGER,        -- Video ms when Q4 starts
  ot1_start_timestamp_ms INTEGER,       -- Video ms when OT1 starts (if applicable)
  ot2_start_timestamp_ms INTEGER,       -- Video ms when OT2 starts (if applicable)
  ot3_start_timestamp_ms INTEGER,       -- Video ms when OT3 starts (if applicable)
  
  -- Tracking metadata
  is_calibrated BOOLEAN DEFAULT FALSE,
  stats_count INTEGER DEFAULT 0,
  
  -- Audit
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One video per game
  UNIQUE(game_id)
);

-- =============================================================================
-- VIDEO TIMESTAMP ON GAME_STATS
-- =============================================================================
-- Add video timestamp to existing game_stats table

ALTER TABLE game_stats 
ADD COLUMN IF NOT EXISTS video_timestamp_ms INTEGER DEFAULT NULL;

-- Index for querying stats by video timestamp
CREATE INDEX IF NOT EXISTS idx_game_stats_video_timestamp 
ON game_stats(game_id, video_timestamp_ms) 
WHERE video_timestamp_ms IS NOT NULL;

-- =============================================================================
-- CLIP CONFIGURATION TABLE
-- =============================================================================
-- Per-game clip generation settings

CREATE TABLE IF NOT EXISTS clip_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Clip window (±3 seconds default, configurable)
  clip_before_ms INTEGER DEFAULT 3000 CHECK (clip_before_ms >= 1000 AND clip_before_ms <= 10000),
  clip_after_ms INTEGER DEFAULT 3000 CHECK (clip_after_ms >= 1000 AND clip_after_ms <= 10000),
  
  -- Which stat types generate clips
  generate_made_fg BOOLEAN DEFAULT TRUE,       -- Made field goals
  generate_made_3pt BOOLEAN DEFAULT TRUE,      -- Made 3-pointers
  generate_made_ft BOOLEAN DEFAULT TRUE,       -- Made free throws
  generate_assists BOOLEAN DEFAULT TRUE,
  generate_blocks BOOLEAN DEFAULT TRUE,
  generate_steals BOOLEAN DEFAULT TRUE,
  generate_dunks BOOLEAN DEFAULT FALSE,        -- Future enhancement
  
  -- Processing settings
  output_resolution TEXT DEFAULT '720p' CHECK (output_resolution IN ('480p', '720p', '1080p', 'source')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_id)
);

-- =============================================================================
-- GENERATED CLIPS TABLE
-- =============================================================================
-- Individual clip records with Bunny.net references

CREATE TABLE IF NOT EXISTS generated_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_stat_id UUID REFERENCES game_stats(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  
  -- Player info (denormalized for quick access)
  player_id UUID REFERENCES users(id),
  custom_player_id UUID REFERENCES custom_players(id),
  team_id UUID REFERENCES teams(id),
  stat_type TEXT NOT NULL,
  modifier TEXT,
  
  -- Bunny.net clip info
  bunny_clip_id TEXT,
  bunny_clip_url TEXT,
  thumbnail_url TEXT,
  
  -- Clip timing (from video)
  start_timestamp_ms INTEGER NOT NULL,
  end_timestamp_ms INTEGER NOT NULL,
  duration_ms INTEGER GENERATED ALWAYS AS (end_timestamp_ms - start_timestamp_ms) STORED,
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting generation
    'processing',   -- Being generated
    'ready',        -- Available for streaming
    'failed',       -- Generation failed
    'skipped'       -- Intentionally skipped (e.g., missed shot)
  )),
  error_message TEXT,
  
  -- Preview system (architecture-ready)
  is_preview_clip BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CLIP GENERATION JOBS TABLE
-- =============================================================================
-- Job queue for batch clip generation

CREATE TABLE IF NOT EXISTS clip_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_video_id UUID REFERENCES game_videos(id) ON DELETE CASCADE,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued',       -- Waiting to start
    'processing',   -- Currently generating clips
    'completed',    -- All clips generated
    'failed',       -- Job failed
    'cancelled'     -- Manually cancelled
  )),
  
  -- Progress tracking
  total_clips INTEGER DEFAULT 0,
  completed_clips INTEGER DEFAULT 0,
  failed_clips INTEGER DEFAULT 0,
  skipped_clips INTEGER DEFAULT 0,
  
  -- Processing info
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Who triggered
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_game_videos_game_id ON game_videos(game_id);
CREATE INDEX IF NOT EXISTS idx_game_videos_status ON game_videos(status);
CREATE INDEX IF NOT EXISTS idx_clip_configs_game_id ON clip_configs(game_id);
CREATE INDEX IF NOT EXISTS idx_generated_clips_game ON generated_clips(game_id, status);
CREATE INDEX IF NOT EXISTS idx_generated_clips_player ON generated_clips(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generated_clips_custom_player ON generated_clips(custom_player_id) WHERE custom_player_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generated_clips_stat ON generated_clips(game_stat_id);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_status ON clip_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_clip_jobs_game ON clip_generation_jobs(game_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE game_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Game Videos: Stat admins can manage videos for their assigned games
-- (stat_admin_id is stored directly on games table)
CREATE POLICY "game_videos_stat_admin_all" ON game_videos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = game_videos.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Game Videos: Organizers can manage videos for their tournaments
CREATE POLICY "game_videos_organizer_all" ON game_videos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE g.id = game_videos.game_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- Clip Configs: Stat admin access
CREATE POLICY "clip_configs_stat_admin_all" ON clip_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = clip_configs.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Clip Configs: Organizer access
CREATE POLICY "clip_configs_organizer_all" ON clip_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE g.id = clip_configs.game_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- Generated Clips: Read access for coaches
CREATE POLICY "generated_clips_read_coach" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = generated_clips.team_id 
      AND t.coach_id = auth.uid()
    )
  );

-- Generated Clips: Read access for players (their own clips)
CREATE POLICY "generated_clips_read_player" ON generated_clips
  FOR SELECT TO authenticated
  USING (
    generated_clips.player_id = auth.uid()
  );

-- Generated Clips: Full access for stat admins
CREATE POLICY "generated_clips_stat_admin_all" ON generated_clips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = generated_clips.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Generated Clips: Full access for organizers
CREATE POLICY "generated_clips_organizer_all" ON generated_clips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE g.id = generated_clips.game_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- Clip Jobs: Stat admin access
CREATE POLICY "clip_jobs_stat_admin_all" ON clip_generation_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      WHERE g.id = clip_generation_jobs.game_id 
      AND g.stat_admin_id = auth.uid()
    )
  );

-- Clip Jobs: Organizer access
CREATE POLICY "clip_jobs_organizer_all" ON clip_generation_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g
      JOIN tournaments t ON t.id = g.tournament_id
      WHERE g.id = clip_generation_jobs.game_id 
      AND t.organizer_id = auth.uid()
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE game_videos IS 'Uploaded game videos with clock sync calibration';
COMMENT ON TABLE clip_configs IS 'Per-game clip generation settings';
COMMENT ON TABLE generated_clips IS 'Individual clip records with streaming URLs';
COMMENT ON TABLE clip_generation_jobs IS 'Batch clip generation job queue';

COMMENT ON COLUMN game_videos.jumpball_timestamp_ms IS 'Video milliseconds when Q1 jumpball occurs';
COMMENT ON COLUMN game_videos.halftime_timestamp_ms IS 'Video milliseconds when halftime starts';
COMMENT ON COLUMN game_stats.video_timestamp_ms IS 'Video milliseconds when stat occurred';
COMMENT ON COLUMN clip_configs.clip_before_ms IS 'Milliseconds before stat to include in clip';
COMMENT ON COLUMN clip_configs.clip_after_ms IS 'Milliseconds after stat to include in clip';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 026: Video Stat Tracking tables created successfully';
  RAISE NOTICE '  - game_videos: Video uploads with clock sync';
  RAISE NOTICE '  - clip_configs: Per-game clip settings';
  RAISE NOTICE '  - generated_clips: Individual clip records';
  RAISE NOTICE '  - clip_generation_jobs: Batch processing queue';
  RAISE NOTICE '  - game_stats.video_timestamp_ms: Added to existing table';
END $$;

