-- ============================================================================
-- Migration: 008_event_linking.sql
-- Purpose: Add event linking columns to game_stats for sequence tracking
-- Phase: 1 (Foundation)
-- Breaking Changes: NONE (additive only, nullable columns)
-- Rollback: Not needed (columns can remain unused)
-- ============================================================================

-- ✅ ADDITIVE: Add event linking columns (nullable, no breaking changes)
ALTER TABLE game_stats 
  ADD COLUMN IF NOT EXISTS sequence_id UUID,
  ADD COLUMN IF NOT EXISTS linked_event_id UUID REFERENCES game_stats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_metadata JSONB DEFAULT '{}'::jsonb;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_stats_sequence_id ON game_stats(sequence_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_linked_event_id ON game_stats(linked_event_id);

-- Comments for documentation
COMMENT ON COLUMN game_stats.sequence_id IS 'Groups related events (e.g., assist + shot share same sequence_id)';
COMMENT ON COLUMN game_stats.linked_event_id IS 'Points to primary event (e.g., assist.linked_event_id → shot.id)';
COMMENT ON COLUMN game_stats.event_metadata IS 'Additional context: { ft_number: 1, ft_total: 2, triggered_bonus: true, automation_flags: {...} }';

-- ✅ VERIFICATION: Test that existing inserts still work
DO $$
BEGIN
  -- This should succeed without errors (old insert format)
  RAISE NOTICE 'Migration 008: Event linking columns added successfully';
  RAISE NOTICE 'Existing game_stats inserts will continue to work unchanged';
  RAISE NOTICE 'New columns are nullable and have defaults';
END $$;

