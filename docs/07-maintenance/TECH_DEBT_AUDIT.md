# Tech Debt Audit - `.cursorrules` Violations

**Generated:** February 2, 2026  
**Total files exceeding 500 lines:** 50  
**Total files exceeding 1000 lines:** 14

---

## Summary

| Severity | Count | Threshold |
|----------|-------|-----------|
| 🔴 Critical | 14 | 1000+ lines |
| 🟠 High | 12 | 700-1000 lines |
| 🟡 Medium | 24 | 500-700 lines |

**Total `src/` lines:** ~170,000

---

## 🔴 CRITICAL (1000+ lines) - Priority 1

These files are marked "UNACCEPTABLE" per `.cursorrules` and should be addressed before scaling.

| File | Lines | Type | Issue |
|------|-------|------|-------|
| `app/dashboard/tournaments/[id]/schedule/page.tsx` | 2,458 | Page | Entire scheduling system in one file |
| `hooks/useTracker.ts` | 2,434 | Hook | Core stat tracking - too many responsibilities |
| `app/stat-tracker-v3/page.tsx` | 2,320 | Page | UI + logic + state all mixed |
| `components/OrganizerTournamentManager.tsx` | 1,910 | Component | God component |
| `lib/services/tournamentService.ts` | 1,788 | Service | Too many concerns |
| `app/dashboard/stat-admin/video/[gameId]/page.tsx` | 1,744 | Page | Video admin page bloated |
| `app/stat-tracker/page.tsx` | 1,441 | Page | Legacy tracker (v1) - consider deprecation |
| `lib/services/teamStatsService.ts` | 1,289 | Service | Stats calculations sprawl |
| `app/dashboard/create-tournament/page.tsx` | 1,139 | Page | Form + validation + API mixed |
| `hooks/useGameViewerV2.ts` | 1,105 | Hook | Viewer logic overloaded |
| `components/PlayerDashboard.tsx` | 1,102 | Component | Multiple dashboard sections |
| `components/coach/CoachTeamCard.tsx` | 1,101 | Component | Card doing too much |
| `app/dashboard/tournaments/[id]/teams/page.tsx` | 1,076 | Page | Team management page |
| `lib/services/gameService.ts` | 1,045 | Service | Game operations sprawl |

---

## 🟠 HIGH (700-1000 lines) - Priority 2

| File | Lines | Type |
|------|-------|------|
| `lib/services/videoStatService.ts` | 982 | Service |
| `components/PlayerManager.tsx` | 937 | Component |
| `components/video/VideoStatsTimeline.tsx` | 930 | Component |
| `lib/services/gameServiceV3.ts` | 899 | Service |
| `hooks/useVideoStatHandlers.ts` | 878 | Hook |
| `components/player/PlayerProfileModal.tsx` | 872 | Component |
| `app/dashboard/stat-admin/page.tsx` | 842 | Page |
| `lib/services/coachAnalyticsService.ts` | 841 | Service |
| `lib/services/canvas-overlay/drawing.ts` | 743 | Utility |
| `components/OrganizerLiveStream.tsx` | 740 | Component |
| `app/dashboard/admin/qc-review/[gameId]/page.tsx` | 735 | Page |
| `lib/services/playerDashboardService.ts` | 730 | Service |
| `components/tracker-v3/TopScoreboardV3.tsx` | 722 | Component |
| `lib/services/templateService.ts` | 700 | Service |

---

## 🟡 MEDIUM (500-700 lines) - Priority 3

| File | Lines | Type |
|------|-------|------|
| `components/coach/CoachQuickTrackModal.tsx` | 697 | Component |
| `lib/services/authServiceV2.ts` | 687 | Service |
| `lib/services/clipService.ts` | 677 | Service |
| `lib/services/coachPlayerService.ts` | 640 | Service |
| `components/TournamentPage.tsx` | 640 | Component |
| `lib/services/bracketService.ts` | 621 | Service |
| `components/tracker-v3/DesktopStatGridV3.tsx` | 621 | Component |
| `components/tournament/tabs/OverviewTab.tsx` | 620 | Component |
| `components/PerformanceChart.tsx` | 618 | Component |
| `lib/services/canvas-overlay/nbaDrawing.ts` | 617 | Utility |
| `components/EditProfileModal.tsx` | 615 | Component |
| `components/coach/CoachMissionControl.tsx` | 614 | Component |
| `lib/services/imageUploadService.ts` | 609 | Service |
| `components/tournament/TournamentsListPage.tsx` | 604 | Component |
| `app/dashboard/video-composition-test/page.tsx` | 583 | Page |
| `lib/services/personalGamesService.ts` | 536 | Service |
| `lib/services/gameAwardsService.ts` | 528 | Service |
| `components/tracker-v3/mobile/MobileStatGridV3.tsx` | 527 | Component |
| `components/cards/CardCustomizer.tsx` | 524 | Component |

---

## 🎯 Strategic Refactoring Plan

### Phase 1: Core Stat Tracking (Most Touched)

**Target:** `useTracker.ts` (2,434 lines)

Split into:
- `hooks/tracker/useTrackerState.ts` - Core state management
- `hooks/tracker/useTrackerClock.ts` - Clock/timer logic
- `hooks/tracker/useTrackerScoring.ts` - Score calculations
- `hooks/tracker/useTrackerPersistence.ts` - DB sync operations
- `hooks/tracker/useTrackerSubscriptions.ts` - Real-time subscriptions
- `hooks/useTracker.ts` - Orchestrator (imports above, <100 lines)

**Target:** `stat-tracker-v3/page.tsx` (2,320 lines)

Split into:
- Extract UI sections to `components/tracker-v3/sections/`
- Keep page as layout orchestrator only (<200 lines)

---

### Phase 2: Organizer Flow

**Target:** `OrganizerTournamentManager.tsx` (1,910 lines)

Split into:
- `OrganizerTournamentHeader.tsx`
- `OrganizerTournamentTabs.tsx`
- `OrganizerTournamentGames.tsx`
- `OrganizerTournamentTeams.tsx`

**Target:** `tournamentService.ts` (1,788 lines)

Split into:
- `tournamentCrudService.ts` - Create/Read/Update/Delete
- `tournamentScheduleService.ts` - Scheduling logic
- `tournamentTeamsService.ts` - Team management
- `tournamentStatsService.ts` - Stats aggregation

**Target:** `schedule/page.tsx` (2,458 lines)

Split into:
- `ScheduleCalendar.tsx`
- `ScheduleGameCard.tsx`
- `ScheduleFilters.tsx`
- `useScheduleData.ts`

---

### Phase 3: Coach Flow

**Target:** `CoachTeamCard.tsx` (1,101 lines)

Split into:
- `CoachTeamHeader.tsx`
- `CoachTeamStats.tsx`
- `CoachTeamRoster.tsx`
- `CoachTeamActions.tsx`

**Target:** `PlayerDashboard.tsx` (1,102 lines)

Split into:
- `PlayerDashboardHeader.tsx`
- `PlayerDashboardStats.tsx`
- `PlayerDashboardGames.tsx`
- `PlayerDashboardHighlights.tsx`

---

### Phase 4: Services Consolidation

**Target:** `gameService.ts` (1,045) + `gameServiceV3.ts` (899)

Action: Consolidate into single `gameService.ts` with clear domain separation:
- `gameService/crud.ts`
- `gameService/stats.ts`
- `gameService/realtime.ts`

**Target:** `teamStatsService.ts` (1,289 lines)

Split into:
- `teamStatsCalculations.ts`
- `teamStatsQueries.ts`
- `teamStatsAggregation.ts`

---

## ⏳ When to Tackle

| Trigger | Action |
|---------|--------|
| **Now** | Don't refactor. Go market. Code works. |
| **Before hiring** | Clean top 5 critical files for onboarding |
| **Bug spike in a file** | Refactor that specific file |
| **Feature velocity drops** | Refactor if adding features takes 3x longer |
| **Scaling traffic** | Focus on performance-critical paths |

---

## 📏 .cursorrules Reference

| Type | Limit | Break At |
|------|-------|----------|
| Files | 500 lines | 400 lines |
| Components | 200 lines | 150 lines |
| Hooks | 100 lines | 80 lines |
| Services | 200 lines | 150 lines |
| Functions | 40 lines | 30 lines |

---

## 🚦 Current Assessment

**Status:** Functional but bloated  
**Blocking:** No  
**Risk Level:** Medium (manageable)  
**Action:** Address strategically when triggers occur, not urgently

---

## 📋 Refactoring Checklist (For Future Use)

When refactoring a file:

- [ ] Identify single responsibility violations
- [ ] Extract sub-components/functions
- [ ] Create barrel exports (`index.ts`)
- [ ] Update imports across codebase
- [ ] Test affected user flows
- [ ] Verify no regressions
- [ ] Update this document

---

*Last updated: February 2, 2026*
