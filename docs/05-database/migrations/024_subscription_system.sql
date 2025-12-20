-- ============================================================================
-- MIGRATION 024: SUBSCRIPTION SYSTEM
-- ============================================================================
-- Purpose: Extend subscription infrastructure for role-based tiered pricing
-- 
-- Changes:
--   1. Extend subscriptions table with tier, billing, Stripe fields
--   2. Create subscription_usage table for limit tracking
--   3. Add is_verified column to users table
--   4. Update role constraint to include 'coach'
--   5. Add RLS policies for new tables
--
-- Safety: All changes are ADDITIVE - no breaking changes to existing data
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PHASE 1: EXTEND SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------

-- Add tier column (free, pro, seasonal_pass, annual, family)
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Add billing period column
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS billing_period TEXT;

-- Add expiration timestamp
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add Stripe integration fields
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add video credits for Seasonal Pass holders
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS video_credits INTEGER DEFAULT 0;

-- Add updated_at timestamp
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update role constraint to include 'coach' and 'stat_admin'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_role_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_role_check 
  CHECK (role IN ('organizer', 'player', 'coach', 'stat_admin'));

-- Add tier constraint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tier_check 
  CHECK (tier IN ('free', 'pro', 'seasonal_pass', 'annual', 'family'));

-- Add billing period constraint
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_billing_check 
  CHECK (billing_period IN ('monthly', 'seasonal', 'annual') OR billing_period IS NULL);

-- Update status constraint to include more states
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('active', 'expired', 'cancelled', 'trial'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_role 
  ON subscriptions(user_id, role);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON subscriptions(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires 
  ON subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- PHASE 2: ADD VERIFIED COLUMN TO USERS
-- ----------------------------------------------------------------------------

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Index for verified user lookups
CREATE INDEX IF NOT EXISTS idx_users_verified 
  ON users(is_verified) WHERE is_verified = TRUE;

-- ----------------------------------------------------------------------------
-- PHASE 3: CREATE SUBSCRIPTION USAGE TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  current_count INTEGER DEFAULT 0,
  max_allowed INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique usage tracking per user, resource, period
  UNIQUE(user_id, resource_type, period_start)
);

-- Add constraint for resource types
ALTER TABLE subscription_usage ADD CONSTRAINT subscription_usage_resource_check 
  CHECK (resource_type IN ('season', 'team', 'game', 'video_game'));

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user 
  ON subscription_usage(user_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_period 
  ON subscription_usage(period_start, period_end);

-- ----------------------------------------------------------------------------
-- PHASE 4: RLS POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on subscription_usage
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "subscription_usage_user_select" ON subscription_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own usage (for tracking)
CREATE POLICY "subscription_usage_user_insert" ON subscription_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own usage
CREATE POLICY "subscription_usage_user_update" ON subscription_usage
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscriptions table - users can read their own
CREATE POLICY "subscriptions_user_select" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- PHASE 5: HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function to check if user has active subscription for a role
CREATE OR REPLACE FUNCTION has_active_subscription(
  p_user_id UUID,
  p_role TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND role = p_role
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's subscription tier for a role
CREATE OR REPLACE FUNCTION get_subscription_tier(
  p_user_id UUID,
  p_role TEXT
) RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT tier INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id
  AND role = p_role
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY 
    CASE tier 
      WHEN 'family' THEN 1
      WHEN 'annual' THEN 2
      WHEN 'seasonal_pass' THEN 3
      WHEN 'pro' THEN 4
      WHEN 'free' THEN 5
    END
  LIMIT 1;
  
  RETURN COALESCE(v_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_resource_type TEXT,
  p_max_allowed INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_period_start DATE := date_trunc('month', NOW())::DATE;
  v_period_end DATE := (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::DATE;
BEGIN
  -- Try to get or create usage record
  INSERT INTO subscription_usage (user_id, resource_type, period_start, period_end, current_count, max_allowed)
  VALUES (p_user_id, p_resource_type, v_period_start, v_period_end, 0, p_max_allowed)
  ON CONFLICT (user_id, resource_type, period_start) 
  DO UPDATE SET max_allowed = p_max_allowed, updated_at = NOW();
  
  -- Check current count
  SELECT current_count INTO v_current_count
  FROM subscription_usage
  WHERE user_id = p_user_id
  AND resource_type = p_resource_type
  AND period_start = v_period_start;
  
  -- If under limit, increment and return true
  IF v_current_count < p_max_allowed THEN
    UPDATE subscription_usage
    SET current_count = current_count + 1, updated_at = NOW()
    WHERE user_id = p_user_id
    AND resource_type = p_resource_type
    AND period_start = v_period_start;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- PHASE 6: VERIFICATION
-- ----------------------------------------------------------------------------

-- Verify subscriptions table has new columns
SELECT 
  'VERIFY: Subscriptions table columns' as check_type,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
AND column_name IN ('tier', 'billing_period', 'expires_at', 'stripe_customer_id', 'video_credits')
ORDER BY column_name;

-- Verify users table has is_verified
SELECT 
  'VERIFY: Users is_verified column' as check_type,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'is_verified';

-- Verify subscription_usage table exists
SELECT 
  'VERIFY: subscription_usage table' as check_type,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'subscription_usage';

-- Verify RLS policies
SELECT 
  'VERIFY: RLS policies' as check_type,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'subscription_usage')
ORDER BY tablename, policyname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Next steps after running this migration:
-- 1. Test has_active_subscription() function
-- 2. Test get_subscription_tier() function
-- 3. Test increment_usage() function
-- 4. Verify RLS policies work correctly
--
-- Rollback (if needed):
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS tier;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS billing_period;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS expires_at;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_customer_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS stripe_subscription_id;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS video_credits;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
-- DROP TABLE IF EXISTS subscription_usage;
-- DROP FUNCTION IF EXISTS has_active_subscription;
-- DROP FUNCTION IF EXISTS get_subscription_tier;
-- DROP FUNCTION IF EXISTS increment_usage;
-- ============================================================================
