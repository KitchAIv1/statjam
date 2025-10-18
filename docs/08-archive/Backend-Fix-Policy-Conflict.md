# CRITICAL: Fix RLS Policy Conflict on game_stats Table

## Issue Summary
**Status**: CRITICAL - Policy conflict causing 403 errors
**Root Cause**: Two conflicting RLS policies on `game_stats` table
**Impact**: All stat recording blocked despite correct authentication

## Policy Conflict Analysis

### Current State:
1. **`game_stats_full_policy`**: Allows ALL authenticated users (`qual: "true"`)
2. **`stat_admin_game_stats_policy`**: Only allows if `games.stat_admin_id = auth.uid()`

### Problem:
PostgreSQL RLS requires **ALL active policies to pass**. Even though `game_stats_full_policy` should allow access, the `stat_admin_game_stats_policy` is blocking it because it has a restrictive condition.

## Solution Options

### Option A: Remove Restrictive Policy (RECOMMENDED)
```sql
-- Remove the restrictive policy, keep the permissive one
DROP POLICY IF EXISTS "stat_admin_game_stats_policy" ON "public"."game_stats";

-- Keep only the full access policy
-- (game_stats_full_policy already exists and allows all authenticated users)
```

### Option B: Modify Restrictive Policy to be Permissive
```sql
-- Drop the restrictive policy
DROP POLICY IF EXISTS "stat_admin_game_stats_policy" ON "public"."game_stats";

-- Recreate as a permissive policy with OR condition
CREATE POLICY "stat_admin_game_stats_permissive" ON "public"."game_stats"
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  true OR 
  EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = game_stats.game_id 
    AND g.stat_admin_id = auth.uid()
  )
)
WITH CHECK (
  true OR 
  EXISTS (
    SELECT 1 FROM games g 
    WHERE g.id = game_stats.game_id 
    AND g.stat_admin_id = auth.uid()
  )
);
```

### Option C: Use Single Comprehensive Policy
```sql
-- Remove both existing policies
DROP POLICY IF EXISTS "game_stats_full_policy" ON "public"."game_stats";
DROP POLICY IF EXISTS "stat_admin_game_stats_policy" ON "public"."game_stats";

-- Create single policy that allows authenticated users
CREATE POLICY "game_stats_authenticated_policy" ON "public"."game_stats"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

## Recommended Solution: Option A

**Execute this SQL immediately:**

```sql
-- Remove the restrictive policy that's causing conflicts
DROP POLICY IF EXISTS "stat_admin_game_stats_policy" ON "public"."game_stats";

-- Verify only the permissive policy remains
SELECT policyname, tablename, qual, with_check 
FROM pg_policies 
WHERE tablename = 'game_stats'
ORDER BY policyname;
```

**Expected result after fix:**
- Only `game_stats_full_policy` should remain
- `qual: "true"` and `with_check: "true"` (allows all authenticated)

## Verification Steps

After applying the fix:

```sql
-- 1. Confirm only one policy exists
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE tablename = 'game_stats';
-- Expected: 1

-- 2. Verify the remaining policy is permissive
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'game_stats';
-- Expected: game_stats_full_policy with qual="true"

-- 3. Test insert as authenticated user
INSERT INTO game_stats (
    game_id, player_id, team_id, stat_type, stat_value, 
    modifier, quarter, game_time_minutes, game_time_seconds
) VALUES (
    'c28edbdb-3e03-4cd7-b1f8-15c96b47cde5',
    '550e8400-e29b-41d4-a716-446655440001',
    'ef1257fa-fe27-48c1-a430-5085325719f0',
    'steal', 1, 'made', 3, 12, 0
);
-- Expected: SUCCESS
```

## Frontend Expected Result

After this fix, the frontend should show:
```javascript
📊 GameService: Insert data: {...}
✅ Stat recorded successfully: [data]
```

**No more 403 errors should occur.**

## Priority: IMMEDIATE
This single SQL command will resolve the blocking issue. Execute within 5 minutes.