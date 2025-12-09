# Leaders Tab: Game Phase Filter Improvement

## Overview

The Leaders tab currently has a game phase filter (All Games, Regular Season, Playoffs, Finals), but it uses **two different code paths** that produce inconsistent results (photos missing on filtered views).

This document outlines the recommended fix to use a **single, scalable approach**.

---

## Current State (Problematic)

```
┌─────────────────────────────────────────────────────────────┐
│ "All Games"        → Pre-computed table → ✅ Has photos     │
│ "Regular/Playoffs" → Fallback calculation → ⚠️ No photos   │
└─────────────────────────────────────────────────────────────┘
```

**Issue:** Two code paths = inconsistent behavior, maintenance burden.

---

## Recommended Solution: Option A

Add `game_phase` column to `tournament_leaders` table and pre-compute stats per phase.

```
┌─────────────────────────────────────────────────────────────┐
│ ALL filters → Pre-computed table (filtered) → ✅ Has photos │
└─────────────────────────────────────────────────────────────┘
```

**Result:** One code path, consistent output, scalable.

---

## Backend Changes Required (Supabase Team)

### 1. Schema Change

Add column to `tournament_leaders` table:

```sql
ALTER TABLE tournament_leaders 
ADD COLUMN game_phase TEXT DEFAULT 'all';

-- Create index for performance
CREATE INDEX idx_tournament_leaders_game_phase 
ON tournament_leaders(tournament_id, game_phase);
```

### 2. Update Pre-Compute Trigger/Function

The trigger that populates `tournament_leaders` should:

1. **Group stats by game_phase** from `games.game_phase`
2. **Insert multiple rows** per player (one per phase they played in)
3. **Always include an "all" row** for aggregate stats

### 3. Example Data Structure

After pre-compute:

| player_id | tournament_id | game_phase | total_points | total_rebounds | profile_photo_url |
|-----------|---------------|------------|--------------|----------------|-------------------|
| abc123    | tour-001      | all        | 150          | 45             | https://...       |
| abc123    | tour-001      | regular    | 100          | 30             | https://...       |
| abc123    | tour-001      | playoffs   | 50           | 15             | https://...       |
| xyz789    | tour-001      | all        | 80           | 20             | https://...       |
| xyz789    | tour-001      | regular    | 80           | 20             | https://...       |

### 4. Re-populate Existing Data

After updating the trigger, run the pre-compute for all existing tournaments to populate the new column.

---

## Frontend Changes Required

### File: `src/lib/services/tournamentLeadersService.ts`

**Current (line ~102-107):**
```typescript
// ⚡ FAST PATH: Try pre-computed table first (only for 'all' games)
if (gamePhase === 'all') {
  const precomputedLeaders = await this.fetchPrecomputedLeaders(tournamentId, minGames);
  // ...
}
```

**After Backend Ready:**
```typescript
// ⚡ FAST PATH: Always use pre-computed table (supports all game phases)
const precomputedLeaders = await this.fetchPrecomputedLeaders(tournamentId, minGames, gamePhase);
if (precomputedLeaders.length > 0) {
  return this.sortLeaders(precomputedLeaders, category);
}
```

### File: `fetchPrecomputedLeaders` method

Add `game_phase` to the query filter:

```typescript
const filters: Record<string, string> = { 
  tournament_id: `eq.${tournamentId}`,
  game_phase: `eq.${gamePhase}`  // NEW
};
```

### Optional: Remove Fallback Path

Once backend is ready and tested, the `calculateLeadersFromGameStats` fallback can be simplified or removed for game phase filtering.

---

## Timeline Estimate

| Task | Owner | Time |
|------|-------|------|
| Add `game_phase` column | Backend | 15 min |
| Update pre-compute trigger | Backend | 1-2 hours |
| Re-populate existing data | Backend | 30 min |
| Update frontend query | Frontend | 15 min |
| Testing | Both | 30 min |

**Total: ~3-4 hours**

---

## Benefits

1. **Consistent output** - Photos always included
2. **Single code path** - Easier to maintain
3. **Better performance** - Pre-computed for all filters
4. **Scalable** - Ready for future filter additions

---

## Status

- [x] Game phase filter UI implemented (temporary fallback)
- [x] Backend: Add `game_phase` column ✅ **COMPLETED**
- [x] Backend: Update pre-compute trigger ✅ **COMPLETED** (SQL function created)
- [x] Backend: Re-populate existing data ✅ **COMPLETED** (via SQL function)
- [x] Frontend: Update to use single code path ✅ **COMPLETED**
- [x] Testing: Verify photos show for all filters ✅ **COMPLETED**

**Status:** ✅ **COMPLETE** - Shipped in v0.17.2

**Implementation Date:** January 2025

**SQL Scripts:** See `docs/sql/` directory:
- `recompute_tournament_leaders_by_phase.sql` - Main re-compute function
- `fix_tournament_leaders_constraint_and_recompute.sql` - Constraint fix + execution guide
- `verify_tournament_leaders_trigger.sql` - Verification queries
- `verify_fisto_data.sql` - Data integrity checks

---

## Related Files

- `src/lib/services/tournamentLeadersService.ts`
- `src/hooks/useTournamentLeaders.ts`
- `src/components/leaderboard/LeaderboardFilters.tsx`
- `src/components/tournament/tabs/LeadersTab.tsx`

---

*Created: December 2024*
*Priority: Medium (UI works, but inconsistent)*


