# 🏀 PLAYER ANALYTICS ENGINE - DIAGNOSTIC & DATA FLOW MAP

**Date**: November 5, 2025  
**Branch**: `feature/player-profile-updates`  
**Status**: ✅ NBA STANDARD IMPLEMENTED - COMPLETED GAMES ONLY

---

## 🎯 NBA STANDARD: COMPLETED GAMES ONLY

### **Implementation Date**: November 5, 2025

**Rule**: Player Dashboard metrics (Season Averages, Career Highs, Performance Analytics) **ONLY** include games with `status = 'completed'`.

### **What's Excluded**:
1. ❌ `in_progress` games - Still being played, stats not final
2. ❌ `scheduled` games - Not played yet
3. ❌ "Coach Games (System)" - Personal stat tracker games (not tournament games)

### **What's Included**:
✅ Tournament/Team games with `status = 'completed'`

### **Code Location**:
`src/lib/services/playerGameStatsService.ts` (Line 111)
```typescript
.eq('status', 'completed'); // ✅ NBA STANDARD: Only completed games
```

### **Note**: 
- Personal Stat Tracker games should be displayed in a separate section (future feature)
- This aligns with NBA/professional basketball standards where only completed games count toward season statistics

---

## ✅ WHAT'S ALREADY IMPLEMENTED

### **Phase 1 Frontend Aggregation - COMPLETE!**

All three critical methods have been implemented:

1. **✅ `calculateSeasonAveragesFromGameStats()`** (Lines 246-295)
2. **✅ `calculateCareerHighsFromGameStats()`** (Lines 331-361)
3. **✅ `calculatePerformanceFromGameStats()`** (Lines 410-503)

---

## 🔍 DATA FLOW MAP

### **Complete Pipeline:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RAW DATA SOURCE: game_stats table                       │
│    - Contains: player_id, stat_type, stat_value, modifier  │
│    - Source of Truth ✅                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PlayerGameStatsService.getPlayerGameStats(userId)       │
│    - Queries game_stats table                              │
│    - Filters by status='completed' (NBA STANDARD) ✅       │
│    - Groups by game_id                                     │
│    - Aggregates into GameStatsSummary[]                    │
│    - Returns: points, rebounds, assists, FGM, FGA, etc.    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PlayerDashboardService Methods (Frontend Calculation)   │
│                                                             │
│    A. getSeasonAverages() → calculateSeasonAverages()      │
│       - Calculates PPG, RPG, APG                           │
│       - Calculates FG%, 3PT%, FT% (from totals)            │
│       - Formula: (totalMade / totalAttempted) * 100        │
│                                                             │
│    B. getCareerHighs() → calculateCareerHighs()            │
│       - Uses Math.max() on all games                       │
│       - Returns max points, rebounds, assists, etc.        │
│                                                             │
│    C. getPerformance() → calculatePerformance()            │
│       - Calculates trend, season high, overall rating      │
│       - Uses Game Score formula                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. usePlayerDashboardData Hook                             │
│    - Calls all three methods in parallel                   │
│    - Returns: { season, careerHighs, kpis, series }       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. PlayerDashboard Component (UI Display)                  │
│    - Lines 249-257: Shooting efficiency (seasonFg, etc.)  │
│    - Lines 263-271: Career highs (careerPts, etc.)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 REPORTED ISSUES

### **Issue 1: Shooting Efficiency Showing 0**

**What User Sees:**
- FG%: 0% (should show calculated percentage)
- 3PT%: 0% (should show calculated percentage)
- FT%: 0% (should show calculated percentage)

**Where Displayed:**
- File: `src/components/PlayerDashboard.tsx`
- Lines: 377-389 (Shooting Efficiency grid)

**Calculation Source:**
- File: `src/lib/services/playerDashboardService.ts`
- Lines: 267-276
```typescript
const totalFGM = games.reduce((sum, g) => sum + g.fieldGoalsMade, 0);
const totalFGA = games.reduce((sum, g) => sum + g.fieldGoalsAttempted, 0);
// ... same for 3PT and FT

const fg_pct = totalFGA > 0 ? Math.round((totalFGM / totalFGA) * 1000) / 10 : 0;
```

**Possible Root Causes:**

1. **❌ `PlayerGameStatsService.getPlayerGameStats()` returns empty array**
   - No games found for user
   - Query filters incorrect

2. **❌ Games exist but shooting stats are 0**
   - `fieldGoalsMade` and `fieldGoalsAttempted` are 0 in all games
   - Aggregation in `aggregateGameStats()` not counting correctly

3. **❌ Data exists but not reaching UI**
   - `data.season` is null/undefined
   - Caching issue
   - Type mismatch

---

### **Issue 2: Career Highs Showing 0**

**What User Sees:**
- Points: 0 (should show max points from all games)
- Rebounds: 0 (should show max rebounds)
- Assists: 0 (should show max assists)

**Where Displayed:**
- File: `src/components/PlayerDashboard.tsx`
- Lines: 681, 685, 689 (Career Highs card)

**Calculation Source:**
- File: `src/lib/services/playerDashboardService.ts`
- Lines: 344-352
```typescript
const careerHighs: CareerHighs = {
  points: Math.max(...games.map(g => g.points), 0),
  rebounds: Math.max(...games.map(g => g.rebounds), 0),
  assists: Math.max(...games.map(g => g.assists), 0),
  // ...
};
```

**Possible Root Causes:**

1. **❌ Same as Issue 1: Empty games array**
2. **❌ Games exist but all stats are 0**
   - Aggregation issue in `PlayerGameStatsService`
3. **❌ `Math.max(...[], 0)` returns 0 correctly but games have no data**

---

## 🔬 DIAGNOSTIC STEPS

### **Step 1: Check Browser Console**
Open the player dashboard and check console logs for:

```
🏀 PlayerGameStatsService: Fetching game stats for player: [userId]
📊 Found [X] raw stats for player
🎮 Player participated in [X] games
✅ Aggregated stats for [X] games

📊 PlayerDashboard: Calculating season averages from [X] games
✅ PlayerDashboard: Calculated season averages: { ... }

📊 PlayerDashboard: Calculating career highs from [X] games
✅ PlayerDashboard: Calculated career highs: { ... }
```

**Expected Output:**
- Should see non-zero games count
- Season averages should have non-zero percentages
- Career highs should have max values

**If games count is 0:**
→ **ROOT CAUSE**: No data in `game_stats` table for this user

**If games exist but stats are 0:**
→ **ROOT CAUSE**: Aggregation logic in `PlayerGameStatsService.aggregateGameStats()` not working

---

### **Step 2: Check Database Directly**

Run these queries in Supabase SQL Editor:

```sql
-- 1. Check if user has game_stats data
SELECT 
  player_id,
  COUNT(*) as total_stats,
  COUNT(DISTINCT game_id) as total_games
FROM game_stats
WHERE player_id = 'USER_ID_HERE'
GROUP BY player_id;

-- 2. Check what stat types exist
SELECT 
  stat_type,
  modifier,
  COUNT(*) as count
FROM game_stats
WHERE player_id = 'USER_ID_HERE'
GROUP BY stat_type, modifier
ORDER BY stat_type, modifier;

-- 3. Check a sample game's stats
SELECT 
  game_id,
  stat_type,
  stat_value,
  modifier,
  quarter
FROM game_stats
WHERE player_id = 'USER_ID_HERE'
LIMIT 20;
```

**Expected Results:**
- Query 1: Should return games count > 0
- Query 2: Should show various stat_types (field_goal, three_pointer, rebound, etc.)
- Query 3: Should show actual game data with modifiers (made/missed)

---

### **Step 3: Check PlayerGameStatsService Aggregation**

The key aggregation logic is in:
**File**: `src/lib/services/playerGameStatsService.ts`
**Method**: `aggregateGameStats()` (Lines 184-282)

**This method converts raw stats into box score format:**

```typescript
// Points from made shots
if (modifier === 'made') {
  points += value;
  
  if (statType === 'field_goal' || statType === 'two_pointer') {
    fieldGoalsMade++;
    fieldGoalsAttempted++;
  } else if (statType === 'three_pointer') {
    threePointersMade++;
    threePointersAttempted++;
    fieldGoalsMade++; // 3-pointers also count as field goals
    fieldGoalsAttempted++;
  }
}

// Missed shots
if (modifier === 'missed') {
  if (statType === 'field_goal' || statType === 'two_pointer') {
    fieldGoalsAttempted++;
  }
}
```

**Check if:**
- ✅ stat_type names match exactly (field_goal, three_pointer, two_pointer)
- ✅ modifier values are 'made' or 'missed' (not 'make', 'miss', etc.)
- ✅ stat_value is being added correctly for points

---

## 🎯 LIKELY ROOT CAUSES (Priority Order)

### **1. MOST LIKELY: Stat Type Name Mismatch** 🔴
The database might use different stat_type names than the code expects.

**Database might have:**
- `"2pt_shot"` instead of `"field_goal"`
- `"3pt_shot"` instead of `"three_pointer"`
- `"make"` instead of `"made"`

**Solution:** Check actual stat_type values in database and adjust aggregation logic.

---

### **2. LIKELY: No Game Data for This User** 🟡
Player dashboard is loaded but player has no games tracked yet.

**Check:**
- Is this a test account with no real game data?
- Are stats being recorded under a different player_id?

**Solution:** Test with a user who has confirmed game data.

---

### **3. POSSIBLE: Caching Issue** 🟢
Old cached data showing even after new calculations.

**Solution:** Clear cache and hard refresh browser.

---

## 🛠️ NEXT ACTIONS

1. **✅ Check browser console logs** - See what data is being calculated
2. **✅ Run SQL queries** - Verify raw data exists
3. **✅ Compare stat_type names** - Ensure code matches database schema
4. **✅ Test with known user** - Use William's account (has confirmed data)
5. **✅ Add detailed logging** - Add more console.log in aggregation

---

## 📝 CODE LOCATIONS REFERENCE

### **Season Averages Calculation:**
- **File**: `src/lib/services/playerDashboardService.ts`
- **Method**: `calculateSeasonAveragesFromGameStats()`
- **Lines**: 246-295

### **Career Highs Calculation:**
- **File**: `src/lib/services/playerDashboardService.ts`
- **Method**: `calculateCareerHighsFromGameStats()`
- **Lines**: 331-361

### **Performance Analytics Calculation:**
- **File**: `src/lib/services/playerDashboardService.ts`
- **Method**: `calculatePerformanceFromGameStats()`
- **Lines**: 410-503

### **Game Stats Aggregation:**
- **File**: `src/lib/services/playerGameStatsService.ts`
- **Method**: `aggregateGameStats()`
- **Lines**: 184-282

### **UI Display:**
- **File**: `src/components/PlayerDashboard.tsx`
- **Shooting Efficiency**: Lines 377-389
- **Career Highs**: Lines 679-691

---

## 🚀 PHASE 2 TRANSITION NOTES

Once this is working, coordinate with backend team to implement:

1. **Database Triggers or Materialized Views**
   - Populate `player_season_averages` table
   - Populate `player_career_highs` table
   - Populate `player_performance_analytics` table

2. **No Frontend Changes Required**
   - Current code already checks backend tables first
   - Falls back to frontend calculation if empty
   - Seamless transition when backend ready

3. **Performance Benefits**
   - 100x faster queries
   - 10-20x less data transfer
   - Scales to 100,000+ users

---

## 📊 SUCCESS CRITERIA

**When working correctly, user should see:**
- ✅ FG%: Non-zero percentage (e.g., "45.2%")
- ✅ 3PT%: Non-zero percentage (e.g., "38.5%")
- ✅ FT%: Non-zero percentage (e.g., "82.1%")
- ✅ Career High Points: Max value (e.g., "28")
- ✅ Career High Rebounds: Max value (e.g., "12")
- ✅ Career High Assists: Max value (e.g., "7")

---

**END OF DIAGNOSTIC MAP**

