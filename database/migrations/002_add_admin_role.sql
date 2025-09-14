-- Add admin role to existing user role constraint
-- This allows super admins to manage card templates

BEGIN;

-- Update the role constraint to include 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('organizer', 'player', 'stat_admin', 'fan', 'admin'));

-- Add admin navigation config
-- Note: This will need to be added to the frontend navigation config as well

COMMIT;
