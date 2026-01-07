-- ============================================================
-- INVESTIGATE CLAIMED PLAYER - Custom Player → Profile Migration
-- Game: 7f743a36-8814-4932-b116-4ce22ab3afb9
-- Team: 14d2b437-f0ba-408c-a959-9193e719b7b4
-- Problem Player ID: ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3
-- ============================================================
-- SCENARIO: Custom player was claimed (created real profile account)
-- The custom_players entry was deleted, but team_players still 
-- references custom_player_id instead of the new player_id (profile)
-- ============================================================

-- STEP 1: Confirm player does NOT exist in custom_players (expected)
SELECT 'custom_players' as table_name, * FROM custom_players 
WHERE id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';

-- STEP 2: Find the claimed profile (search by email or name association)
-- Check if there's a profile linked to this old custom player ID
SELECT 'profiles' as table_name, id, email, first_name, last_name, role
FROM profiles 
WHERE id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';

-- STEP 3: Check team_players entry that has the orphan reference
SELECT 
  tp.id as team_player_id,
  tp.player_id,
  tp.custom_player_id,
  tp.jersey_number,
  tp.is_active,
  tp.team_id
FROM team_players tp
WHERE tp.custom_player_id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';

-- STEP 4: Find ALL team_players for this team to see the roster
SELECT 
  tp.id,
  tp.player_id,
  tp.custom_player_id,
  tp.jersey_number,
  p.email as profile_email,
  cp.first_name as custom_first_name
FROM team_players tp
LEFT JOIN profiles p ON tp.player_id = p.id
LEFT JOIN custom_players cp ON tp.custom_player_id = cp.id
WHERE tp.team_id = '14d2b437-f0ba-408c-a959-9193e719b7b4';

-- STEP 5: Check if there's a profile with the same email/name that claimed this
-- (You may need to adjust this query based on how claiming works)
SELECT id, email, first_name, last_name, created_at
FROM profiles
WHERE email LIKE '%@%'  -- adjust to search for the player's email
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- FIX: Update team_players to use player_id instead of custom_player_id
-- ============================================================
-- Once you find the new profile ID, run:

/*
-- OPTION A: Update team_players to point to the claimed profile
UPDATE team_players
SET 
  player_id = 'NEW_PROFILE_ID_HERE',  -- Replace with actual profile ID
  custom_player_id = NULL
WHERE custom_player_id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';
*/

/*
-- OPTION B: If no profile exists, just remove the orphan reference
-- (Player won't appear in roster anymore)
DELETE FROM team_players 
WHERE custom_player_id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';
*/

/*
-- OPTION C: Re-create custom player if claim was incomplete
INSERT INTO custom_players (id, team_id, first_name, last_name, jersey_number, created_at)
VALUES (
  'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3',
  '14d2b437-f0ba-408c-a959-9193e719b7b4',
  'FirstName',  -- Get from coach
  'LastName',   -- Get from coach
  0,            -- Jersey number
  NOW()
);
*/

