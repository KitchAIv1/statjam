-- ============================================================================
-- TRIGGER: Recompute tournament_leaders when a game is marked completed
--
-- Requires: public.recompute_tournament_leaders(uuid) already exists--           (see recompute_tournament_leaders_by_phase.sql).
--
-- Run manually in Supabase SQL Editor after review.
-- PostgreSQL 14+: CREATE TRIGGER ... EXECUTE FUNCTION ...
-- Older versions: use EXECUTE PROCEDURE instead of EXECUTE FUNCTION.
-- ============================================================================

-- Existing trigger check (run before CREATE):
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_game_completed_recompute_leaders';

CREATE OR REPLACE FUNCTION trigger_recompute_tournament_leaders()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed' THEN
    IF NEW.tournament_id IS NOT NULL THEN
      BEGIN
        PERFORM recompute_tournament_leaders(NEW.tournament_id);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'recompute_tournament_leaders failed for tournament %: %',
          NEW.tournament_id, SQLERRM;
      END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_game_completed_recompute_leaders ON games;

CREATE TRIGGER on_game_completed_recompute_leaders
  AFTER UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recompute_tournament_leaders();
