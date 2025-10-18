# Backend Fix Required: RLS Policy for game_stats Table

## Issue Summary
**Status**: CRITICAL - Stat recording completely blocked
**Error**: `new row violates row-level security policy for table "stats"` (Error 42501)
**Root Cause**: Missing INSERT policy on `game_stats` table

## Problem Analysis

### What's Happening:
1. ✅ Frontend successfully formats and sends stat data
2. ❌ INSERT into `game_stats` table fails due to missing RLS policy
3. ❌ Since INSERT fails, the trigger never executes
4. ❌ Error message misleadingly references "stats" table

### Current State:
- ✅ `stats` table has `stats_trigger_policy` (correctly applied by backend team)
- ✅ `update_stats_trigger` exists and is active
- ❌ **`game_stats` table missing INSERT policy for authenticated users**

## Required SQL Fix

Execute the following SQL to create the missing RLS policy:

```sql
-- Create INSERT policy for game_stats table
CREATE POLICY "game_stats_insert_policy" ON "public"."game_stats"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Alternative Comprehensive Policy (if needed):
```sql
-- Full CRUD policy for game_stats (if INSERT-only is insufficient)
CREATE POLICY "game_stats_full_policy" ON "public"."game_stats"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

## Verification Steps

After applying the fix, verify with:

```sql
-- 1. Check policy exists
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'game_stats';

-- 2. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'game_stats';
```

Expected results:
- `game_stats_insert_policy` should appear in policies list
- `rowsecurity` should be `true`

## Expected Frontend Result

After fix, frontend should show:
```javascript
📊 GameService: Insert data: {...}
✅ Stat recorded successfully: [data]
```

## Test Cases

The following stat types should all work after the fix:
- `assist`, `block`, `foul`, `steal`, `rebound`
- `field_goal`, `three_pointer`, `free_throw` 
- `turnover`

All currently fail with the same 42501 error.

## Priority: IMMEDIATE
This blocks all stat recording functionality. Frontend implementation is correct and ready.