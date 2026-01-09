-- ============================================================
-- REMAINING MIGRATION: Game Substitutions + Delete Clips
-- ============================================================

-- ====================
-- SECTION 1: MIGRATE GAME SUBSTITUTIONS - Game 1 (38d7f2a4)
-- ====================

UPDATE game_substitutions
SET 
  team_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid,
  custom_player_in_id = CASE custom_player_in_id
    WHEN '8b101a54-2586-40f5-a7a5-34a807afd9cf' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid  -- DeGrais
    WHEN 'c076c961-006f-42ee-b06e-39aac9ec9ea5' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid  -- Haines
    WHEN '6656e9d3-7344-4dce-80f9-cf6fe0c24ec6' THEN 'b6403f81-4f26-45e4-9d0f-a1bc1fde55fa'::uuid  -- Johnson
    WHEN 'a885c060-bc82-467b-81f3-fe67ccdd5179' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid  -- Morton
    WHEN '583433c8-9e19-4fae-b216-0e58b890506b' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid  -- Murrell
    WHEN '0e329a47-b9f9-4913-938c-680a54dc8bda' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid  -- Scott
    WHEN '5db70d80-b3e2-44fe-9c54-7ff91fce2816' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid  -- Thorton
    WHEN '858e67c7-0f1f-4992-9a74-3dd273cb92c1' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid  -- Ward Jr
    ELSE custom_player_in_id
  END,
  custom_player_out_id = CASE custom_player_out_id
    WHEN '8b101a54-2586-40f5-a7a5-34a807afd9cf' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid  -- DeGrais
    WHEN 'c076c961-006f-42ee-b06e-39aac9ec9ea5' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid  -- Haines
    WHEN '6656e9d3-7344-4dce-80f9-cf6fe0c24ec6' THEN 'b6403f81-4f26-45e4-9d0f-a1bc1fde55fa'::uuid  -- Johnson
    WHEN 'a885c060-bc82-467b-81f3-fe67ccdd5179' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid  -- Morton
    WHEN '583433c8-9e19-4fae-b216-0e58b890506b' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid  -- Murrell
    WHEN '0e329a47-b9f9-4913-938c-680a54dc8bda' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid  -- Scott
    WHEN '5db70d80-b3e2-44fe-9c54-7ff91fce2816' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid  -- Thorton
    WHEN '858e67c7-0f1f-4992-9a74-3dd273cb92c1' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid  -- Ward Jr
    ELSE custom_player_out_id
  END
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- ====================
-- SECTION 2: MIGRATE GAME SUBSTITUTIONS - Game 2 (ddf6af58)
-- ====================

UPDATE game_substitutions
SET 
  team_id = '99545c54-7d86-4371-a6b1-16d3b66ab291'::uuid,
  custom_player_in_id = CASE custom_player_in_id
    WHEN 'bc18fd62-7484-4fba-9a92-886555a820e8' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid  -- DeGrais
    WHEN '7df84ddd-6cbd-4477-b3cf-f398559e4deb' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid  -- Haines
    WHEN '0950827d-e1e8-4d33-ad57-f669650ce6e5' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid  -- Morton
    WHEN '47874d56-dbe0-4dfd-8acc-4c9bb57c6d60' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid  -- Murrell
    WHEN '54f3a011-6eff-4074-ba5a-2951e04f5dd3' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid  -- Scott
    WHEN 'e9b5f831-1db1-490d-821c-370921de5d53' THEN 'e8866b62-ea45-455f-8bcf-9bb19c86d89f'::uuid  -- Shorter
    WHEN '3ce0c6c8-e1ca-4a60-9ff8-bb27cb20ce34' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid  -- Thorton
    WHEN '2150793c-5bcc-4c34-9ab3-1ec4bbc1398c' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid  -- Ward Jr
    ELSE custom_player_in_id
  END,
  custom_player_out_id = CASE custom_player_out_id
    WHEN 'bc18fd62-7484-4fba-9a92-886555a820e8' THEN '0ec60511-9c15-4320-adb8-f67cc718c526'::uuid  -- DeGrais
    WHEN '7df84ddd-6cbd-4477-b3cf-f398559e4deb' THEN '278e5438-71c4-44b6-a09c-ce1b5289b547'::uuid  -- Haines
    WHEN '0950827d-e1e8-4d33-ad57-f669650ce6e5' THEN '4aa45315-ed4b-4555-9a02-ccf94575f694'::uuid  -- Morton
    WHEN '47874d56-dbe0-4dfd-8acc-4c9bb57c6d60' THEN 'c19c369c-284d-4ebc-89b5-f80a83c4dbf0'::uuid  -- Murrell
    WHEN '54f3a011-6eff-4074-ba5a-2951e04f5dd3' THEN '48a24149-f2eb-453e-8c0c-0565aa9ded9d'::uuid  -- Scott
    WHEN 'e9b5f831-1db1-490d-821c-370921de5d53' THEN 'e8866b62-ea45-455f-8bcf-9bb19c86d89f'::uuid  -- Shorter
    WHEN '3ce0c6c8-e1ca-4a60-9ff8-bb27cb20ce34' THEN 'c09a26a9-89d6-4885-8bc9-2cba1a4bac43'::uuid  -- Thorton
    WHEN '2150793c-5bcc-4c34-9ab3-1ec4bbc1398c' THEN '0b5d4292-d23a-424d-9479-608cd083ae59'::uuid  -- Ward Jr
    ELSE custom_player_out_id
  END
WHERE game_id = 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb';

-- ====================
-- SECTION 3: DELETE GENERATED CLIPS - Game 1 (38d7f2a4) - AS REQUESTED
-- ====================

-- First check clip_generation_jobs for this game
SELECT * FROM clip_generation_jobs 
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- Delete the clips
DELETE FROM generated_clips 
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- Delete the clip generation job(s)
DELETE FROM clip_generation_jobs 
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82';

-- ====================
-- SECTION 4: VERIFY SUBSTITUTIONS MIGRATION
-- ====================

SELECT 
  gs.game_id,
  gs.team_id,
  t.name AS team_name,
  cp_in.name AS player_in_name,
  cp_out.name AS player_out_name
FROM game_substitutions gs
JOIN teams t ON gs.team_id = t.id
LEFT JOIN custom_players cp_in ON gs.custom_player_in_id = cp_in.id
LEFT JOIN custom_players cp_out ON gs.custom_player_out_id = cp_out.id
WHERE gs.game_id IN ('38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82', 'ddf6af58-7cc3-4f1e-a353-8971fd4088cb')
ORDER BY gs.game_id, gs.created_at
LIMIT 10;

-- ====================
-- SECTION 5: VERIFY CLIPS DELETED
-- ====================

SELECT game_id, COUNT(*) AS remaining_clips 
FROM generated_clips 
WHERE game_id = '38d7f2a4-ac51-4cf1-b3a9-72e8dcf3ec82'
GROUP BY game_id;

-- Should return no rows if delete was successful

