# Official Team Flag Implementation Summary

**Date**: January 5, 2025  
**Status**: ✅ Complete  
**Purpose**: Add team-level flag to distinguish official games from practice games for player statistics

---

## Overview

Implemented a team-level `is_official_team` flag that controls whether games from a coach's team count toward player statistics. This ensures player dashboards only show meaningful competitive games while respecting the coach's judgment about what constitutes an "official" game.

---

## Key Design Decisions

1. **Team-level flag** (not game-level): All games within a team inherit the team's official/practice status
2. **Default: Practice** (`is_official_team = false`): Coaches must explicitly mark teams as official
3. **UI placement**: Team creation/edit flow with clear impact messaging
4. **Existing teams**: All marked as practice (`false`) to maintain statistical integrity
5. **Custom players**: Unaffected - they don't have player dashboards

---

## Implementation Details

### Database Changes

**Migration**: `database/migrations/006_add_official_team_flag.sql`

- Added `is_official_team BOOLEAN DEFAULT FALSE` column to `teams` table
- Updated all existing coach teams to practice mode (safe default)
- Created index for efficient filtering: `idx_teams_official_status`
- Created new RLS function: `player_has_game_stats_official()`
- Updated games RLS policy: `games_player_view_official_only`

**RLS Logic**:
```sql
-- Players can only see games where:
-- 1. Tournament games (always official), OR
-- 2. Coach games from official teams only
```

### Frontend Changes

**Files Modified**:
1. `src/lib/types/coach.ts` - Added `is_official_team` to interfaces
2. `src/lib/services/coachTeamService.ts` - Updated queries to include flag
3. `src/components/coach/CreateCoachTeamModal.tsx` - Added toggle with impact messaging
4. `src/components/coach/CoachTeamCard.tsx` - Added edit modal and visual badge
5. `database/migrations/006_add_official_team_flag.sql` - New migration file

**UI Components**:

1. **Create Team Modal**:
   - Toggle switch for team type
   - Real-time impact messaging (blue for official, amber for practice)
   - Clear explanation of consequences

2. **Edit Team Modal** (NEW):
   - Full edit functionality implemented
   - Team name editing
   - Team type toggle
   - Warning alert when changing from official to practice
   - Prevents accidental data loss

3. **Team Card Badge**:
   - Blue "Official" badge with trophy icon
   - Amber "Practice" badge with dumbbell icon
   - Visible at all screen sizes

---

## User Experience Flow

### Creating a Team

1. Coach opens "Create Team" modal
2. Fills in team details
3. Sees "Team Type" section with toggle (defaults to OFF/Practice)
4. When toggled:
   - **OFF (Practice)**: Amber message - "Games are for your analysis only"
   - **ON (Official)**: Blue message - "Games will count toward player statistics"
5. Creates team with chosen type

### Editing a Team

1. Coach clicks "Edit" button on team card
2. Can update team name
3. Can toggle team type
4. If changing from Official → Practice:
   - **Red warning alert** appears
   - "This will remove games from player statistics. Cannot be undone."
5. Saves changes

### Viewing Teams

- Team cards display badge next to team name:
  - **Official**: Blue badge with trophy icon
  - **Practice**: Amber outline badge with dumbbell icon

---

## Player Dashboard Impact

**Before**: Players saw stats from ALL games (tournament + coach games, regardless of status)

**After**: Players only see stats from:
- ✅ All tournament games (always official)
- ✅ Coach games from official teams only
- ❌ Coach games from practice teams (filtered out)

**Technical**: The RLS function `player_has_game_stats_official()` handles filtering automatically at the database level - no frontend changes needed in player dashboard.

---

## Edge Cases Handled

1. **Custom Players**: Unaffected - they don't have player dashboards, so the flag doesn't impact them
2. **Mixed Rosters**: StatJam users on practice teams won't have those games in their stats
3. **Organizer/Stat Admin**: Unaffected - they see all games regardless of team type
4. **Coach Analytics**: Still show ALL games (official + practice) for coach's own analysis
5. **Existing Teams**: All safely marked as practice to prevent accidental stat pollution

---

## Testing Checklist

### Database
- ✅ Migration runs successfully
- ✅ Existing coach teams marked as practice
- ✅ RLS function filters correctly
- ✅ Index created for performance

### Coach Flow
- ✅ Create official team → UI shows blue messaging
- ✅ Create practice team → UI shows amber messaging
- ✅ Edit team name → saves correctly
- ✅ Toggle team from practice to official → no warning
- ✅ Toggle team from official to practice → red warning appears

### Player Dashboard
- ✅ Only shows games from official teams + tournament games
- ✅ Practice games correctly excluded
- ✅ Stats calculations exclude practice games
- ✅ No errors or infinite recursion

### UI/UX
- ✅ Badges display correctly on team cards
- ✅ Toggle switches work smoothly
- ✅ Impact messaging is clear and helpful
- ✅ Warning alerts are prominent
- ✅ Mobile responsive

---

## Rollback Plan

If issues arise:

```sql
-- Remove RLS function changes
DROP FUNCTION IF EXISTS player_has_game_stats_official(uuid, uuid);

-- Restore original policy
DROP POLICY IF EXISTS "games_player_view_official_only" ON games;
CREATE POLICY "games_player_view_no_recursion" ON games
  FOR SELECT TO authenticated
  USING (player_has_game_stats(auth.uid(), id));

-- Remove column (if necessary)
ALTER TABLE teams DROP COLUMN IF EXISTS is_official_team;
```

---

## Success Metrics

✅ **Coaches can clearly distinguish official vs practice teams**  
✅ **Player statistics only include official games**  
✅ **UI clearly communicates impact on player stats**  
✅ **No breaking changes to existing functionality**  
✅ **Custom players continue working normally**  
✅ **No linting errors**  
✅ **All todos completed**

---

## Future Enhancements

- Add bulk team type update (change multiple teams at once)
- Add team type filter in "My Teams" view
- Add analytics showing official vs practice game breakdown
- Add notification to players when they're added to an official team

---

## Related Documentation

- Database Schema: `docs/03-architecture/DATABASE_SCHEMA.md`
- Coach Features: `docs/04-features/coach-team-card/COACH_TEAM_CARD_IMPLEMENTATION.md`
- RLS Policies: `docs/05-database/RLS_POLICIES.md`

