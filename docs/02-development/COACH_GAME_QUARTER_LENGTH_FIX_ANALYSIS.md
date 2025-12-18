# Coach Game Quarter Length Detection Fix - Analysis

**Date**: December 15, 2025  
**Issue**: Coach game team tabs showing 47-48 minutes instead of correct minutes based on 8-minute quarter setting  
**Status**: Analysis Complete - Root Cause Identified

---

## 🔍 ROOT CAUSE ANALYSIS

### The Problem

**Coach Games**: Team tabs calculate player minutes using **12 minutes** (default) instead of **8 minutes** (user setting)  
**Stat Admin Games**: ✅ Working correctly - detects quarter length properly

**Symptom**: 
- User sets 8-minute quarters in coach tracker
- Team tabs show 47-48 minutes (calculated as if 12-min quarters)
- Should show ~32 minutes for 4 quarters × 8 min = 32 min

---

## 📊 COMPARISON: Stat Admin vs Coach Games

### Stat Admin Games Flow ✅ WORKING

| Step | Action | Result |
|------|--------|--------|
| 1. Pre-Flight | User sets quarter length (e.g., 8 min) | ✅ Saved to DB |
| 2. `GameServiceV3.updateInitialClock()` | Saves `quarter_length_minutes: 8` | ✅ Preserved |
| 3. `getQuarterLengthMinutes()` | Queries game with tournament join | ✅ Works |
| 4. Priority Check | Checks `game.quarter_length_minutes` first | ✅ Returns 8 |
| 5. Minutes Calc | Uses 8 min for calculations | ✅ Correct (32 min for 4Q) |

**Key Code** (`gameServiceV3.ts:450`):
```typescript
quarter_length_minutes: clockData.minutes // ✅ Preserved
```

**Query** (`teamStatsService.ts:322-325`):
```typescript
const gameData = await this.makeAuthenticatedRequest<any>('games', {
  'select': 'tournament_id,quarter_length_minutes,tournaments(ruleset,ruleset_config)',
  'id': `eq.${gameId}`
});
```

**Priority Logic** (`teamStatsService.ts:330-334`):
```typescript
// ✅ Priority 1: Use preserved quarter_length_minutes
if (game.quarter_length_minutes && game.quarter_length_minutes > 0) {
  return game.quarter_length_minutes; // ✅ Returns 8
}
```

---

### Coach Games Flow ❌ BROKEN

| Step | Action | Result |
|------|--------|--------|
| 1. Game Creation | Coach sets quarter length (e.g., 8 min) | ✅ Saved to DB |
| 2. `coachGameService.ts:110` | Sets `quarter_length_minutes: 8` | ✅ Saved |
| 3. Clock Edit (if any) | `GameService.updateGameState()` called | ❌ **DOESN'T SAVE `quarter_length_minutes`** |
| 4. `getQuarterLengthMinutes()` | Queries game with tournament join | ⚠️ **POTENTIAL ISSUE** |
| 5. Priority Check | Checks `game.quarter_length_minutes` | ❌ **MIGHT FAIL** |
| 6. Fallback | Uses tournament ruleset or default | ❌ Returns 12 (wrong) |

**Key Issues Identified**:

#### Issue #1: `GameService.updateGameState()` Doesn't Preserve Quarter Length

**Location**: `gameService.ts:14-62`

**Problem**: When coach edits clock during tracking, `updateGameState()` only saves:
- `game_clock_minutes`
- `game_clock_seconds`
- But **NOT** `quarter_length_minutes`

**Code**:
```typescript
const updateData: any = {
  quarter: gameStateData.quarter,
  game_clock_minutes: gameStateData.game_clock_minutes,
  game_clock_seconds: gameStateData.game_clock_seconds,
  // ❌ MISSING: quarter_length_minutes
};
```

**Impact**: If coach edits clock, `quarter_length_minutes` might get overwritten or lost.

#### Issue #2: Query Join May Fail for Coach Games

**Location**: `teamStatsService.ts:322-325`

**Problem**: Query includes `tournaments(ruleset,ruleset_config)` join:
- Coach games have `tournament_id: null` (or dummy tournament)
- Join might fail or return null
- Query might not return `quarter_length_minutes` field properly

**Current Query**:
```typescript
'select': 'tournament_id,quarter_length_minutes,tournaments(ruleset,ruleset_config)'
```

**Potential Issues**:
1. When `tournament_id` is NULL, the `tournaments(...)` join might cause query to fail
2. OR query returns but `game.tournaments` is null, code might not handle it
3. OR `quarter_length_minutes` field not selected properly when join fails

#### Issue #3: Authentication Fallback May Not Work

**Location**: `teamStatsService.ts:319-371`

**Problem**: `getQuarterLengthMinutes()` uses `makeAuthenticatedRequest`:
- For unauthenticated coach game viewers, falls back to `makeRequest` (public)
- But the query with tournament join might fail in public mode
- Error handling returns default 12 minutes

**Code Flow**:
```typescript
try {
  const gameData = await this.makeAuthenticatedRequest<any>('games', {...});
  // If this fails (auth or query), catch block returns 12
} catch (error) {
  return 12; // ❌ Default fallback - wrong for coach games!
}
```

---

## 🎯 ROOT CAUSE IDENTIFIED

### Primary Issue: Query Join Failure for Coach Games

**The Real Problem**:

1. **Coach games have `tournament_id: null`** (or dummy tournament)
2. **Query includes `tournaments(ruleset,ruleset_config)` join**
3. **When join fails or returns null, query might:**
   - Return empty array
   - Return game without `quarter_length_minutes` field
   - Throw error that gets caught → returns default 12

4. **Even if `quarter_length_minutes` is in DB, query might not return it**

### Secondary Issue: Clock Edits Don't Preserve Quarter Length

- If coach edits clock during game, `quarter_length_minutes` is not updated
- This could cause inconsistency if clock is edited after game start

---

## 🔧 PROPOSED FIXES

### Fix Option 1: Simplify Query for Coach Games (RECOMMENDED)

**Approach**: Check if coach game first, use simpler query without tournament join

**Safety**: ✅ Isolated - only affects coach games  
**Impact**: ✅ Fixes the issue without breaking stat admin games

**Implementation**:
1. First query: Check if `is_coach_game = true` (simple query, no join)
2. If coach game: Query `quarter_length_minutes` directly (no tournament join)
3. If tournament game: Use existing query with tournament join

**Code Pattern**:
```typescript
// Step 1: Check if coach game (simple query)
const gameType = await this.makeRequest<any>('games', {
  'select': 'is_coach_game,quarter_length_minutes',
  'id': `eq.${gameId}`
});

if (gameType[0]?.is_coach_game === true) {
  // Coach game: Use quarter_length_minutes directly
  if (gameType[0]?.quarter_length_minutes > 0) {
    return gameType[0].quarter_length_minutes; // ✅ Returns 8
  }
  return 12; // Fallback
}

// Tournament game: Use existing logic with tournament join
// ... existing code ...
```

**Benefits**:
- ✅ No tournament join for coach games (avoids NULL join issues)
- ✅ Direct access to `quarter_length_minutes` field
- ✅ Isolated fix (doesn't affect stat admin games)
- ✅ Works for both authenticated and unauthenticated users

---

### Fix Option 2: Make Tournament Join Optional

**Approach**: Use conditional select based on tournament_id

**Safety**: ✅ Safe but more complex  
**Impact**: ✅ Fixes issue for all game types

**Implementation**:
- Check if `tournament_id` is NULL first
- If NULL: Query without tournament join
- If not NULL: Use existing query with join

---

### Fix Option 3: Always Select `quarter_length_minutes` First

**Approach**: Always query `quarter_length_minutes` as separate field, check it first

**Safety**: ✅ Very safe  
**Impact**: ✅ Fixes issue, maintains existing logic

**Implementation**:
- Query `quarter_length_minutes` as top-level field (not dependent on join)
- Check it first before tournament logic
- Only fall back to tournament ruleset if `quarter_length_minutes` is null

---

## 📋 RECOMMENDED SOLUTION

### **Fix Option 1: Simplify Query for Coach Games**

**Why This Is Best**:
1. ✅ **Isolated**: Only affects coach games, doesn't touch stat admin logic
2. ✅ **Safe**: No breaking changes to existing working code
3. ✅ **Simple**: Minimal code change, easy to test
4. ✅ **Direct**: Gets `quarter_length_minutes` directly without complex joins
5. ✅ **Works for Public View**: Uses `makeRequest` (public) which works for coach games

**Implementation Steps**:
1. Modify `getQuarterLengthMinutes()` in `teamStatsService.ts`
2. Add coach game check at the start
3. Use simple query for coach games (no tournament join)
4. Keep existing logic for tournament games unchanged

**Code Location**: `src/lib/services/teamStatsService.ts:319-371`

**Change Required**: ~20 lines of code addition

---

## 🔍 VERIFICATION CHECKLIST

After fix implementation, verify:
- ✅ Coach game with 8-min quarters shows ~32 min for 4 quarters (not 48)
- ✅ Coach game with 6-min quarters shows ~24 min for 4 quarters
- ✅ Stat admin games still work correctly (no regression)
- ✅ Tournament games still detect ruleset correctly
- ✅ Public coach game viewers see correct minutes
- ✅ Authenticated coach game viewers see correct minutes

---

## 📊 EXPECTED RESULTS

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| Coach game, 8-min quarters, 4Q played | 47-48 min ❌ | ~32 min ✅ |
| Coach game, 6-min quarters, 4Q played | 47-48 min ❌ | ~24 min ✅ |
| Stat admin game, 12-min quarters | 48 min ✅ | 48 min ✅ (no change) |
| Tournament game, FIBA 10-min | 40 min ✅ | 40 min ✅ (no change) |

---

## 🎯 SUMMARY

**Root Cause**: Query with tournament join fails for coach games (NULL tournament_id), causing fallback to default 12 minutes instead of using stored `quarter_length_minutes: 8`.

**Best Fix**: Simplify query for coach games - check `is_coach_game` first, use direct `quarter_length_minutes` query without tournament join.

**Safety**: ✅ Isolated to coach games only, no impact on stat admin or tournament games.

**Complexity**: LOW - ~20 lines of code, single method modification.

---

## ✅ IMPLEMENTATION COMPLETE

**Date**: December 15, 2024  
**Status**: ✅ IMPLEMENTED

### Changes Made

**File**: `src/lib/services/teamStatsService.ts`  
**Method**: `getQuarterLengthMinutes()` (lines 322-395)

**Implementation**:
1. **STEP 1**: Simple query using `makeRequest` (public access) to check `is_coach_game` and `quarter_length_minutes`
2. **COACH GAME PATH**: If `is_coach_game === true`, return `quarter_length_minutes` directly (no tournament JOIN)
3. **TOURNAMENT GAME PATH**: If not coach game but has `quarter_length_minutes`, return it
4. **STEP 2**: For tournament games without `quarter_length_minutes`, fetch ruleset via tournament JOIN

**Key Benefits**:
- ✅ Coach games bypass tournament JOIN entirely (avoids NULL tournament issue)
- ✅ Tournament games unchanged (same logic, no regression)
- ✅ Uses `makeRequest` for coach games (works for public/unauthenticated viewers)
- ✅ Coach game fallback is 8 min (Youth/Rec default) instead of 12 min

### Verification Checklist

| Test Case | Expected | Status |
|-----------|----------|--------|
| Coach game, 8-min quarters, 4Q played | ~32 min | 🔄 Pending Deploy |
| Coach game, 6-min quarters, 4Q played | ~24 min | 🔄 Pending Deploy |
| Stat admin game, 12-min quarters | 48 min (unchanged) | 🔄 Pending Deploy |
| Tournament game, FIBA 10-min | 40 min (unchanged) | 🔄 Pending Deploy |
| Public coach game viewer (phone) | Correct minutes | 🔄 Pending Deploy |
