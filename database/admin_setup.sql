-- Admin User Setup Script
-- Run this after creating a user through the normal signup process

-- Step 1: Find your user ID (replace 'your-email@example.com' with your actual email)
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Step 2: Update the user role to admin (replace the UUID with your actual user ID)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Step 3: Verify the change
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';

-- Optional: Grant additional admin privileges
UPDATE users 
SET 
  premium_status = true,
  free_renders_remaining = 999,
  premium_renders_remaining = 999
WHERE email = 'your-email@example.com';
