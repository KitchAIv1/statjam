# URGENT: Critical Trigger Issue - Stats Table RLS Policy Still Wrong

## Issue Summary
**Status**: CRITICAL - Trigger execution blocked by stats table RLS policy
**Root Cause**: Backend team fixed wrong table policies
**Impact**: Complete stat recording system failure

## The Real Problem Flow

```
1. Frontend → INSERT into game_stats (this would work)
2. PostgreSQL → Executes RLS check on game_stats (✅ PASSES - fixed)
3. PostgreSQL → Fires update_stats_trigger 
4. Trigger → Tries to INSERT/UPSERT into stats table
5. PostgreSQL → Executes RLS check on stats table (❌ FAILS - not fixed)
6. Transaction → ROLLBACK entire operation
7. Frontend → Gets 403 error saying "stats table RLS violation"
```

## What Backend Team Fixed (Partially Correct)
- ✅ `game_stats` table: Added `game_stats_full_policy` 
- ✅ Removed conflicting `stat_admin_game_stats_policy`

## What Backend Team MISSED (The Real Issue)
- ❌ `stats` table: Still has wrong/missing RLS policies for triggers
- ❌ Triggers run in different security context than user requests

## Required Immediate Fix

The backend team needs to fix the `stats` table RLS policy for triggers:

```sql
-- Option 1: Add permissive policy for stats table (RECOMMENDED)
CREATE POLICY "stats_authenticated_policy" ON "public"."stats"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

## Alternative Fixes

### Option 2: Trigger-specific policy
```sql
-- Create policy specifically for trigger operations
CREATE POLICY "stats_trigger_operations" ON "public"."stats"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### Option 3: Security definer function
```sql
-- Make trigger function run with elevated privileges
CREATE OR REPLACE FUNCTION update_stats_function()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
-- (existing trigger function code)
$$;
```

## Verification Commands

After applying the fix, test the complete flow:

```sql
-- 1. Verify stats table policies
SELECT policyname, tablename, cmd, roles 
FROM pg_policies 
WHERE tablename = 'stats';

-- 2. Test direct insert into stats (should work)
INSERT INTO stats (match_id, player_id, field_goals_made, created_at, updated_at)
VALUES (
  'c28edbdb-3e03-4cd7-b1f8-15c96b47cde5',
  '550e8400-e29b-41d4-a716-446655440001',
  1,
  NOW(),
  NOW()
) ON CONFLICT (match_id, player_id) DO UPDATE SET
  field_goals_made = stats.field_goals_made + EXCLUDED.field_goals_made,
  updated_at = NOW();

-- 3. Test the complete flow (insert into game_stats to trigger stats update)
INSERT INTO game_stats (
  game_id, player_id, team_id, stat_type, stat_value,
  modifier, quarter, game_time_minutes, game_time_seconds
) VALUES (
  'c28edbdb-3e03-4cd7-b1f8-15c96b47cde5',
  '550e8400-e29b-41d4-a716-446655440001',
  'ef1257fa-fe27-48c1-a430-5085325719f0',
  'steal', 1, 'made', 3, 12, 0
);
```

## Expected Results After Fix

1. **No more 403 errors** from frontend
2. **Successful stat recording** in both tables
3. **Working trigger aggregation** 

## Frontend Expected Success Pattern

```javascript
🔍 DEBUG: About to make Supabase INSERT request...
✅ Stat recorded successfully: [data_with_id]
```

## Priority: IMMEDIATE

This is the final fix needed. The authentication debugging proved the issue is in the trigger/stats table interaction, not the frontend or game_stats table.

**Execute the stats table RLS policy fix within 15 minutes.**