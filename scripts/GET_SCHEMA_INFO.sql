-- ============================================================
-- GET ACTUAL SCHEMA - No assumptions
-- ============================================================

-- STEP 1: Get team_players columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'team_players'
ORDER BY ordinal_position;

-- STEP 2: Get custom_players columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'custom_players'
ORDER BY ordinal_position;

-- STEP 3: Get all tables that might have user/profile info
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name LIKE '%user%' 
   OR table_name LIKE '%profile%'
   OR table_name LIKE '%account%'
   OR table_name LIKE '%player%';

-- STEP 4: Check if player exists in custom_players
SELECT * FROM custom_players 
WHERE id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';

-- STEP 5: Check team_players for this orphan reference
SELECT * FROM team_players 
WHERE custom_player_id = 'ddf2d689-254b-4eaf-9b07-0f0e77d8e9c3';

-- STEP 6: Check all team_players for this team
SELECT * FROM team_players 
WHERE team_id = '14d2b437-f0ba-408c-a959-9193e719b7b4';

