-- Debug Admin User Setup
-- Run this in Supabase SQL Editor to verify admin user

-- Check if vibecodepro@gmail.com exists and has admin role
SELECT 
  id,
  email, 
  role,
  premium_status,
  free_renders_remaining,
  premium_renders_remaining,
  card_generation_enabled,
  created_at
FROM users 
WHERE email = 'vibecodepro@gmail.com';

-- If the user exists but role is not 'admin', run this:
UPDATE users 
SET 
  role = 'admin',
  premium_status = true,
  free_renders_remaining = 999,
  premium_renders_remaining = 999,
  card_generation_enabled = true
WHERE email = 'vibecodepro@gmail.com';

-- Verify the update
SELECT 
  id,
  email, 
  role,
  premium_status,
  free_renders_remaining,
  premium_renders_remaining,
  card_generation_enabled,
  created_at
FROM users 
WHERE email = 'vibecodepro@gmail.com';

-- Also check if there are any other admin users
SELECT 
  id,
  email, 
  role,
  created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at DESC;
