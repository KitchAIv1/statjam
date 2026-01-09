-- ============================================================
-- GAME MIGRATION SCRIPT - Transfer games to Coach Profile
-- Target Coach: wardterence02@gmail.com
-- Target Team: 99545c54-7d86-4371-a6b1-16d3b66ab291 (Winslow Township 7th Grade Travel)
-- Games: 38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82, ddf6af58-7cc3-4f1e-a353-8971fd4088cb
-- ============================================================
-- ⚠️ RUN EACH SECTION SEPARATELY AND VERIFY RESULTS BEFORE PROCEEDING
-- ============================================================

-- ====================
-- SECTION 0: PLAYER MAPPING TABLE (Reference Only)
-- ====================
-- Game 1 (38d7f2a4) - vs Moorestown
-- Source Player ID                          | Target Player ID                         | Name
-- 8b101a54-2586-40f5-a7a5-34a807afd9cf     | 0ec60511-9c15-4320-adb8-f67cc718c526    | DeGrais
-- c076c961-006f-42ee-b06e-39aac9ec9ea5     | 278e5438-71c4-44b6-a09c-ce1b5289b547    | Haines
-- 6656e9d3-7344-4dce-80f9-cf6fe0c24ec6     | b6403f81-4f26-45e4-9d0f-a1bc1fde55fa    | Johnson
-- a885c060-bc82-467b-81f3-fe67ccdd5179     | 4aa45315-ed4b-4555-9a02-ccf94575f694    | Morton
-- 583433c8-9e19-4fae-b216-0e58b890506b     | c19c369c-284d-4ebc-89b5-f80a83c4dbf0    | Murrell
-- 0e329a47-b9f9-4913-938c-680a54dc8bda     | 48a24149-f2eb-453e-8c0c-0565aa9ded9d    | Scott
-- 5db70d80-b3e2-44fe-9c54-7ff91fce2816     | c09a26a9-89d6-4885-8bc9-2cba1a4bac43    | Thorton
-- 858e67c7-0f1f-4992-9a74-3dd273cb92c1     | 0b5d4292-d23a-424d-9479-608cd083ae59    | Ward Jr (WARD JR. → Ward Jr)

-- Game 2 (ddf6af58) - vs Burlington City
-- Source Player ID                          | Target Player ID                         | Name
-- bc18fd62-7484-4fba-9a92-886555a820e8     | 0ec60511-9c15-4320-adb8-f67cc718c526    | DeGrais
-- 7df84ddd-6cbd-4477-b3cf-f398559e4deb     | 278e5438-71c4-44b6-a09c-ce1b5289b547    | Haines
-- 0950827d-e1e8-4d33-ad57-f669650ce6e5     | 4aa45315-ed4b-4555-9a02-ccf94575f694    | Morton
-- 47874d56-dbe0-4dfd-8acc-4c9bb57c6d60     | c19c369c-284d-4ebc-89b5-f80a83c4dbf0    | Murrell
-- 54f3a011-6eff-4074-ba5a-2951e04f5dd3     | 48a24149-f2eb-453e-8c0c-0565aa9ded9d    | Scott
-- e9b5f831-1db1-490d-821c-370921de5d53     | e8866b62-ea45-455f-8bcf-9bb19c86d89f    | Shorter
-- 3ce0c6c8-e1ca-4a60-9ff8-bb27cb20ce34     | c09a26a9-89d6-4885-8bc9-2cba1a4bac43    | Thorton
-- 2150793c-5bcc-4c34-9ab3-1ec4bbc1398c     | 0b5d4292-d23a-424d-9479-608cd083ae59    | Ward Jr

-- ====================
-- SECTION 1: PREVIEW - Check what will be updated (RUN FIRST)
-- ====================

-- 1A: Preview game_stats updates for Game 1
SELECT 
  gs.id,
  gs.game_id,
  gs.custom_player_id AS old_player_id,
  cp_old.name AS old_player_name,
  gs.team_id AS old_team_id,
  CASE gs.custom_player_id
    WHEN '8b101a54-2586-40f5-a7a5-34a807afd9cf' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'
    WHEN 'c076c961-006f-42ee-b06e-39aac9ec9ea5' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'
    WHEN '6656e9d3-7344-4dce-80f9-cf6fe0c24ec6' THEN 'b6403f81-4f26-45e4-9d0f-a1bc1fde55fa'
    WHEN 'a885c060-bc82-467b-81f3-fe67ccdd5179' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'
    WHEN '583433c8-9e19-4fae-b216-0e58b890506b' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'
    WHEN '0e329a47-b9f9-4913-938c-680a54dc8bda' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'
    WHEN '5db70d80-b3e2-44fe-9c54-7ff91fce2816' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'
    WHEN '858e67c7-0f1f-4992-9a74-3dd273cb92c1' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'
    ELSE gs.custom_player_id
  END AS new_player_id,
  '99545c54-7d86-4371-a6b1-16d3b66ab291' AS new_team_id
FROM game_stats gs
LEFT JOIN custom_players cp_old ON gs.custom_player_id = cp_old.id
WHERE gs.game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
  AND gs.custom_player_id IS NOT NULL
  AND gs.is_opponent_stat = FALSE
LIMIT 20;

-- 1B: Preview game_stats updates for Game 2
SELECT 
  gs.id,
  gs.game_id,
  gs.custom_player_id AS old_player_id,
  cp_old.name AS old_player_name,
  gs.team_id AS old_team_id,
  CASE gs.custom_player_id
    WHEN 'bc18fd62-7484-4fba-9a92-886555a820e8' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'
    WHEN '7df84ddd-6cbd-4477-b3cf-f398559e4deb' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'
    WHEN '0950827d-e1e8-4d33-ad57-f669650ce6e5' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'
    WHEN '47874d56-dbe0-4dfd-8acc-4c9bb57c6d60' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'
    WHEN '54f3a011-6eff-4074-ba5a-2951e04f5dd3' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'
    WHEN 'e9b5f831-1db1-490d-821c-370921de5d53' THEN 'e8866b62-ea45-455f-8bcf-9bb19c86d89f'
    WHEN '3ce0c6c8-e1ca-4a60-9ff8-bb27cb20ce34' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'
    WHEN '2150793c-5bcc-4c34-9ab3-1ec4bbc1398c' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'
    ELSE gs.custom_player_id
  END AS new_player_id,
  '99545c54-7d86-4371-a6b1-16d3b66ab291' AS new_team_id
FROM game_stats gs
LEFT JOIN custom_players cp_old ON gs.custom_player_id = cp_old.id
WHERE gs.game_id = 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
  AND gs.custom_player_id IS NOT NULL
  AND gs.is_opponent_stat = FALSE
LIMIT 20;

-- 1C: Check for game_substitutions
SELECT * FROM game_substitutions 
WHERE game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb');

-- 1D: Check for game_awards (POTG/Hustle)
SELECT * FROM game_awards 
WHERE game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb');

-- 1E: Check for generated_clips
SELECT game_id, COUNT(*) AS clip_count FROM generated_clips 
WHERE game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb')
GROUP BY game_id;

-- ====================
-- SECTION 2: EXECUTE MIGRATION - Game 1 (38d7f2a4)
-- ====================

-- 2A: Update game_stats - Map custom_player_id for team stats
UPDATE game_stats
SET 
  custom_player_id = CASE custom_player_id
    WHEN '8b101a54-2586-40f5-a7a5-34a807afd9cf' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid
    WHEN 'c076c961-006f-42ee-b06e-39aac9ec9ea5' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid
    WHEN '6656e9d3-7344-4dce-80f9-cf6fe0c24ec6' THEN 'b6403f81-4f26-45e4-9d0f-a1bc1fde55fa'::uuid
    WHEN 'a885c060-bc82-467b-81f3-fe67ccdd5179' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid
    WHEN '583433c8-9e19-4fae-b216-0e58b890506b' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid
    WHEN '0e329a47-b9f9-4913-938c-680a54dc8bda' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid
    WHEN '5db70d80-b3e2-44fe-9c54-7ff91fce2816' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid
    WHEN '858e67c7-0f1f-4992-9a74-3dd273cb92c1' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid
    ELSE custom_player_id
  END,
  team_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
  AND is_opponent_stat = FALSE
  AND custom_player_id IS NOT NULL;

-- 2B: Update games table - Change team ownership
UPDATE games
SET team_a_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid
WHERE id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- ====================
-- SECTION 3: EXECUTE MIGRATION - Game 2 (ddf6af58)
-- ====================

-- 3A: Update game_stats - Map custom_player_id for team stats
UPDATE game_stats
SET 
  custom_player_id = CASE custom_player_id
    WHEN 'bc18fd62-7484-4fba-9a92-886555a820e8' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid
    WHEN '7df84ddd-6cbd-4477-b3cf-f398559e4deb' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid
    WHEN '0950827d-e1e8-4d33-ad57-f669650ce6e5' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid
    WHEN '47874d56-dbe0-4dfd-8acc-4c9bb57c6d60' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid
    WHEN '54f3a011-6eff-4074-ba5a-2951e04f5dd3' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid
    WHEN 'e9b5f831-1db1-490d-821c-370921de5d53' THEN 'e8866b62-ea45-455f-8bcf-9bb19c86d89f'::uuid
    WHEN '3ce0c6c8-e1ca-4a60-9ff8-bb27cb20ce34' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid
    WHEN '2150793c-5bcc-4c34-9ab3-1ec4bbc1398c' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid
    ELSE custom_player_id
  END,
  team_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid
WHERE game_id = 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb'
  AND is_opponent_stat = FALSE
  AND custom_player_id IS NOT NULL;

-- 3B: Update games table - Change team ownership
UPDATE games
SET team_a_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid
WHERE id = 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb';

-- ====================
-- SECTION 4: VERIFY MIGRATION
-- ====================

-- 4A: Verify games now belong to coach's team
SELECT 
  g.id AS game_id,
  g.team_a_id,
  t.name AS team_name,
  t.coach_id,
  u.email AS coach_email,
  g.opponent_name,
  g.home_score,
  g.away_score
FROM games g
JOIN teams t ON g.team_a_id = t.id
JOIN users u ON t.coach_id = u.id
WHERE g.id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb');

-- 4B: Verify game_stats now reference coach's players
SELECT 
  gs.game_id,
  gs.custom_player_id,
  cp.name AS player_name,
  cp.team_id,
  t.name AS team_name,
  COUNT(*) AS stat_count
FROM game_stats gs
JOIN custom_players cp ON gs.custom_player_id = cp.id
JOIN teams t ON cp.team_id = t.id
WHERE gs.game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb')
  AND gs.is_opponent_stat = FALSE
GROUP BY gs.game_id, gs.custom_player_id, cp.name, cp.team_id, t.name
ORDER BY gs.game_id, cp.name;

-- 4C: Final count verification
SELECT 
  game_id,
  COUNT(*) AS total_stats,
  COUNT(DISTINCT custom_player_id) AS unique_players
FROM game_stats
WHERE game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb')
  AND is_opponent_stat = FALSE
GROUP BY game_id;

