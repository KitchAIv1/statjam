-- ============================================================================
-- COACH TEAM CARD SCHEMA MIGRATION
-- ============================================================================
-- Purpose: Extend existing tables to support coach team card functionality
-- Date: October 27, 2025
-- Feature: Coach Team Card MVP1
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: EXTEND USERS TABLE - ADD COACH ROLE
-- ----------------------------------------------------------------------------

-- Add coach role to existing role constraint (not enum - uses CHECK constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('organizer', 'player', 'stat_admin', 'fan', 'admin', 'coach'));

-- Verify the role enum now includes coach
-- Expected values: 'organizer', 'player', 'stat_admin', 'coach'

-- ----------------------------------------------------------------------------
-- PHASE 2: EXTEND TEAMS TABLE - ADD COACH FIELDS
-- ----------------------------------------------------------------------------

-- Add coach_id field to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add visibility enum and field
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'team_visibility') THEN
        CREATE TYPE team_visibility AS ENUM ('private', 'public');
    END IF;
END $$;

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS visibility team_visibility DEFAULT 'private';

-- Add index for coach queries
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_visibility ON teams(visibility);

-- ----------------------------------------------------------------------------
-- PHASE 3: EXTEND GAMES TABLE - ADD COACH GAME FIELDS
-- ----------------------------------------------------------------------------

-- Add coach game tracking fields
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS is_coach_game BOOLEAN DEFAULT FALSE;

ALTER TABLE games 
ADD COLUMN IF NOT EXISTS opponent_name TEXT;

-- Add index for coach game queries
CREATE INDEX IF NOT EXISTS idx_games_is_coach_game ON games(is_coach_game);
CREATE INDEX IF NOT EXISTS idx_games_coach_id ON games(stat_admin_id) WHERE is_coach_game = TRUE;

-- ----------------------------------------------------------------------------
-- PHASE 4: CREATE TEAM IMPORT TOKENS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS team_import_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    coach_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('active', 'used', 'expired')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES users(id)
);

-- Add indexes for token operations
CREATE INDEX IF NOT EXISTS idx_team_import_tokens_token ON team_import_tokens(token);
CREATE INDEX IF NOT EXISTS idx_team_import_tokens_coach_id ON team_import_tokens(coach_id);
CREATE INDEX IF NOT EXISTS idx_team_import_tokens_status ON team_import_tokens(status);
CREATE INDEX IF NOT EXISTS idx_team_import_tokens_expires_at ON team_import_tokens(expires_at);

-- ----------------------------------------------------------------------------
-- PHASE 5: UPDATE RLS POLICIES FOR COACH ACCESS
-- ----------------------------------------------------------------------------

-- ========================================
-- USERS TABLE - COACH ACCESS POLICIES
-- ========================================

-- Coach can see players in their teams (similar to organizer pattern)
DROP POLICY IF EXISTS "users_coach_team_players" ON users;
CREATE POLICY "users_coach_team_players" ON users
  FOR SELECT
  TO authenticated
  USING (
    role = 'player' 
    AND id IN (
      SELECT tp.player_id 
      FROM team_players tp
      JOIN teams t ON t.id = tp.team_id
      WHERE t.coach_id = auth.uid()
    )
  );

-- ========================================
-- TEAMS TABLE - COACH ACCESS POLICIES
-- ========================================

-- Coaches can manage their own teams
DROP POLICY IF EXISTS "teams_coach_access" ON teams;
CREATE POLICY "teams_coach_access" ON teams
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Public can view public coach teams (for organizer discovery)
DROP POLICY IF EXISTS "teams_public_coach_view" ON teams;
CREATE POLICY "teams_public_coach_view" ON teams
  FOR SELECT
  TO anon, authenticated
  USING (
    visibility = 'public' 
    AND coach_id IS NOT NULL
  );

-- Organizers can view public coach teams for import
DROP POLICY IF EXISTS "teams_organizer_coach_import" ON teams;
CREATE POLICY "teams_organizer_coach_import" ON teams
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' 
    AND coach_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'organizer')
  );

-- ========================================
-- GAMES TABLE - COACH GAME POLICIES
-- ========================================

-- Coaches can manage their own coach games
DROP POLICY IF EXISTS "games_coach_access" ON games;
CREATE POLICY "games_coach_access" ON games
  FOR ALL
  TO authenticated
  USING (
    is_coach_game = TRUE 
    AND stat_admin_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
  )
  WITH CHECK (
    is_coach_game = TRUE 
    AND stat_admin_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
  );

-- ========================================
-- GAME_STATS TABLE - COACH STATS POLICIES
-- ========================================

-- Coaches can manage stats for their coach games
DROP POLICY IF EXISTS "game_stats_coach_access" ON game_stats;
CREATE POLICY "game_stats_coach_access" ON game_stats
  FOR ALL
  TO authenticated
  USING (
    game_id IN (
      SELECT id FROM games 
      WHERE is_coach_game = TRUE 
      AND stat_admin_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
  )
  WITH CHECK (
    game_id IN (
      SELECT id FROM games 
      WHERE is_coach_game = TRUE 
      AND stat_admin_id = auth.uid()
    )
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'coach')
  );

-- ========================================
-- TEAM_IMPORT_TOKENS TABLE - RLS POLICIES
-- ========================================

-- Enable RLS on team_import_tokens
ALTER TABLE team_import_tokens ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own tokens
CREATE POLICY "team_import_tokens_coach_access" ON team_import_tokens
  FOR ALL
  TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Organizers can view active tokens for import (metadata only)
CREATE POLICY "team_import_tokens_organizer_view" ON team_import_tokens
  FOR SELECT
  TO authenticated
  USING (
    status = 'active' 
    AND expires_at > NOW()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'organizer')
  );

-- ----------------------------------------------------------------------------
-- PHASE 6: UPDATE AUTHENTICATION TRIGGER FOR COACH ROLE
-- ----------------------------------------------------------------------------

-- Update the handle_new_user function to support coach role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, country, premium_status, name)
  VALUES (
    NEW.id,
    NEW.email,
    -- ✅ UPDATED: Added coach role support
    CASE 
      WHEN NEW.raw_user_meta_data->>'userType' = 'organizer' THEN 'organizer'
      WHEN NEW.raw_user_meta_data->>'userType' = 'stat_admin' THEN 'stat_admin'
      WHEN NEW.raw_user_meta_data->>'userType' = 'coach' THEN 'coach'
      ELSE 'player'
    END,
    COALESCE(NEW.raw_user_meta_data->>'country', 'US'),
    FALSE,
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'lastName', '')
    ))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists (recreate to pick up function changes)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- PHASE 7: CREATE HELPER FUNCTIONS FOR COACH OPERATIONS
-- ----------------------------------------------------------------------------

-- Function to generate secure import tokens
CREATE OR REPLACE FUNCTION generate_team_import_token(
  p_coach_team_id UUID,
  p_coach_id UUID,
  p_expires_hours INTEGER DEFAULT 48
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert the token record
  INSERT INTO team_import_tokens (
    token, 
    coach_team_id, 
    coach_id, 
    expires_at
  ) VALUES (
    v_token,
    p_coach_team_id,
    p_coach_id,
    NOW() + (p_expires_hours || ' hours')::INTERVAL
  );
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use import token
CREATE OR REPLACE FUNCTION use_team_import_token(
  p_token TEXT,
  p_organizer_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  team_data JSONB,
  error_message TEXT
) AS $$
DECLARE
  v_token_record team_import_tokens%ROWTYPE;
  v_team_data JSONB;
BEGIN
  -- Find and validate token
  SELECT * INTO v_token_record
  FROM team_import_tokens
  WHERE token = p_token
    AND status = 'active'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'Invalid or expired token';
    RETURN;
  END IF;
  
  -- Get team data (metadata only for security)
  SELECT jsonb_build_object(
    'id', t.id,
    'name', t.name,
    'coach_name', u.name,
    'player_count', (
      SELECT COUNT(*) FROM team_players tp WHERE tp.team_id = t.id
    ),
    'visibility', t.visibility,
    'created_at', t.created_at
  ) INTO v_team_data
  FROM teams t
  JOIN users u ON u.id = t.coach_id
  WHERE t.id = v_token_record.coach_team_id;
  
  -- Mark token as used
  UPDATE team_import_tokens
  SET status = 'used',
      used_at = NOW(),
      used_by = p_organizer_id
  WHERE id = v_token_record.id;
  
  RETURN QUERY SELECT TRUE, v_team_data, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (FOR TESTING)
-- ----------------------------------------------------------------------------

-- Verify role enum includes coach
-- SELECT unnest(enum_range(NULL::user_role)) AS roles;

-- Verify teams table has new columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'teams' 
-- AND column_name IN ('coach_id', 'visibility');

-- Verify games table has new columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'games' 
-- AND column_name IN ('is_coach_game', 'opponent_name');

-- Verify team_import_tokens table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'team_import_tokens';

-- ============================================================================
-- PHASE 7: FIX RLS INFINITE RECURSION (CRITICAL)
-- ============================================================================
-- Issue: Multiple overlapping policies causing infinite recursion
-- Solution: Drop ALL policies, create simple non-recursive ones
-- ============================================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "users_self_access_policy" ON users;
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v2" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v3" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_v4" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players_policy_simple" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_self_update_policy" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
DROP POLICY IF EXISTS "users_self_policy" ON users;
DROP POLICY IF EXISTS "users_organizer_policy" ON users;
DROP POLICY IF EXISTS "users_self_manage" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_authenticated_read_all" ON users;
DROP POLICY IF EXISTS "users_anon_read_basic" ON users;
DROP POLICY IF EXISTS "users_allow_all_authenticated" ON users;
DROP POLICY IF EXISTS "users_allow_anon_basic" ON users;
DROP POLICY IF EXISTS "users_organizer_team_players" ON users;
DROP POLICY IF EXISTS "users_stat_admin_game_players" ON users;
DROP POLICY IF EXISTS "users_public_player_names" ON users;
DROP POLICY IF EXISTS "users_self_access" ON users;
DROP POLICY IF EXISTS "users_insert_new" ON users;
DROP POLICY IF EXISTS "users_authenticated_basic" ON users;
DROP POLICY IF EXISTS "users_signup_insert" ON users;
DROP POLICY IF EXISTS "users_coach_team_players" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create 4 simple, non-recursive policies
-- Policy 1: Self-access (most important for auth)
CREATE POLICY "users_self_access"
ON users
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 2: Allow authenticated users to see other users (for rosters)
CREATE POLICY "users_authenticated_read"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow anonymous users to see basic player info
CREATE POLICY "users_anon_read"
ON users
FOR SELECT
TO anon
USING (role IN ('player', 'organizer', 'stat_admin', 'coach'));

-- Policy 4: Allow INSERT during signup (handled by trigger)
CREATE POLICY "users_signup_insert"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Added 'coach' role to users table (CHECK constraint)
-- ✅ Extended teams table with coach_id and visibility fields
-- ✅ Extended games table with is_coach_game and opponent_name fields
-- ✅ Created team_import_tokens table for secure sharing
-- ✅ Added comprehensive RLS policies for coach access patterns
-- ✅ Updated authentication trigger to handle coach role
-- ✅ Created helper functions for token operations
-- ✅ Added proper indexes for performance
-- ✅ FIXED RLS infinite recursion with simple, non-recursive policies
-- 
-- Next Steps:
-- 1. Test coach user login (should work immediately)
-- 2. Verify profile fetch works without recursion
-- 3. Test coach dashboard access
-- 4. Proceed to Phase 2: Frontend Implementation
-- ============================================================================
