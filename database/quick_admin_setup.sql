-- Quick Admin Setup for Testing
-- Run this in your Supabase SQL Editor

-- Option 1: Check existing users
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- Option 2: Promote an existing user to admin (replace email)
-- UPDATE users 
-- SET role = 'admin', 
--     premium_status = true,
--     free_renders_remaining = 999,
--     premium_renders_remaining = 999
-- WHERE email = 'your-email@example.com';

-- Option 3: Create a test admin user (if no users exist)
-- First create the auth user in Supabase Dashboard → Authentication → Add User
-- Email: admin@test.com
-- Password: admin123!
-- Then run this to set up the profile:

-- INSERT INTO users (id, email, role, country, premium_status, free_renders_remaining, premium_renders_remaining)
-- VALUES (
--   'your-auth-user-id-here',  -- Replace with actual UUID from auth.users
--   'admin@test.com',
--   'admin',
--   'US',
--   true,
--   999,
--   999
-- );

-- Verify admin user
SELECT id, email, role, premium_status, free_renders_remaining 
FROM users 
WHERE role = 'admin';
