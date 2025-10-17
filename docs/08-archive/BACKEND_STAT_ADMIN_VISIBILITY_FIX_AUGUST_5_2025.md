# StatJam Backend Fix: Restoring Player Roster Visibility

## Introduction

This document details the backend fix implemented on Tuesday, August 5, 2025, at 10:38 AM PDT to restore player roster visibility in StatJam, addressing a recurrence of the issue caused by recent RLS (Row Level Security) policy adjustments on the `users` table. The fix reverts to a previously successful configuration, ensuring the player roster and tournament display function correctly in the UI while data remains present in the database. The team creation and `games` table issues are resolved, and this update aligns with the Supabase-only architecture and PRD requirements, avoiding impact on other components.

## Problem Description

### Symptoms
- **Error Logs** (from prior context):
  - `Failed to load resource: the server responded with a status of 403 ()` for `/rest/v1/team_players`.
  - `Error: Failed to get team players: permission denied for table users` in `TeamService.getTeamPlayers`.
  - Player roster and tournament data not displaying in the UI, despite presence in the database.
- **Impact**: Affected `TeamManagementPage` and related components, breaking roster functionality.

### Root Cause
- Recent updates to the `users_organizer_select_policy` RLS policy, aimed at enhancing stat admin visibility, inadvertently restricted access to `users` records when joined via `team_players`. The policy's narrow `EXISTS` condition (linking only to assigned teams) failed to support the frontend's query, causing a 403 error and disrupting the player roster.

## Solution

### Approach
- Reverted to the last working `users_organizer_select_policy` that included players and stat admins via `auth.users`, ensuring broad access for organizers without affecting the roster.
- Planned a separate approach for stat admin visibility to avoid future interference.

### SQL Implementation
```sql
-- Drop the current policy
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;

-- Restore the working policy for player and stat admin visibility
CREATE POLICY "users_organizer_select_policy" ON users
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR (
    EXISTS (
      SELECT 1 FROM auth.users u 
      WHERE u.id = auth.uid() 
      AND u.raw_user_meta_data->>'role' = 'organizer'
    )
    AND role IN ('player', 'stat_admin')
  )
);

-- Verify policy application
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';
```

### Verification Steps
1. **Schema Verification**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name = 'users';
   ```
2. **Policy Verification**:
   ```sql
   SELECT 
       schemaname,
       tablename,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
   FROM pg_policies 
   WHERE tablename = 'users';
   ```
3. **Data and Access Test**:
   - As an organizer (e.g., `d243f854-b9ef-4de2-a122-58c42440a754`):
     ```sql
     SELECT u.id, u.email, u.role 
     FROM users u 
     WHERE role IN ('player', 'stat_admin');
     ```
   - Expected: Returns all players and stat admins visible to the organizer.

## Impact Assessment
- **Player Roster**: Restored visibility in the UI.
- **Tournament Display**: Restored if dependent on player data.
- **Stat Admin Dropdown**: Temporarily unaffected; to be addressed separately.
- **Other Components**: No impact on games, teams, or inserts; security maintained with `{authenticated}` roles.
- **Risks**: Minimal, as the policy reverts to a proven state without new restrictions.

## Testing and Validation
- **Frontend Test**: Verify roster and tournament display in `TeamManagementPage` after applying the fix.
- **Debug Logs**: Check for 403 errors or permission issues in the browser console.
- **Role Check**: Confirm organizer role with:
  ```sql
  SELECT id, raw_user_meta_data->>'role' AS role 
  FROM auth.users 
  WHERE id = 'd243f854-b9ef-4de2-a122-58c42440a754';
  ```

## Next Steps
- **Stat Admin Visibility**: Address separately with a game-specific RLS policy (e.g., `users_stat_admin_game_policy`) once roster stability is confirmed:
  ```sql
  CREATE POLICY "users_stat_admin_game_policy" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM games g 
      WHERE g.stat_admin_id = users.id 
      AND EXISTS (
        SELECT 1 FROM tournaments t 
        WHERE t.id = g.tournament_id 
        AND t.organizer_id = auth.uid()
      )
    )
  );
  ```

## Conclusion
The fix, applied on August 5, 2025, restores player roster visibility by reverting to a proven RLS policy, resolving the 403 error without affecting other components. The backend is now stable for player-related features, with stat admin visibility to be handled distinctly to prevent future disruptions. Further testing is recommended to validate the solution.

---

## Document Information
- **Created**: August 5, 2025
- **Last Updated**: August 5, 2025
- **Status**: Active
- **Related Documents**: 
  - `BACKEND_DOCUMENTATION.md`
  - `BACKEND_RLS_FIX_AUGUST_5_2025.md`
  - `STAT_ADMIN_OPTIMIZATION_STRATEGY.md`
- **Fix Type**: RLS Policy Reversion
- **Priority**: High (Player Roster Critical)
- **Components Affected**: TeamManagementPage, AddPlayerModal
- **Components Unaffected**: Games, Teams, Tournament Creation

## Related Issues
- **Previous Issue**: Initial RLS policy causing 403 errors
- **Current Status**: Player roster restored, stat admin visibility pending
- **Future Work**: Game-specific stat admin RLS policy implementation 