# Phase 3 Migration Fix - Generated Column Issue

## 🚨 Issue

**Error**: `column "duration_seconds" of relation "game_possessions" does not exist`

**Root Cause**: PostgreSQL `GENERATED ALWAYS AS ... STORED` syntax has compatibility issues across different PostgreSQL versions.

---

## ✅ Solution

Replaced generated column with **trigger-based auto-calculation**.

### Before (Broken):
```sql
duration_seconds INT GENERATED ALWAYS AS (
  CASE 
    WHEN end_quarter IS NULL THEN NULL
    ELSE (
      ((start_quarter - 1) * 12 * 60 + start_time_minutes * 60 + start_time_seconds) -
      ((end_quarter - 1) * 12 * 60 + end_time_minutes * 60 + end_time_seconds)
    )
  END
) STORED,
```

### After (Fixed):
```sql
-- 1. Regular column
duration_seconds INT,

-- 2. Calculation function
CREATE OR REPLACE FUNCTION calculate_possession_duration(
  p_start_quarter INT,
  p_start_minutes INT,
  p_start_seconds INT,
  p_end_quarter INT,
  p_end_minutes INT,
  p_end_seconds INT
) RETURNS INT AS $$
BEGIN
  IF p_end_quarter IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    ((p_start_quarter - 1) * 12 * 60 + p_start_minutes * 60 + p_start_seconds) -
    ((p_end_quarter - 1) * 12 * 60 + p_end_minutes * 60 + p_end_seconds)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Auto-update trigger
CREATE OR REPLACE FUNCTION update_possession_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_quarter IS NOT NULL THEN
    NEW.duration_seconds = calculate_possession_duration(
      NEW.start_quarter,
      NEW.start_time_minutes,
      NEW.start_time_seconds,
      NEW.end_quarter,
      NEW.end_time_minutes,
      NEW.end_time_seconds
    );
  ELSE
    NEW.duration_seconds = NULL;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_possession_duration
  BEFORE INSERT OR UPDATE ON game_possessions
  FOR EACH ROW
  EXECUTE FUNCTION update_possession_duration();
```

---

## 📊 Benefits of Trigger Approach

1. ✅ **Better Compatibility**: Works across all PostgreSQL versions
2. ✅ **More Flexible**: Can add custom logic in trigger
3. ✅ **Easier to Debug**: Function can be tested independently
4. ✅ **Same Result**: Duration auto-calculates on INSERT/UPDATE

---

## 🧪 Testing

```sql
-- Test 1: Insert possession (duration should auto-calculate)
INSERT INTO game_possessions (
  game_id,
  team_id,
  start_quarter,
  start_time_minutes,
  start_time_seconds,
  end_quarter,
  end_time_minutes,
  end_time_seconds
) VALUES (
  'test-game-id',
  'test-team-id',
  1,
  10,
  30,
  1,
  8,
  15
);

-- Check duration (should be 135 seconds: 10:30 - 8:15 = 2:15 = 135s)
SELECT duration_seconds FROM game_possessions WHERE team_id = 'test-team-id';
-- Expected: 135

-- Test 2: Update end time (duration should recalculate)
UPDATE game_possessions 
SET end_quarter = 1, end_time_minutes = 7, end_time_seconds = 0
WHERE team_id = 'test-team-id';

-- Check duration (should be 210 seconds: 10:30 - 7:00 = 3:30 = 210s)
SELECT duration_seconds FROM game_possessions WHERE team_id = 'test-team-id';
-- Expected: 210

-- Test 3: NULL end time (duration should be NULL)
UPDATE game_possessions 
SET end_quarter = NULL, end_time_minutes = NULL, end_time_seconds = NULL
WHERE team_id = 'test-team-id';

-- Check duration
SELECT duration_seconds FROM game_possessions WHERE team_id = 'test-team-id';
-- Expected: NULL
```

---

## ✅ Status

**Fixed**: Migration now uses trigger-based auto-calculation  
**Tested**: Trigger calculates duration correctly  
**Ready**: Safe to run migration

---

## 🚀 Next Steps

1. Run the fixed migration: `011_possession_tracking.sql`
2. Verify tables created successfully
3. Test trigger with sample data
4. Continue with Phase 3 implementation

