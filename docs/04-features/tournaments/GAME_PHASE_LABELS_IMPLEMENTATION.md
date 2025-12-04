# Game Phase Labels Implementation

**Date:** December 4, 2024  
**Version:** 0.17.2  
**Status:** ✅ Frontend Complete (Backend Migration Pending)

---

## Overview

Added manual game phase labeling system (REGULAR, PLAYOFFS, FINALS) to help organizers categorize games until the bracket system is fully implemented.

---

## Implementation Summary

### ✅ Completed

1. **Database Migration SQL** (`docs/05-database/migrations/021_add_game_phase.sql`)
   - Adds `game_phase` column to `games` table
   - CHECK constraint: `'regular' | 'playoffs' | 'finals'`
   - Default value: `'regular'`
   - Index for filtering performance

2. **TypeScript Interface** (`src/lib/types/game.ts`)
   - Added `game_phase?: 'regular' | 'playoffs' | 'finals'` to `Game` interface

3. **Create/Edit Game Form** (`src/app/dashboard/tournaments/[id]/schedule/page.tsx`)
   - Added "Game Phase" dropdown in `CreateGameModal`
   - Options: Regular, Playoffs, Finals
   - Positioned after Venue, before Stat Admin
   - Optional field (defaults to Regular)

4. **GameService Updates** (`src/lib/services/gameService.ts`)
   - `createGame()` now accepts `gamePhase` parameter
   - `updateGame()` now accepts `gamePhase` parameter
   - Both methods handle `game_phase` in database operations

5. **Display Components**
   - **OrganizerGameScheduler**: Phase badge next to tournament name
   - **Schedule Page GameCard**: Phase badge next to status badge
   - **ScheduleTab (Public)**: Phase badge next to status badge

---

## Phase Badge Styling

| Phase | Background | Text | Border |
|-------|------------|------|--------|
| **Regular** | Not displayed (default) | - | - |
| **Playoffs** | Orange (`bg-orange-100`) | Orange (`text-orange-800`) | Orange (`border-orange-200`) |
| **Finals** | Amber/Gold (`bg-amber-100`) | Amber (`text-amber-800`) | Amber (`border-amber-200`) |

**Public Tournament View:**
- Playoffs: `bg-orange-500/20 text-orange-400 border-orange-500/50`
- Finals: `bg-amber-500/20 text-amber-400 border-amber-500/50`

---

## Next Steps

### 🔴 Required: Backend Migration

**Action Required:** Backend team needs to run the migration SQL:

```sql
-- File: docs/05-database/migrations/021_add_game_phase.sql
```

**Steps:**
1. Run the migration SQL in Supabase SQL Editor
2. Verify column exists: `SELECT column_name FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'game_phase';`
3. Test: Create a game with phase label and verify it saves correctly

---

## Usage

### For Organizers

1. **Creating a Game:**
   - Navigate to Tournament → Schedule
   - Click "Schedule Game"
   - Fill in game details
   - Select "Game Phase" from dropdown (Regular/Playoffs/Finals)
   - Save game

2. **Editing a Game:**
   - Click "Edit" on any game
   - Change "Game Phase" if needed
   - Save changes

### For Public Viewers

- Phase badges appear next to game status in:
  - Tournament Schedule tab
  - Game cards
  - Organizer game list

---

## Future Enhancements

1. **Auto-Assignment from Bracket:**
   - When bracket system is implemented, auto-assign phases based on bracket position
   - Keep manual override option

2. **Filtering:**
   - Add filter by phase in schedule views
   - "Show only Finals" option

3. **Sorting:**
   - Sort games by phase (Finals first, then Playoffs, then Regular)

4. **Extended Labels:**
   - Consider adding "Quarterfinals", "Semifinals" if needed
   - Currently kept simple with 3 labels

---

## Files Modified

| File | Changes |
|------|---------|
| `docs/05-database/migrations/021_add_game_phase.sql` | ✅ New migration file |
| `src/lib/types/game.ts` | ✅ Added `game_phase` field |
| `src/lib/services/gameService.ts` | ✅ Added `gamePhase` to create/update |
| `src/app/dashboard/tournaments/[id]/schedule/page.tsx` | ✅ Added form field, updated save handler, added badge to GameCard |
| `src/components/OrganizerGameScheduler.tsx` | ✅ Added phase badge helper and display |
| `src/components/tournament/tabs/ScheduleTab.tsx` | ✅ Added phase badge display |

---

## Testing Checklist

- [ ] Backend migration executed successfully
- [ ] Create game with "Regular" phase → saves correctly
- [ ] Create game with "Playoffs" phase → saves and displays badge
- [ ] Create game with "Finals" phase → saves and displays badge
- [ ] Edit game phase → updates correctly
- [ ] Phase badges display in OrganizerGameScheduler
- [ ] Phase badges display in Schedule page
- [ ] Phase badges display in public ScheduleTab
- [ ] Default phase is "Regular" when not specified

---

*Implementation completed: December 4, 2024*  
*Backend migration pending*

