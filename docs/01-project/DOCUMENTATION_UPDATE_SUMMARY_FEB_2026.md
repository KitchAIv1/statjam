# Documentation Update Summary - February 2026

**Date**: February 2026  
**Update Type**: Tournament UI, Hydration Fixes, Sentry Stat Tracker, Security (npm audit)

---

## 📋 Overview

This document summarizes updates made in February 2026:

1. **Tournament public page**: Hydration fix (Radix Tabs), player/team card redesign, schedule tab fix
2. **Sentry**: Comprehensive error logging for the stat-tracking platform
3. **Security**: npm audit fix (qs, webpack dependencies)

---

## ✅ 1. Tournament UI & Hydration

### Radix Tabs Hydration Fix

- **Problem**: React 19 / Next.js 15.5+ caused Radix Tabs to generate different `useId()` values on server vs client, producing hydration mismatch errors (`aria-controls`, `id` mismatches).
- **Solution**: Client-only rendering for the tabs section via `TournamentTabsSection` component. Server and first client paint render a static placeholder (overview content + non-Radix tab bar); after mount, real Radix Tabs render. No change to behavior or data.
- **Files**:
  - **Created**: `src/components/tournament/TournamentTabsSection.tsx` – client-only tabs with placeholder until mounted
  - **Modified**: `src/components/tournament/TournamentPageShell.tsx` – uses `TournamentTabsSection`, passes `onTabsMounted` for scroll/drag effect re-attachment

### Player Card Redesign (Players tab)

- **Changes**: Rectangular cards (no rounded corners). Player photo full-height, snapped to left edge; text (name, team, position/jersey) to the right. Matches design language for clarity and consistency.
- **File**: `src/components/tournament/tabs/PlayersTab.tsx`

### Team Card Redesign (Teams tab)

- **Changes**: Rectangular cards with full-height logo snapped left; team name, player count, and “View team profile →” with chevron. Shadow added (`shadow-md`). Header subtitle: “Select a team to view its profile, roster, and schedule.”
- **File**: `src/components/tournament/tabs/TeamsTab.tsx`

### Schedule Tab – Infinite Loop Fix

- **Problem**: `useEffect` depending on `rounds` re-ran every render because `rounds` was recreated each time (e.g. from `displayedGames.slice()`), causing “Maximum update depth exceeded.”
- **Solution**: Depend on a stable primitive key (e.g. `roundIndicesKey = rounds.map(r => r.roundIndex).join(',')`) so the effect only runs when round indices actually change.
- **File**: `src/components/tournament/tabs/ScheduleTab.tsx`

### Theme

- **File**: `src/lib/utils/tournamentThemeClasses.ts` – `scheduleRoundHeaderBg` used for schedule accordion headers (no content changes in this doc pass).

---

## ✅ 2. Sentry – Stat Tracker Error Logging

### Approach

- Add Sentry only in **catch** blocks (no hot paths). Use existing `errorLoggingService.logError()` (async, non-blocking) so no added latency. Tag events with `action` and `gameId` for filtering.

### useTracker.ts

- **Actions now reported**: `load_ruleset`, `init_game_state`, `clock_sync_start`, `clock_sync_stop`, `clock_sync_reset`, `clock_sync_custom`, `clock_sync_tick`, `sync_quarter`, `recalc_scores`, `persist_team_fouls`, `record_stat` (existing), `substitution`, `start_timeout`, `persist_foul_undo`, `undo_stat`, `close_game`, `cancel_game`, `complete_game_awards`, `manual_possession`, `autosave_clock`, `save_clock_before_exit`.
- **File**: `src/hooks/useTracker.ts` – added `errorLoggingService.logError(...)` in each of the above catch blocks.

### useGameDataLoader.ts

- **Action**: `load_game_data` – failure loading game/teams for stat-tracker-v3.
- **File**: `src/hooks/useGameDataLoader.ts`

### API Route – TURN Credentials

- **Action**: `generate` – failures generating TURN credentials (stat tracker / streaming).
- **File**: `src/app/api/turn-credentials/route.ts` – `captureException` with tags `route: 'turn-credentials'`, `action: 'generate'`.

### Existing Coverage (unchanged)

- `app/stat-tracker-v3/error.tsx` – Sentry in error boundary (tags: `stat_tracker_error`, `stat-tracker-v3`).

---

## ✅ 3. Security – Dependency Audit

### npm audit fix

- **Resolved**: 2 low-severity issues
  - **qs** (6.7.0–6.14.1): arrayLimit bypass in comma parsing → DoS (GHSA-w7fw-mjwx-w883). Fixed by dependency update.
  - **webpack** (5.49.0–5.104.0): buildHttp allowedUris bypass / redirect SSRF (GHSA-8fgc-7cc6-rx7x, GHSA-38r7-794h-5758). Fixed by dependency update.
- **Result**: `npm audit` reports **0 vulnerabilities** after `npm audit fix`.
- **File**: `package-lock.json` (updated).

---

## 📁 Files Touched (Summary)

| Area            | Files |
|-----------------|--------|
| Tournament UI   | `TournamentPageShell.tsx`, `TournamentTabsSection.tsx` (new), `PlayersTab.tsx`, `TeamsTab.tsx`, `ScheduleTab.tsx`, `tournamentThemeClasses.ts` |
| Sentry          | `useTracker.ts`, `useGameDataLoader.ts`, `api/turn-credentials/route.ts` |
| Security        | `package-lock.json` |

---

## 🔗 Related Docs

- **Security**: [SECURITY_FIXES_COMPLETED.md](../06-troubleshooting/SECURITY_FIXES_COMPLETED.md) – includes npm audit and Sentry monitoring
- **Troubleshooting**: [COMMON_ISSUES.md](../06-troubleshooting/COMMON_ISSUES.md)
- **Tournament**: [tournament-dedicated-page](../04-features/tournament-dedicated-page/), [MEDIA_TAB_FEATURE.md](../04-features/tournament-dedicated-page/MEDIA_TAB_FEATURE.md)

---

## Post–Feb 15 updates (v0.17.12)

All commits after the Feb 15 doc update are audited and mapped in **[COMMITS_AUDIT_SINCE_FEB_2026.md](COMMITS_AUDIT_SINCE_FEB_2026.md)**. Summary:

- **Analytics**: Google Analytics 4 and event tracking; CSP updated for GA4.
- **Error handling**: Sentry for video upload flow (Phases 1–5); error logging in useGlobalSearch.
- **Security/SEO**: www→apex redirect; canonical/OG URLs without www.
- **Streaming/overlay/tracker**: Relay reconnection, region selector, bitrate; schedule/lineup canvas overlays; clock device-switch fix; quarter length source of truth; foul dots; useGameReplays score alignment.
- **Global search**: useGlobalSearch hook + GlobalSearchBar; portal and focus behavior; error logging.

Version **0.17.12**; see CHANGELOG and SECURITY_FIXES_COMPLETED for hardening details.

---

**Last Updated**: February 2026
