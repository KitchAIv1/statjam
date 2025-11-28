-- ============================================================================
-- VERIFY CLAIMED PLAYER DATA
-- ============================================================================
-- Run these queries to check what data exists for the claimed player
-- ============================================================================

-- STEP 1: Find the custom player that was claimed by this user
-- Replace the UUID with the new user's ID: 68185c6e-bd75-49e3-b4f3-0123de92dad8
SELECT 
  id as custom_player_id,
  name,
  jersey_number,
  team_id,
  claimed_by_user_id,
  claimed_at,
  claim_token
FROM custom_players 
WHERE claimed_by_user_id = '68185c6e-bd75-49e3-b4f3-0123de92dad8';

-- STEP 2: Check if there are ANY game_stats for this custom player
-- Replace with the custom_player_id from Step 1
SELECT 
  id,
  game_id,
  player_id,
  custom_player_id,
  stat_type,
  stat_value,
  created_at
FROM game_stats 
WHERE custom_player_id = '8e2ab283-5f6a-4dde-a50c-c184b807a9f7'
ORDER BY created_at DESC
LIMIT 20;

-- STEP 3: Check if stats were transferred to the new user
SELECT 
  id,
  game_id,
  player_id,
  custom_player_id,
  stat_type,
  stat_value,
  created_at
FROM game_stats 
WHERE player_id = '68185c6e-bd75-49e3-b4f3-0123de92dad8'
ORDER BY created_at DESC
LIMIT 20;

-- STEP 4: Check total count of stats for both IDs
SELECT 
  'custom_player_id' as source,
  COUNT(*) as stat_count
FROM game_stats 
WHERE custom_player_id = '8e2ab283-5f6a-4dde-a50c-c184b807a9f7'
UNION ALL
SELECT 
  'player_id (new user)' as source,
  COUNT(*) as stat_count
FROM game_stats 
WHERE player_id = '68185c6e-bd75-49e3-b4f3-0123de92dad8';

-- STEP 5: Check which games this custom player participated in
SELECT DISTINCT 
  gs.game_id,
  g.status,
  g.created_at as game_created
FROM game_stats gs
JOIN games g ON g.id = gs.game_id
WHERE gs.custom_player_id = '8e2ab283-5f6a-4dde-a50c-c184b807a9f7';

