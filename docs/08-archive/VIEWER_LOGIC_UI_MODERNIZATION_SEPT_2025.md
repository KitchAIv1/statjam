# Viewer Logic Separation + UI Modernization (Sept 2025)

This document captures all changes since the last documented fixes in `STAT_TRACKER_V3_FIXES_AUGUST_2025.md`, focusing on the Live Game Viewer and related tracking UI.

## Goals
- Preserve and reuse proven logic while modernizing the UI
- Strict separation of concerns: logic (hooks/services) vs. UI (presentational components)
- Prepare the viewer for the new Figma design system and features

---

## Highlights
- New unified data hook: `useGameViewerData` (combines stream + feed + derived metrics)
- New utility library: `gameViewerUtils` (pure functions; formatting/time/icons)
- Design tokens: `figmaTokens.ts` (colors, typography, spacing, radius, shadows)
- UI modernization of `GameHeader`, `PlayByPlayFeed`, `PlayEntry` with tokenized styling
- Field goal stat display now uses made/attempts (e.g., `5/10 FG`) per play
- Per-play player points added (right side), accumulated up to that play
- Tabs introduced (Feed / Game / Team A / Team B) with real data where applicable

---

## Changes By Area

### Logic (Hooks + Services)
- Added `src/hooks/useGameViewerData.ts`
  - Exposes: `gameData`, `isLive`, loading/error state, responsive flags
  - Combines: `useGameStream` (V1) + `usePlayFeed` (V2)
  - Derived metrics:
    - `calculatePlayerStats(index, playerId)` → per-play FG/3PT/FT made/attempts
    - `calculatePlayerPoints(index, playerId)` → per-play cumulative points
  - Returns `v2Data` bundle when V2 is enabled

- Added/Refined `src/lib/utils/gameViewerUtils.ts`
  - `formatGameTime`, `formatQuarter`, `getRelativeTime`
  - `getGameStatusText`, `getStatusColor`
  - `getEnhancedPlayDescription`, `getScoringInfo`, `getPlayIcon`

### UI Components
- `src/app/game-viewer/[gameId]/components/GameHeader.tsx`
  - Switched to Figma tokens (colors/typography/spacing)
  - Null-safety and type-safety improvements
  - Status/Quarter display with consistent design

- `src/app/game-viewer/[gameId]/components/PlayByPlayFeed.tsx`
  - Uses Figma tokens for layout, separators, and empty states
  - Delegates player stats/points to props (coming from hooks), keeping UI pure

- `src/app/game-viewer/[gameId]/components/PlayEntry.tsx`
  - Enhanced description size (e.g., “made 3-pointer”) for readability
  - Added right-side Player Points block (large number + small label below)
  - Uses enhanced description with FG stats (e.g., `5/10 FG`, `3/8 3PT`, `7/9 FT`)
  - Social reactions row placeholders (Like/Comment/Share)

- `src/app/game-viewer/[gameId]/page.tsx`
  - Now uses `useGameViewerData` for all data
  - Re-introduced Tabs (Feed/Game/Teams)
    - Feed: live play-by-play with per-play stats/points
    - Game: real scores/status/quarter summary
    - Teams: placeholders (ready to wire rosters)

### Mobile Stat Tracker V3 (touch-ups)
- `src/components/tracker-v3/mobile/MobileLayoutV3.tsx`
  - Bench/on-court logic aligned with V1 (currentRosterA/B + currentBenchA/B)
  - Substitution swaps between roster and bench; roster UI uses on-court only
  - Substitution modal shows true bench players

---

## Behavioral Fixes
- Field goal display in viewer now uses made/attempts rather than raw label
- Quarter badge now reflects the play’s quarter in real time
- Player cumulative points are shown per play (right side), updated up to that moment

---

## Architecture Notes
- UI is strictly presentational; all data/logic in hooks/services
- `PlayByPlayFeed`/`PlayEntry` receive computed values via props
- Formatting centralized in `gameViewerUtils` (testable pure functions)
- Tokens in `figmaTokens.ts` standardize visual language across components

---

## Testing Notes
1. Launch Viewer: `/game-viewer/[gameId]`
2. Verify:
   - Header shows correct status, quarter, and branding
   - Feed displays per-play descriptions with larger typography
   - FG/3PT/FT plays show correct made/attempts (e.g., `5/10 FG`)
   - Right-side Player Points reflect cumulative total up to each play
   - Tabs:
     - Feed: working as before
     - Game: shows live status, quarter, and scores
     - Teams: placeholders (non-blocking)

---

## Follow-ups (Next Steps)
- Wire team tabs to real rosters via `TeamService`/`useTeamRosters(gameId)`
- Enhance social interactions (likes, comments, share)
- Add real-time team fouls/bonus indicators in header
- Add advanced filters/sorting for the feed (period/time, team-only)

---

## Files Touched (Key)
- `src/hooks/useGameViewerData.ts` (NEW)
- `src/lib/utils/gameViewerUtils.ts` (NEW)
- `src/lib/design/figmaTokens.ts` (NEW)
- `src/app/game-viewer/[gameId]/page.tsx`
- `src/app/game-viewer/[gameId]/components/GameHeader.tsx`
- `src/app/game-viewer/[gameId]/components/PlayByPlayFeed.tsx`
- `src/app/game-viewer/[gameId]/components/PlayEntry.tsx`
- `src/components/tracker-v3/mobile/MobileLayoutV3.tsx`

---

## Commit Summary (Human-Readable)
- Phase 1: Logic separation (unified hook, utils) + crash fix in `GameHeader`
- Phase 2: Figma token foundation + UI modernization (header, feed, entries)
- Tabs reintroduced; Game tab uses real data
- Per-play player points + enlarged descriptions; stable build


