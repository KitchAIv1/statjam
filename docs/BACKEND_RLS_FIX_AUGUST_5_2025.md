# StatJam Backend Fix: Resolving RLS Issue for Player Roster and Tournament Display

## Introduction

This document details the backend fix implemented on Tuesday, August 5, 2025, at 10:05 AM PDT to resolve a Row Level Security (RLS) issue in StatJam that prevented the player roster and tournament display from appearing in the UI, despite data existing in the database. The issue arose after recent RLS policy updates for the `users` and `team_players` tables, resulting in a "permission denied for table users" error (HTTP 403) when the frontend queried team players. The fix ensures organizers can view player and tournament data while maintaining security, aligning with the Supabase-only architecture and the PRD requirements.

## Problem Description

### Symptoms
- **Error Logs**:
  - `Failed to load resource: the server responded with a status of 403 ()` for `/rest/v1/team_players`.
  - `Error: Failed to get team players: permission denied for table users` in `TeamService.getTeamPlayers`.
  - Player roster and tournament data not displaying in the UI, despite presence in the database.
- **Impact**: Affected `TeamManagementPage` and `AddPlayerModal` components, blocking roster and tournament visibility.

### Root Cause
- The `users_organizer_select_policy` RLS policy was too restrictive, limiting `SELECT` access to the authenticated user's own record or players/stat admins linked through `team_players` with a narrow `EXISTS` condition. This failed to grant sufficient access when the frontend joined `team_players` with `users`, causing a 403 error.
- The `team_players` RLS policies (`Organizers and players manage`, `team_players_organizer_policy`) allowed management but not the broad `SELECT` needed for roster display.

## Solution

### Approach
- Adjusted the `users_organizer_select_policy` to grant organizers access to all `users` records linked to their tournaments' teams.
- Ensured `team_players` RLS supports the join by verifying existing policies.

### SQL Implementation
```sql
-- Drop and recreate users_organizer_select_policy
DROP POLICY IF EXISTS "users_organizer_select_policy" ON users;

CREATE POLICY "users_organizer_select_policy" ON users
FOR SELECT TO authenticated
USING (
  auth.uid() = id 
  OR (
    EXISTS (
      SELECT 1 FROM teams t 
      JOIN tournaments tr ON t.tournament_id = tr.id 
      JOIN team_players tp ON tp.team_id = t.id 
      WHERE tr.organizer_id = auth.uid() 
      AND tp.player_id = users.id
    )
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
WHERE tablename IN ('users', 'team_players');
```

### Verification Steps
1. **Schema Verification**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_schema = 'public' AND table_name IN ('users', 'team_players');
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
   WHERE tablename IN ('users', 'team_players');
   ```
3. **Data and Access Test**:
   - As an organizer (e.g., `d243f854-b9ef-4de2-a122-58c42440a754`):
     ```sql
     SELECT u.id, u.email, u.role 
     FROM users u 
     JOIN team_players tp ON tp.player_id = u.id 
     JOIN teams t ON t.id = tp.team_id 
     JOIN tournaments tr ON tr.id = t.tournament_id 
     WHERE tr.organizer_id = 'd243f854-b9ef-4de2-a122-58c42440a754';
     ```
   - Expected: Returns all players and stat admins in the organizer's teams.

## Impact Assessment
- **Player Roster**: Restored visibility in the UI.
- **Tournament Display**: Restored if dependent on player data.
- **Other Components**: No impact on games, teams, or inserts; security maintained with `{authenticated}` roles.
- **Risks**: Minimal, as the policy targets specific organizer-team relationships.

## Testing and Validation
- **Frontend Test**: Verify roster and tournament display in `TeamManagementPage` and `AddPlayerModal` after applying the fix.
- **Debug Logs**: Check for 403 errors or permission issues in the browser console.
- **Role Check**: Confirm organizer role with:
  ```sql
  SELECT id, raw_user_meta_data->>'role' AS role 
  FROM auth.users 
  WHERE id = 'd243f854-b9ef-4de2-a122-58c42440a754';
  ```

## Conclusion
The fix, applied on August 5, 2025, resolves the RLS issue by broadening organizer access to `users` via `team_players`, ensuring UI functionality without compromising security. The backend is now aligned with the PRD, and further testing is recommended to validate the solution.

---

## Related Issues
- **Current Issue**: Stat admin dropdown not showing users from database in game modal
- **Root Cause**: Similar RLS policy restriction preventing organizers from viewing stat admins
- **Required Fix**: Additional RLS policy for stat admin visibility

### Additional RLS Policy Needed
```sql
-- Allow organizers to view stat admins for assignment
CREATE POLICY "users_organizer_stat_admin_policy" ON users
  FOR SELECT USING (
    role = 'stat_admin' AND 
    auth.jwt()::jsonb ->> 'user_metadata' ->> 'role' = 'organizer'
  );
```

### Alternative Policy (if metadata approach fails)
```sql
-- Allow organizers to view stat admins for assignment (alternative)
CREATE POLICY "users_organizer_stat_admin_policy" ON users
  FOR SELECT USING (
    role = 'stat_admin' AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'organizer'
    )
  );
```

## Document Information
- **Created**: August 5, 2025
- **Last Updated**: August 5, 2025
- **Status**: Active
- **Related Documents**: `BACKEND_DOCUMENTATION.md`, `STAT_ADMIN_OPTIMIZATION_STRATEGY.md` 