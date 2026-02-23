# Commits Audit & Mapping — Since Last Doc Update (Feb 2026)

**Baseline**: Last documentation update captured in `DOCUMENTATION_UPDATE_SUMMARY_FEB_2026.md` (commit `4a7d587`, 2026-02-15).  
**Scope**: All commits after `4a7d587` through `HEAD`.  
**Total commits**: 35.  
**Version**: 0.17.12 (post-audit release).

---

## 1. Commit list (chronological, oldest first)

| # | Commit    | Date       | Summary |
|---|-----------|------------|--------|
| 1 | 3935d06   | 2026-02-15 | Add Sentry/error logging for video upload flow (Phases 1-5) |
| 2 | df3e442   | 2026-02-18 | Add lower default bitrate preset (720p 3 Mbps) |
| 3 | 693c6ea   | 2026-02-18 | fix(relay): EBML-gated reconnection + 5s verification + maxRetries 5 |
| 4 | 615bbf0   | 2026-02-18 | feat(broadcast): add relay region selector for AU livestreaming |
| 5 | ebde5d1   | 2026-02-20 | feat(overlay): conditional refetch on games channel when scoring fields change |
| 6 | 5acf280   | 2026-02-20 | fix: stale clock broadcasts on device switch (Issue #2) |
| 7 | 62e065c   | 2026-02-20 | perf: pre-warm stat recording imports at mount to eliminate first-stat delay |
| 8 | 47b39b8   | 2026-02-20 | Revert "perf: pre-warm stat recording imports at mount..." |
| 9 | bbd2964   | 2026-02-20 | feat(overlay): prefetch box score, loading skeleton, higher transparency |
|10 | d428dd9   | 2026-02-20 | fix(overlay): halftime shows when Q2 ends, clears only when Q3 starts |
|11 | 54c2bcb   | 2026-02-21 | feat(tracker): player foul dots UI (mobile + desktop), subscription fix |
|12 | 1786ff7   | 2026-02-21 | fix: Auto toggle applies full Advanced sequences when MINIMAL pre-flight |
|13 | 675eecd   | 2026-02-21 | feat: quarter length source of truth, no 12-min default, locked pre-flight UI |
|14 | d7b30d8   | 2026-02-21 | Schedule overlay: date conditional layout, VS alignment, visibility tweaks |
|15 | 2b59d03   | 2026-02-21 | Starting Lineup overlay: team colors, two-tone gradient, avatar polish |
|16 | 21e91ac   | 2026-02-21 | feat: render schedule and lineup overlays on broadcast canvas |
|17 | adb8578   | 2026-02-21 | Remove schedule and lineup DOM overlays from preview; keep canvas-only |
|18 | 3a4d67e   | 2026-02-21 | fix(overlay): match schedule and lineup canvas UI to approved designs |
|19 | 76c6fdd   | 2026-02-21 | Canvas overlay: schedule and lineup in broadcast stream; OverlayControlPanel |
|20 | 67bbd3e   | 2026-02-21 | Streaming: audio UX - mic enable anytime, visible pre-broadcast notices |
|21 | 510ec1f   | 2026-02-21 | fix: remove www from canonical/OG URLs; add www→apex redirect |
|22 | 795b597   | 2026-02-22 | Overlay: contrast-safe bar colors, classic score fix |
|23 | d0d22c3   | 2026-02-22 | Free throw overlay: load and draw player avatar via LogoCache |
|24 | e34d2ba   | 2026-02-22 | Overlay: 3s timeout on image loads to prevent composition loop block |
|25 | e66f18e   | 2026-02-22 | playerStatsDrawer: skip load when photoUrl is null or empty |
|26 | 387953f   | 2026-02-22 | useGameReplays: fallback to home_score/away_score when calculated 0-0 |
|27 | 5f9752d   | 2026-02-22 | useGameReplays: use stat_value for score calc (match Overview/Overlay) |
|28 | 5c24ef1   | 2026-02-22 | useGameReplays: add debug logs for score calculation |
|29 | 5f28790   | 2026-02-22 | useGameReplays: log allStats raw and error for debugging |
|30 | 09c69a0   | 2026-02-22 | Add debug logs to useGameReplays for game_stats RLS debugging |
|31 | f68abca   | 2026-02-22 | Remove debug console.log statements from useGameReplays |
|32 | dde3582   | 2026-02-22 | Add global search: useGlobalSearch hook + GlobalSearchBar component |
|33 | d31b483   | 2026-02-22 | Fix GlobalSearchBar: portal for dropdown clipping, onFocus always open |
|34 | 602de62   | 2026-02-22 | Fix useGlobalSearch: add error logging in catch, debug logs for search flow |
|35 | cab25b6   | 2026-02-23 | Add Google Analytics 4 and event tracking |

---

## 2. Compartmentalized mapping

### 2.1 Analytics & product events

| Commit    | Area           | What changed |
|-----------|----------------|--------------|
| cab25b6   | **Google Analytics 4** | GA4 script and config in `layout.tsx`; CSP in `next.config.ts` for googletagmanager.com, google-analytics.com; `src/lib/analytics.ts` with `trackEvent` and helpers; `src/types/gtag.d.ts` for Window.gtag/dataLayer. |
| cab25b6   | **Event tracking**    | Player profile view, tournament view, game viewer open, global search, sign up (auth + claim), tournament created (page + modal), team created (organizer + coach), live stream started/ended, coach game started, video upload started/completed, video stat tracking assigned (admin queue). |

**Docs to update**: PRD (analytics as implemented), SECURITY (CSP), any analytics runbook.

---

### 2.2 Error handling, Sentry & hardening

| Commit    | Area              | What changed |
|-----------|-------------------|--------------|
| 3935d06   | **Video upload**  | Sentry/error logging for video upload flow (Phases 1-5). Aligns with stat-tracker and livestream patterns: catch-block only, no hot-path impact. |
| 602de62   | **Global search** | Error logging in `useGlobalSearch` catch; debug logs for search flow (controllable). Improves diagnosability when search or RLS fails. |

**Hardening summary**:
- **Video upload**: Full Sentry coverage in upload flow (create-upload API, BunnyUploadService, VideoUploader/context as needed).
- **Global search**: Errors in search path reported; avoids silent failures.
- **Existing**: Stat-tracker (useTracker, useGameDataLoader, turn-credentials), livestream (useBroadcast, broadcastService) already documented in DOCUMENTATION_UPDATE_SUMMARY_FEB_2026.

**Docs to update**: DOCUMENTATION_UPDATE_SUMMARY (extend Sentry section), SECURITY_FIXES_COMPLETED (error capturing table).

---

### 2.3 Security & CSP

| Commit    | Area     | What changed |
|-----------|----------|--------------|
| 510ec1f   | **SEO/URLs** | Remove www from canonical/OG URLs; add www→apex redirect in `next.config.ts`. Avoids duplicate content and enforces single hostname. |
| cab25b6   | **CSP**      | GA4 domains added: script-src/script-src-elem `https://www.googletagmanager.com`; connect-src `https://www.google-analytics.com`, `https://analytics.google.com`, `https://www.googletagmanager.com`. |

**Docs to update**: SECURITY_FIXES_COMPLETED (CSP and redirect), SECURITY.md if present at repo root.

---

### 2.4 Live streaming & broadcast

| Commit    | Area            | What changed |
|-----------|-----------------|--------------|
| df3e442   | **Bitrate**     | Lower default bitrate preset (720p 3 Mbps). Reduces bandwidth and improves stability on weak links. |
| 693c6ea   | **Relay**       | EBML-gated reconnection with 5s verification and maxRetries 5. More reliable RTMP reconnection. |
| 615bbf0   | **Regions**     | Relay region selector for AU livestreaming. Supports regional relay endpoints. |
| 67bbd3e   | **Audio UX**    | Mic enable anytime; visible pre-broadcast notices. Clearer streaming UX. |

**Docs to update**: Live-streaming feature docs, WEEK3_RELAY_SERVER or relay README if they describe reconnection/regions.

---

### 2.5 Overlay (canvas, schedule, lineup)

| Commit    | Area                | What changed |
|-----------|---------------------|--------------|
| ebde5d1   | **Overlay data**    | Conditional refetch on games channel when scoring fields change. Keeps overlay in sync with tracker. |
| bbd2964   | **Box score**       | Prefetch box score, loading skeleton, higher transparency. Better perceived performance and readability. |
| d428dd9   | **Halftime**        | Halftime shows when Q2 ends, clears only when Q3 starts. Correct halftime state machine. |
| d7b30d8   | **Schedule**        | Schedule overlay: date conditional layout, VS alignment, visibility tweaks. |
| 2b59d03   | **Starting lineup** | Team colors, two-tone gradient, avatar polish, layout fixes. |
| 21e91ac   | **Broadcast canvas**| Render schedule and lineup overlays on broadcast canvas. |
| adb8578   | **Preview**         | Remove schedule and lineup DOM overlays from preview; canvas-only. |
| 3a4d67e   | **Canvas UI**      | Match schedule and lineup canvas UI to approved designs. |
| 76c6fdd   | **Studio**         | Canvas overlay: schedule and lineup in broadcast stream; OverlayControlPanel layout tweaks. |
| 795b597   | **Contrast**       | Overlay: contrast-safe bar colors, classic score fix. |
| d0d22c3   | **Free throw**     | Load and draw player avatar via LogoCache. |
| e34d2ba   | **Images**         | 3s timeout on image loads to prevent composition loop block. |
| e66f18e   | **Player drawer**  | playerStatsDrawer: skip load when photoUrl is null or empty. |

**Docs to update**: Live-streaming overlay docs, CANVAS_OVERLAY_UI_AUDIT if present.

---

### 2.6 Tracker & pre-flight

| Commit    | Area           | What changed |
|-----------|----------------|--------------|
| 5acf280   | **Clock**      | Stale clock broadcasts on device switch (Issue #2). Prevents wrong clock when switching devices. |
| 62e065c   | **Perf**       | Pre-warm stat recording imports at mount to reduce first-stat delay. |
| 47b39b8   | **Revert**     | Revert of pre-warm (e.g. side effects or bundle impact). |
| 54c2bcb   | **Foul dots**  | Player foul dots UI (mobile + desktop), subscription fix. |
| 1786ff7   | **Pre-flight** | Auto toggle applies full Advanced sequences when MINIMAL pre-flight. |
| 675eecd   | **Quarter length** | Quarter length source of truth; no 12-min default; locked pre-flight UI. |

**Docs to update**: Stat-tracker quick reference, PRE_FLIGHT_CHECK if present, automation presets.

---

### 2.7 Game replays & useGameReplays

| Commit    | Area     | What changed |
|-----------|----------|--------------|
| 387953f   | **Scores**  | useGameReplays: fallback to home_score/away_score when calculated scores are 0-0. |
| 5f9752d   | **Score calc** | use stat_value for score calc (match Overview/Overlay). |
| 5c24ef1   | **Debug**  | Debug logs for score calculation. |
| 5f28790   | **Debug**  | Log allStats raw and error for debugging. |
| 09c69a0   | **Debug**  | Debug logs for game_stats RLS debugging. |
| f68abca   | **Cleanup**| Remove debug console.log statements from useGameReplays. |

**Docs to update**: Media tab / replays feature doc if it describes score source; RLS troubleshooting if game_stats access is documented.

---

### 2.8 Global search

| Commit    | Area      | What changed |
|-----------|-----------|--------------|
| dde3582   | **Feature** | useGlobalSearch hook + GlobalSearchBar component. Cross-entity search (players, teams, tournaments, games, coaches). |
| d31b483   | **UX**      | Portal for dropdown clipping; onFocus always open. |
| 602de62   | **Hardening** | Error logging in catch; debug logs for search flow. |

**Docs to update**: PRD/features list (global search), navigation/shell docs if GlobalSearchBar is in header.

---

### 2.9 SEO & URLs

| Commit    | Area     | What changed |
|-----------|----------|--------------|
| 510ec1f   | **Canonical** | Remove www from canonical/OG URLs; add www→apex redirect. Single canonical host (statjam.net). |

**Docs to update**: SEO checklist or deployment doc if it mentions canonical/redirects.

---

## 3. File-level impact (high level)

- **layout.tsx**: GA4 scripts, preconnect; Plausible unchanged.
- **next.config.ts**: www redirect; CSP GA4 domains.
- **New**: `src/lib/analytics.ts`, `src/types/gtag.d.ts`.
- **Hooks**: useGlobalSearch (new), useGameReplays (score + debug/cleanup), useTracker (clock fix), useTournamentForm (return type for analytics).
- **Sentry/error**: Video upload flow (API + service + UI), useGlobalSearch catch.
- **Overlay**: Schedule/lineup canvas, LogoCache, timeouts, contrast, box score prefetch.
- **Broadcast**: Relay reconnection, region selector, bitrate preset, audio UX.
- **Tracker**: Pre-flight quarter length, auto/advanced toggle, foul dots.
- **Search**: GlobalSearchBar + portal, focus behavior.

---

## 4. Versioning recommendation

- **Current package.json**: 0.17.8  
- **Recommendation**: Bump to **0.17.12** for this batch (analytics, global search, overlay/broadcast/tracker fixes, error handling, SEO).

---

## 5. Documentation & hardening checklist

- [ ] **CHANGELOG.md**: Add [0.17.12] section summarizing all 35 commits by category (analytics, error handling, security/CSP, streaming, overlay, tracker, replays, global search, SEO).
- [ ] **DOCUMENTATION_UPDATE_SUMMARY_FEB_2026.md**: Extend with “Post–Feb 15” subsection or link to this audit.
- [ ] **PROJECT_STATUS.md**: Version 0.17.12; add bullets for GA4, global search, overlay/broadcast/tracker improvements, error handling, SEO.
- [ ] **SECURITY_FIXES_COMPLETED.md**: Add video upload Sentry, useGlobalSearch error logging; CSP GA4 and www redirect.
- [ ] **INDEX.md**: Mention COMMITS_AUDIT_SINCE_FEB_2026.md and 0.17.12.
- [ ] **package.json**: version → "0.17.12".
- [ ] **README.md**: Version badge/line if present.
- [ ] **PRD / FEATURES**: Global search, GA4/event tracking as shipped.

---

**Last Updated**: February 2026  
**Audit Baseline**: 4a7d587 (Docs and security updates; turn-credentials and tracker hooks changes)  
**Audit Range**: 3935d06 … cab25b6 (35 commits)
