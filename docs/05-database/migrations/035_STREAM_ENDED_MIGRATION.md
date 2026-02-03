# Migration 035: Add stream_ended Column

**Date**: February 2026  
**Status**: ✅ Ready for Execution  
**Type**: Additive (No Breaking Changes)

---

## 📋 Overview

This migration adds a `stream_ended` boolean column to the `games` table to track when a live stream has ended, independent of game completion status. This enables the Media Tab to display game replays immediately after the stream ends, without waiting for the game status to be marked as `completed`.

---

## 🎯 Purpose

### Problem
Previously, the Media Tab only displayed game replays for games with `status = 'completed'`. This created a delay between when a live stream ended and when replays became available, as games often remain in `in_progress` status while stat tracking continues.

### Solution
Add a `stream_ended` boolean flag that tracks when the live stream has ended, separate from game completion. This allows the Media Tab to show replays as soon as the stream concludes.

---

## 📝 Migration Details

### SQL File
`statjam/database/migrations/035_add_stream_ended_column.sql`

### Changes

1. **Add Column**
   ```sql
   ALTER TABLE games 
   ADD COLUMN IF NOT EXISTS stream_ended BOOLEAN DEFAULT FALSE;
   ```

2. **Add Column Comment**
   ```sql
   COMMENT ON COLUMN games.stream_ended IS 
     'True when live stream has ended. Used by Media Tab to show replays without requiring game completion.';
   ```

3. **Create Index**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_games_stream_ended 
   ON games(stream_ended) 
   WHERE stream_ended = true;
   ```

---

## ✅ Verification

### Expected Result
After execution, verify the column exists:

```sql
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name = 'stream_ended';
```

**Expected Output**:
```
column_name   | data_type | column_default | is_nullable
--------------+-----------+----------------+-------------
stream_ended  | boolean   | false          | YES
```

### Verify Index
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE indexname = 'idx_games_stream_ended';
```

**Expected Output**:
```
indexname              | indexdef
-----------------------+--------------------------------------------------------
idx_games_stream_ended | CREATE INDEX idx_games_stream_ended ON games(stream_ended) WHERE stream_ended = true
```

---

## 🔍 Impact Analysis

### Storage Impact
- **Per Row**: 1 byte (boolean)
- **Total**: Minimal (only games with streams need this flag)
- **Index**: Partial index only indexes rows where `stream_ended = true` (minimal overhead)

### Performance Impact
- ✅ **Positive**: Partial index improves Media Tab query performance
- ✅ **No Negative Impact**: Default value prevents NULL checks
- ✅ **Query Optimization**: OR condition `status = 'completed' OR stream_ended = true` is optimized by PostgreSQL

### Backward Compatibility
- ✅ **Fully Compatible**: Default value ensures existing queries work
- ✅ **No Breaking Changes**: All existing code continues to function
- ✅ **Additive Only**: No columns removed or modified

---

## 🚀 Execution Instructions

### For Backend Team

1. **Review Migration**
   - Read `035_add_stream_ended_column.sql`
   - Verify SQL syntax is correct
   - Check for any conflicts with existing schema

2. **Execute in Supabase**
   ```sql
   -- Copy and paste entire migration file into Supabase SQL Editor
   -- Or execute via Supabase CLI
   ```

3. **Verify Results**
   - Run verification queries (see above)
   - Confirm column exists with correct defaults
   - Confirm index was created

4. **Test Media Tab**
   - Verify Media Tab queries work correctly
   - Test with games that have `stream_ended = true`
   - Confirm no performance degradation

---

## 🔄 Rollback Plan

If issues arise, the migration can be rolled back:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_games_stream_ended;

-- Remove column (only if necessary)
ALTER TABLE games DROP COLUMN IF EXISTS stream_ended;
```

**Note**: Rollback is not recommended unless critical issues arise, as this is an additive change with no negative impact.

---

## 📚 Related Documentation

- **Feature Audit**: `statjam/docs/02-development/STREAM_ENDED_FEATURE_AUDIT.md`
- **Database Schema**: `statjam/docs/03-architecture/DATABASE_SCHEMA.md`
- **Service Implementation**: `statjam/src/lib/services/tournamentStreamingService.ts`
- **Hook Implementation**: `statjam/src/hooks/useGameReplays.ts`

---

## ✅ Sign-Off

**Migration Status**: ✅ Ready for Execution  
**Testing Status**: ✅ Verified Locally  
**Documentation Status**: ✅ Complete  
**Backend Team Action**: Execute migration in Supabase

**Last Updated**: February 2026  
**Migration Version**: 035
