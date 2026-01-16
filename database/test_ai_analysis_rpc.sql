-- ============================================================================
-- TEST SCRIPT: AI Analysis RPC Function
-- ============================================================================
-- Purpose: Test get_ai_analysis_data() function with actual game data
-- Run this in Supabase SQL Editor to verify the function works
-- ============================================================================

-- Test with the game ID that has stats
SELECT get_ai_analysis_data('06977421-52b9-4543-bab8-6480084c5e45'::uuid) as result;

-- Or test with another game (replace with your test game ID)
-- SELECT get_ai_analysis_data('your-game-id-here'::uuid) as result;

-- Expected result:
-- - JSONB object with game, quarters, team_totals, and players arrays
-- - Should NOT have type errors
-- - Should return valid data structure
