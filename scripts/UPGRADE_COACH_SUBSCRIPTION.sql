-- Upgrade coach to ANNUAL subscription + 2 video credits
-- Coach: arie@rib247.com

-- Step 1: Find the user
SELECT id, email, name, role
FROM users
WHERE email = 'arie@rib247.com';

-- Step 2: Check current subscription
SELECT 
  s.user_id,
  u.email,
  s.role,
  s.tier,
  s.billing_period,
  s.status,
  s.video_credits,
  s.expires_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'arie@rib247.com';

-- Step 3: INSERT new subscription (Pro Annual + 2 video credits)
INSERT INTO subscriptions (user_id, role, tier, billing_period, status, video_credits, expires_at)
VALUES (
  '362d6e3a-ebc8-4f9c-9c0d-603370494c12',
  'coach',
  'pro',
  'annual',
  'active',
  2,
  NOW() + INTERVAL '1 year'
);

-- Step 4: Verify the update
SELECT 
  s.user_id,
  u.email,
  s.role,
  s.tier,
  s.billing_period,
  s.status,
  s.video_credits,
  s.expires_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'arie@rib247.com';

