# Phase 3 Migration - Step-by-Step Guide

## 🎯 Overview

This guide walks you through applying the Phase 3 possession tracking migration safely.

---

## ⚠️ **IMPORTANT: If You Already Started**

If you already ran part of the migration and got errors, **run the rollback first**:

```sql
-- Run this in Supabase SQL Editor:
-- File: docs/05-database/migrations/011_possession_tracking_ROLLBACK.sql
```

This will clean up any partial migration state.

---

## 📋 **Step-by-Step Migration**

### **Step 1: Backup (Optional but Recommended)**

```sql
-- Create a backup of your games table structure
CREATE TABLE games_backup_20251028 AS 
SELECT * FROM games LIMIT 0;

-- Verify backup created
SELECT COUNT(*) FROM games_backup_20251028;
```

---

### **Step 2: Run the Migration**

**Option A: Run Full Migration (Recommended)**
```sql
-- Copy and paste the ENTIRE contents of:
-- docs/05-database/migrations/011_possession_tracking.sql
-- into Supabase SQL Editor and run
```

**Option B: Run Step-by-Step (For Debugging)**

1. **Part 1: Create Table**
```sql
-- Lines 11-58 from migration file
-- Creates game_possessions table with indexes
```

2. **Part 2: Add Columns to Games**
```sql
-- Lines 60-77 from migration file
-- Adds possession columns to games table
```

3. **Part 3: RLS Policies**
```sql
-- Lines 79-130 from migration file
-- Sets up row-level security
```

4. **Part 4: Triggers and Functions**
```sql
-- Lines 132-206 from migration file
-- Creates auto-calculation logic
```

5. **Part 5: Helper Functions**
```sql
-- Lines 208-239 from migration file
-- Adds utility functions
```

6. **Part 6: Validation**
```sql
-- Lines 241-288 from migration file
-- Validates migration success
```

---

### **Step 3: Verify Migration**

Run these queries to confirm everything worked:

```sql
-- 1. Check table exists
SELECT COUNT(*) FROM game_possessions;
-- Expected: 0 (empty table)

-- 2. Check columns added to games
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'games'
  AND column_name IN (
    'current_possession_team_id',
    'jump_ball_arrow_team_id',
    'possession_changed_at'
  );
-- Expected: 3 rows

-- 3. Check triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_update_possession_duration',
  'trigger_update_possession_changed_at'
);
-- Expected: 2 rows

-- 4. Check functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'calculate_possession_duration',
  'update_possession_duration',
  'update_possession_changed_at',
  'get_current_possession',
  'get_possession_stats'
);
-- Expected: 5 rows

-- 5. Check RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'game_possessions';
-- Expected: 4 rows
```

---

### **Step 4: Test Trigger**

Test that duration auto-calculates:

```sql
-- Insert test possession
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
  '00000000-0000-0000-0000-000000000000', -- Dummy game ID
  '00000000-0000-0000-0000-000000000001', -- Dummy team ID
  1,  -- Quarter 1
  10, -- Start: 10:30
  30,
  1,  -- Quarter 1
  8,  -- End: 8:15
  15
);

-- Check duration calculated correctly
SELECT 
  start_time_minutes,
  start_time_seconds,
  end_time_minutes,
  end_time_seconds,
  duration_seconds
FROM game_possessions
WHERE team_id = '00000000-0000-0000-0000-000000000001';

-- Expected duration: (10*60+30) - (8*60+15) = 630 - 495 = 135 seconds

-- Clean up test data
DELETE FROM game_possessions 
WHERE team_id = '00000000-0000-0000-0000-000000000001';
```

---

## ✅ **Success Criteria**

Migration is successful if:

- ✅ `game_possessions` table exists
- ✅ 3 new columns added to `games` table
- ✅ 2 triggers created
- ✅ 5 functions created
- ✅ 4 RLS policies created
- ✅ Duration auto-calculates correctly

---

## 🚨 **Troubleshooting**

### **Error: "column duration_seconds does not exist"**
**Solution**: You're running an old version of the migration. Use the fixed version.

### **Error: "policy already exists"**
**Solution**: Run the rollback script first, then re-run migration.

### **Error: "relation game_possessions already exists"**
**Solution**: Run the rollback script first, then re-run migration.

### **Error: "function already exists"**
**Solution**: The migration uses `CREATE OR REPLACE`, so this shouldn't happen. If it does, run rollback first.

---

## 🔄 **If You Need to Rollback**

```sql
-- Run the rollback script:
-- docs/05-database/migrations/011_possession_tracking_ROLLBACK.sql

-- Then you can re-run the migration from scratch
```

---

## 📝 **Next Steps After Migration**

1. ✅ Migration complete
2. 🚀 Continue with Phase 3 implementation
3. 🔧 Integrate possession tracking into `useTracker`
4. 🎨 Add possession indicator UI
5. 🧪 Test with live games

---

## 📚 **Related Documentation**

- [Phase 3 Migration Fix](./PHASE3_MIGRATION_FIX.md)
- [Phase 3 Refactor Plan](../03-architecture/DUAL_ENGINE_PHASED_REFACTOR_PLAN.md)
- [Possession Engine](../../src/lib/engines/possessionEngine.ts)

---

## ✅ **Status**

**Migration**: READY  
**Tested**: YES  
**Safe to Run**: YES  
**Breaking Changes**: NONE (additive only)

