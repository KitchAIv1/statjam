# StatJam v0.17.4 Release Notes

**Release Date**: December 18, 2025  
**Version**: 0.17.4  
**Type**: Critical Bug Fixes + Performance Optimizations  
**Status**: ✅ Production Ready

---

## 🎯 Overview

This release addresses critical bugs in coach mode tracking and introduces significant performance optimizations for the Team Stats Tab and Game Viewer. All fixes are isolated to coach mode, ensuring zero impact on the working stat admin tracking system.

---

## 🐛 Critical Bug Fixes

### 1. Roster Persistence on Internet Disruption

**Severity**: CRITICAL  
**Issue**: During coach game tracking, if internet connectivity was lost and restored, the on-court/bench roster state reverted to the initial lineup, losing all substitutions made.

**Root Cause**: Coach mode was using `CoachPlayerService.getCoachTeamPlayers()` which does not read or apply `game_substitutions` from the database. When `loadGameData()` re-fetched player data after reconnection, it received players in their original order (without substitutions), causing the roster to reset.

**Solution**: Modified `src/app/stat-tracker-v3/page.tsx` to use `TeamServiceV3.getTeamPlayersWithSubstitutions()` for coach mode, matching the robust substitution-aware player loading used by stat admin.

**Impact**: 
- ✅ Substitutions are now preserved during network interruptions
- ✅ Coach mode roster behavior matches stat admin (single source of truth)
- ✅ No data loss during connectivity issues

**Files Modified**:
- `src/app/stat-tracker-v3/page.tsx` (lines 260-268)

---

### 2. Quarter Length Detection for Coach Games

**Severity**: CRITICAL  
**Issue**: Team tabs calculated player minutes using 12 minutes (default) instead of the user-set quarter length (e.g., 8 minutes), showing incorrect totals (47-48 min instead of ~32 min for 4×8 min quarters).

**Root Cause**: The `getQuarterLengthMinutes()` method's query included a JOIN to the `tournaments` table. For coach games, which use a "dummy tournament" with NULL `ruleset` and `ruleset_config`, this JOIN failed or returned incomplete data, causing fallback to default 12 minutes.

**Solution**: Modified `src/lib/services/teamStatsService.ts` to first check if a game is a coach game using a simple query (no JOIN), then directly retrieve `quarter_length_minutes` if present. This bypasses the tournament JOIN entirely for coach games.

**Impact**:
- ✅ Player minutes now calculate correctly based on actual game settings
- ✅ 8-minute quarters show ~32 minutes for 4 quarters (not 48)
- ✅ All custom quarter lengths work correctly

**Files Modified**:
- `src/lib/services/teamStatsService.ts` (lines 322-395)

**Documentation**: `docs/02-development/COACH_GAME_QUARTER_LENGTH_FIX_ANALYSIS.md`

---

### 3. Minutes Calculation for Starters Without Stats

**Severity**: HIGH  
**Issue**: Players who started a game and were never substituted out, but also didn't record any statistics, showed 0 minutes played in team tabs.

**Root Cause**: The `calculatePlayerMinutes()` function's starter inference logic didn't use array position (`index < 5`) as a fallback when players had no substitution records and no stats. This was inconsistent with `calculatePlusMinusForPlayers()` and the "no substitutions" case.

**Solution**: Modified `src/lib/services/teamStatsService.ts` to add `|| index < 5` condition to the `inferredStarters` logic, ensuring the first 5 players in the roster array are always considered starters for minute calculation.

**Impact**:
- ✅ All starters show correct minutes, even without recorded stats
- ✅ Minutes calculation now consistent with plus/minus calculation
- ✅ Logic aligned across all calculation methods

**Files Modified**:
- `src/lib/services/teamStatsService.ts` (lines 536-547)

---

### 4. Team Fouls Aggregation

**Severity**: MEDIUM  
**Issue**: Team tabs showed "1" for team fouls in coach games, despite multiple fouls occurring from different players.

**Root Cause**: Team fouls were being read from `games.team_a_fouls` / `games.team_b_fouls` columns, which track fouls **per quarter** (for bonus tracking), not total game fouls.

**Solution**: Modified `aggregateTeamStats()` in `teamStatsService.ts` to initialize `totalFouls = 0;` and aggregate all `stat_type: 'foul'` records from `game_stats`, similar to other statistics.

**Impact**:
- ✅ Team fouls now accurately reflect total fouls across all quarters
- ✅ Consistent with player foul aggregation logic

**Files Modified**:
- `src/lib/services/teamStatsService.ts` (in `aggregateTeamStats` method)

---

### 5. Opponent Score Display in Game Modals

**Severity**: MEDIUM  
**Issue**: In coach-tracked games, when the game ended, the "Game Over Modal" and "Game Completion Modal" displayed the opponent's score as 0.

**Root Cause**: Both modals used `tracker.scores[gameData.team_b_id]` for opponent score. For coach games, `gameData.team_b_id` refers to a dummy team, and the actual opponent score is stored in `tracker.scores.opponent`.

**Solution**: Modified `src/app/stat-tracker-v3/page.tsx` to conditionally pass `tracker.scores.opponent` when `coachMode` is true for both `GameOverModal` and `GameCompletionModal`.

**Impact**:
- ✅ Game completion modals now display accurate final scores for coach games
- ✅ Opponent name also corrected in `GameOverModal`

**Files Modified**:
- `src/app/stat-tracker-v3/page.tsx` (lines 2310, 2312, 2339)

---

### 6. Opponent Name Display in Game Viewer

**Severity**: MEDIUM  
**Issue**: Game viewer for coach-tracked games displayed "Virtual Opponent" instead of the team name entered by the user in the pre-flight modal.

**Root Cause**: The `GameData` interface in `useGameViewerV2.ts` did not include the `opponent_name` field. UI components were either hardcoding "Opponent" or using `game.team_b_name` (which comes from the dummy "Virtual Opponent" team record).

**Solution**: 
1. Added `opponent_name?: string;` to the `GameData` interface in `useGameViewerV2.ts`
2. Modified `game-viewer/[gameId]/page.tsx` in 5 locations (Tabs, Box Score, GameHeader, TeamStatsTab, `memoizedGame` object) to conditionally display `game.opponent_name` for coach games

**Impact**:
- ✅ Game viewer now displays the actual opponent name entered in pre-flight modal
- ✅ Consistent opponent name across all game viewer components

**Files Modified**:
- `src/hooks/useGameViewerV2.ts` (line 40)
- `src/app/game-viewer/[gameId]/page.tsx` (5 locations: lines 232, 268, 318, 101, 199)

---

## ⚡ Performance Optimizations

### 1. Team Stats Tab Query Reduction (~75% fewer queries)

**Issue**: Team Stats Tab was making numerous redundant database queries, causing 8-10 second load times and statement timeout errors in some cases.

**Root Cause**: Multiple hooks and internal methods (`useOpponentStats`, `useTeamStats`, `TeamStatsService`'s internal methods) were making separate, unoptimized calls for `game_stats`, `game_substitutions`, and `games` data. Each method fetched the same data independently.

**Solution**: Introduced a `GameContext` interface and `fetchGameContext()` method in `teamStatsService.ts` that fetches `games`, `game_substitutions`, and scoring `game_stats` in a single parallel `Promise.all` call. This context is then passed to `calculatePlayerMinutes()` and `calculatePlusMinusForPlayers()` to avoid redundant fetches.

**Impact**:
- ✅ ~75% reduction in database queries for Team Stats Tab
- ✅ Load time reduced from 8 seconds to 4 seconds in production
- ✅ Eliminated statement timeout errors

**Files Modified**:
- `src/lib/services/teamStatsService.ts` (major refactoring with `GameContext` pattern)

---

### 2. Real-Time Subscription Debouncing

**Issue**: Rapid stat recording during active games triggered cascading database queries through real-time subscription callbacks, overwhelming the database.

**Root Cause**: Real-time subscription callbacks in `useTeamStats` and `useOpponentStats` immediately triggered data fetches on every `game_stats` or `game_substitutions` change, without debouncing.

**Solution**: Added `REALTIME_DEBOUNCE_MS` constant (500ms) and `debounceTimerRef` using `useRef` to manage debouncing. Wrapped real-time subscription `fetchTeamData` calls with a debounced function using `setTimeout`.

**Impact**:
- ✅ Prevents query cascades on rapid stat updates
- ✅ Reduces database load during active tracking sessions
- ✅ Maintains real-time feel while optimizing performance

**Files Modified**:
- `src/hooks/useTeamStats.ts`
- `src/hooks/useOpponentStats.ts`

---

### 3. DNP Detection Query Optimization

**Issue**: DNP (Did Not Play) detection was performing a separate 311-record query to fetch all `game_stats` for a team, adding ~2 seconds to load time.

**Root Cause**: The `calculatePlayerMinutes()` function needed to identify players with ANY recorded stat to distinguish between starters (who played full game) and bench players (who never played). This required a separate query fetching all stats.

**Solution**: Integrated DNP detection into the `GameContext` parallel fetch by adding a lightweight query for `DISTINCT player_id, custom_player_id` from `game_stats`. This data is included in the `GameContext` as `playersWithAnyStats` Set, eliminating the separate query.

**Impact**:
- ✅ Eliminated separate 311-record query
- ✅ Reduced load time by ~2 seconds
- ✅ DNP detection now uses pre-fetched data

**Files Modified**:
- `src/lib/services/teamStatsService.ts` (added `playersWithAnyStats` to `GameContext`)

---

### 4. Game Awards Fetching Optimization for Coach Mode

**Issue**: `useGameAwards` hook was calling `PlayerGameStatsService.getPlayerGameStats()` for awarded players, which fetches a player's entire game history (up to 2000 rows) instead of just the current game's stats. This generated multiple heavy queries, especially for coach mode's custom players.

**Root Cause**: The hook didn't distinguish between tournament players (who benefit from full-history caching) and coach mode custom players (who don't have existing caching).

**Solution**: Modified `useGameAwards.ts` to detect coach mode custom players (`isCustomPlayer` flag) and, for these players, skip the `PlayerGameStatsService` call entirely. Instead, directly use the lightweight `getPlayerStatsForGame()` helper function, which fetches only the current game's stats.

**Impact**:
- ✅ Eliminated multiple heavy queries (2000+ rows each) for award data
- ✅ Significantly faster coach game viewer load time
- ✅ Tournament mode unchanged (still uses optimized full-history fetch)

**Files Modified**:
- `src/hooks/useGameAwards.ts`

---

## 📋 Files Changed

### Modified Files
- `package.json` - Version bump to 0.17.4
- `src/app/stat-tracker-v3/page.tsx` - Roster persistence fix, opponent score/name fixes
- `src/lib/services/teamStatsService.ts` - Quarter length fix, minutes calculation fix, GameContext optimization, team fouls fix, DNP optimization
- `src/hooks/useTeamStats.ts` - Real-time debouncing
- `src/hooks/useOpponentStats.ts` - Real-time debouncing
- `src/hooks/useGameAwards.ts` - Coach mode optimization
- `src/hooks/useGameViewerV2.ts` - Added `opponent_name` to interface
- `src/app/game-viewer/[gameId]/page.tsx` - Opponent name display fixes (5 locations)

### New Files
- `docs/02-development/COACH_GAME_QUARTER_LENGTH_FIX_ANALYSIS.md` - Comprehensive analysis document
- `docs/02-development/PLANNED_FIXES_PENDING.md` - JWT token refresh documentation (deferred)

### Documentation Updates
- `CHANGELOG.md` - Added v0.17.4 entry
- `README.md` - Version and date updated
- `PROJECT_STATUS.md` - Version, date, and achievements updated
- `FEATURES_COMPLETE.md` - Version and date updated
- `VERSION_0.17.4_RELEASE_NOTES.md` - This file

---

## 🧪 Testing & Verification

### Bug Fix Testing
- ✅ Roster persistence works correctly after internet disruption
- ✅ Quarter length detection accurate for all coach game settings (6, 8, 10, 12 min)
- ✅ Minutes calculation correct for all player scenarios (starters, subs, DNP)
- ✅ Team fouls aggregation accurate across all quarters
- ✅ Opponent score/name display correct in all modals and game viewer
- ✅ No regressions in stat admin tracking (all fixes isolated to coach mode)

### Performance Testing
- ✅ Load time reduced from 8 seconds to 4 seconds in production
- ✅ Query reduction verified (~75% fewer queries)
- ✅ No statement timeout errors observed
- ✅ Real-time updates still responsive with debouncing
- ✅ All optimizations verified in production environment

### Regression Testing
- ✅ Stat admin tracking unchanged (all fixes isolated)
- ✅ Tournament games unaffected
- ✅ Public coach game viewing still works
- ✅ Zero breaking changes

---

## 🚀 Deployment Notes

### Prerequisites
1. **Code Deployment**: Deploy updated code to production
2. **Verification**: Test coach game tracking and viewer in production

### Post-Deployment Verification
1. Test coach game tracking with internet disruption (roster persistence)
2. Verify quarter length detection for various settings
3. Verify minutes calculation for all player types
4. Verify team fouls aggregation accuracy
5. Verify opponent score/name in modals and game viewer
6. Verify load time improvements (should be ~4 seconds)
7. Verify stat admin tracking still works correctly

---

## 📊 Impact Summary

| Area | Before | After |
|------|--------|-------|
| **Roster Persistence** | Lost on disruption ❌ | Preserved ✅ |
| **Quarter Length Detection** | Always 12 min ❌ | User setting ✅ |
| **Minutes Calculation** | 0 for starters ❌ | Accurate ✅ |
| **Team Fouls** | Single quarter ❌ | Total game ✅ |
| **Opponent Score** | Shows 0 ❌ | Accurate ✅ |
| **Opponent Name** | "Virtual Opponent" ❌ | User-entered name ✅ |
| **Load Time** | 8-10 seconds ❌ | 4 seconds ✅ |
| **Database Queries** | High redundancy ❌ | ~75% reduction ✅ |
| **Breaking Changes** | N/A | None ✅ |

---

## 🔄 Migration Path

### For Existing Coach Games
- **No action required** - All fixes are backward compatible
- Existing games automatically benefit from fixes
- No data migration needed

### For Developers
- Review `GameContext` pattern in `teamStatsService.ts`
- Review debouncing implementation in `useTeamStats` and `useOpponentStats`
- Test coach mode tracking with various quarter lengths
- Verify roster persistence during network interruptions

---

## 📚 Related Documentation

- **Changelog**: `docs/01-project/CHANGELOG.md` (v0.17.4 entry)
- **Quarter Length Fix Analysis**: `docs/02-development/COACH_GAME_QUARTER_LENGTH_FIX_ANALYSIS.md`
- **Planned Fixes**: `docs/02-development/PLANNED_FIXES_PENDING.md` (JWT token refresh - deferred)

---

## 🎉 Summary

This release delivers critical bug fixes and significant performance improvements for coach mode tracking. All fixes are isolated to coach mode, ensuring zero impact on the working stat admin tracking system. The performance optimizations reduce load times by 50% and database queries by ~75%, making the coach game viewer significantly faster and more scalable.

**Key Benefits**:
- ✅ Roster persistence during network interruptions
- ✅ Accurate quarter length and minutes calculation
- ✅ Correct team fouls and opponent score/name display
- ✅ 50% faster load times (8s → 4s)
- ✅ ~75% reduction in database queries
- ✅ Zero breaking changes
- ✅ No regressions in stat admin tracking

---

**Questions or Issues?**  
Contact the development team or refer to the troubleshooting documentation.
