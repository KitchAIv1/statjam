# Game Clock & Quarter Length — Data Flow Audit

**Purpose:** Map all reads/writes of `game_clock_minutes`, `quarter_length_minutes`, and related state to confirm or find missing data and outputs (e.g. Q3→Q4 reset-to-12 bug).

**Date:** 2025-02-23

---

## 1. Schema & Defaults

| Source | Column | Default / Notes |
|--------|--------|------------------|
| `docs/03-architecture/DATABASE_SCHEMA.md` | `games.game_clock_minutes` | `INTEGER DEFAULT 12` |
| Doc does not list | `games.quarter_length_minutes` | Referenced in code (GameServiceV3, statAdminDashboardService, teamStatsService); likely added by migration. Not in main schema doc. |

---

## 2. Writers of `game_clock_minutes` (games table)

| Location | When | Value source | Writes `quarter_length_minutes`? |
|----------|------|----------------|-----------------------------------|
| **gameService.ts** `createGame()` | Game creation | Hardcoded `12` | No (insert doesn't include it) |
| **gameService.ts** `startGame()` | Start game | Hardcoded `12` | No |
| **gameService.ts** `updateGameClock()` | Clock tick, reset, custom time, stop, beforeunload | Caller `clockData.minutes` | No |
| **gameService.ts** `updateGameState()` | Quarter change, foul persist, substitution | Caller `gameStateData.game_clock_minutes` | **No** — type has no `quarter_length_minutes` |
| **GameServiceV3** `updateInitialClock()` | Pre-flight “Track Game” (scheduled only) | `settings.quarterLengthMinutes` | **Yes** — `quarter_length_minutes: clockData.minutes` |
| **videoStatService.ts** `updateGameClockState()` | Video stat tracking | `gameTimeMinutes` arg | No |
| **videoStatService.ts** `backfillGameClockFromStats()` | Backfill from latest stat | `latestStat.game_time_minutes` | No |
| **gameService.ts** (substitution path) | Record substitution | `subData.gameTimeMinutes` | No |
| **useTracker.ts** sendBeacon (beforeunload) | Page close | `clockRef.current` → minutes | No |

**Gap:** `GameService.updateGameState()` (used on quarter change) **never** writes `quarter_length_minutes`. Only `GameServiceV3.updateInitialClock()` does. So quarter-length is set once at pre-flight and never updated on quarter change.

---

## 3. Writers of `quarter_length_minutes` (games table)

| Location | When | Value |
|----------|------|--------|
| **GameServiceV3** `updateInitialClock()` | Pre-flight, game scheduled | `clockData.minutes` (quarter length) |
| **coachGameService** (create coach game) | Coach game creation | `request.game_settings?.quarter_length_minutes \|\| 8` |

**No other code path** in the audited codebase writes `games.quarter_length_minutes`. So if the column exists, it is only set at game creation (coach) or at pre-flight (stat admin). It is **never** updated when the stat admin advances the quarter.

---

## 4. Readers of game clock & quarter length

### 4.1 `game_clock_minutes` (from DB or overlay)

| Consumer | Source | Select | Uses for |
|----------|--------|--------|----------|
| **useGameOverlayData** | `games` via `select('*')` | Yes | `gameClockMinutes` when `useDbClock` (e.g. quarter change) |
| **useTracker** init | `GameServiceV3.getGame()` | Yes | `clockMinutes` init; **not** used for `quarterLen` / `originalQuarterLength` |
| **OrganizerLiveStream** | game / payload | Yes | Display |
| **LiveStreamPlayer** | `selectedGame` | Yes | Prop |
| **TournamentGameSelector** | `g` / overlayData | Yes | Display |
| **GameViewerV3Header** | game | Yes | Display |
| **CoachTeamCard** | game | Yes | Display |
| **LiveTournamentSection** | `g` | Yes | Time label |
| **useLiveGamesHybrid** | games select | Yes | Change detection |
| **GameViewerTimeStatsService** | game | Yes | `clockMinutes: game.game_clock_minutes ?? quarterLengthMinutes` |
| **teamStatsService** | game | Yes | Context / calculations |
| **video-composition-test** | `overlayData.gameClockMinutes` | From overlay | Composition |

### 4.2 `quarter_length_minutes` (from DB)

| Consumer | Source | Select | Uses for |
|----------|--------|--------|----------|
| **GameServiceV3.getGame()** | games | **Yes** in select | Returned to caller; **useTracker does not use it** |
| **statAdminDashboardService** | games | Yes | `defaultQuarterLength` for PreFlight modal |
| **stat-admin page** | selectedGame | From dashboard | `defaultQuarterLength={selectedGame.quarter_length_minutes}` |
| **teamStatsService** | games | Yes | Quarter length for minutes calc (Priority 1) |
| **GameViewerTimeStatsService** | game (cast) | Assumed on game | `quarterLengthMinutes = game.quarter_length_minutes \|\| 8` |
| **videoStatService** | video/game config | Yes (config) | Sync / calculations |
| **video [gameId] page** | clockSyncConfig | Yes | Quarter length for video clock |
| **coachGameService** | — | Writes only | Create coach game |

### 4.3 localStorage `quarterLength_${gameId}`

| Writer | When |
|--------|------|
| **stat-admin page** (onStartTracking) | Pre-flight: `localStorage.setItem('quarterLength_${selectedGame.id}', settings.quarterLengthMinutes)` |
| **useTracker** init | When `!stored && [5,6,8,10,12,18,20].includes(clockMinutes)` → set and lock `originalQuarterLength` from current clock |

| Reader | When |
|--------|------|
| **useTracker** `getInitialQuarterLength()` | Mount: initial `originalQuarterLength` |
| **useTracker** init | `quarterLen` if key present; else default 12 |
| **useTracker** `resetClock()` | Minutes for new period |
| **useTracker** `setQuarter()` | `clockMinutesForQuarter` for new quarter clock |

---

## 5. useTracker init — exact data flow

```
GameServiceV3.getGame(gameId)
  → game.game_clock_minutes, game.game_clock_seconds, game.is_clock_running
  → game.quarter_length_minutes  [SELECTED BUT NEVER READ IN USE_TRACKER]
  → game.quarter, game.periods_per_game

clockMinutes = game.game_clock_minutes
clockSeconds = game.game_clock_seconds
(optional) sessionStorage backup overrides if recent

storageKey = `quarterLength_${gameId}`
quarterLen = 12   // DEFAULT
if localStorage[storageKey]:
  quarterLen = parseInt(stored, 10) || 12
  if clockSeconds===0 && clockMinutes===12 && quarterLen!==12:
    clockMinutes = quarterLen   // override stale 12:00
// ELSE: quarterLen stays 12 — game.quarter_length_minutes is never used

if clock valid:
  setClock(...)
  if !quarterLengthLockedRef:
    if !stored && [5,6,8,10,12,18,20].includes(clockMinutes):
      quarterLen = clockMinutes
      localStorage.setItem(storageKey, quarterLen)
    setOriginalQuarterLength(quarterLen)
    quarterLengthLockedRef = true
else:
  setClock(quarterLen * 60)
  setOriginalQuarterLength(quarterLen)
```

**Missing data:** `game.quarter_length_minutes` is fetched by `getGame()` but **never used** in useTracker. If localStorage is empty and current clock is not a “full quarter” value (e.g. 5:23), `quarterLen` stays **12** and is locked.

---

## 6. Quarter change (setQuarter) — exact data flow

```
setQuarter(newQuarter)
  stored = localStorage.getItem(`quarterLength_${gameId}`)
  parsed = stored ? parseInt(stored,10) : 0
  clockMinutesForQuarter = [5,6,8,10,12,18,20].includes(parsed) ? parsed : originalQuarterLength
  newClockMinutes = isOvertime ? 5 : clockMinutesForQuarter

  setQuarterState(newQuarter)
  resetClock(newQuarter)   → GameService.updateGameClock(gameId, { minutes: clockMinutes, seconds: 0, isRunning: false })
  GameService.updateGameState(gameId, {
    quarter: newQuarter,
    game_clock_minutes: newClockMinutes,
    game_clock_seconds: 0,
    is_clock_running: false,
    home_score: 0, away_score: 0,
    team_a_fouls: 0, team_b_fouls: 0
  })
  // updateGameState does NOT send quarter_length_minutes
```

So on quarter change, DB gets `game_clock_minutes = newClockMinutes`. If `originalQuarterLength` or localStorage was wrong (e.g. 12), DB and overlay both get 12.

---

## 7. Overlay (useGameOverlayData) — on quarter change

```
fetchGameData()
  game = supabase.from('games').select('*').single()
  quarterChanged = prev != null && prev.quarter !== (game.quarter || 1)
  useDbClock = !broadcastIsActive || quarterChanged

  gameClockMinutes = useDbClock ? (game.game_clock_minutes ?? 0) : (prev?.gameClockMinutes ?? game.game_clock_minutes ?? 0)
```

On quarter change, overlay **always** uses DB clock. It does **not** use `game.quarter_length_minutes` or any “locked period length.” So if the tracker wrote 12, overlay shows 12.

---

## 8. Input/Output summary for key functions

| Function | Inputs | Outputs (DB/localStorage/state) |
|----------|--------|----------------------------------|
| **GameService.updateGameState** | quarter, game_clock_minutes, game_clock_seconds, is_clock_running, home_score, away_score, team_*_fouls, team_*_timeouts | Updates `games` only; **no** `quarter_length_minutes` |
| **GameService.updateGameClock** | minutes, seconds, isRunning | Updates `games.game_clock_*`, `is_clock_running` only |
| **GameServiceV3.updateInitialClock** | minutes, seconds, isRunning | Updates `games.game_clock_*`, `is_clock_running`, **and** `quarter_length_minutes` |
| **useTracker init** | game (has quarter_length_minutes), localStorage | Sets clock, originalQuarterLength, quarterLengthLockedRef; **does not read** game.quarter_length_minutes |
| **setQuarter** | newQuarter, localStorage, originalQuarterLength | Writes clock + state to DB via updateGameClock + updateGameState; **does not** write quarter_length_minutes |
| **useGameOverlayData fetchGameData** | game (select *) | Sets overlayData.gameClockMinutes from game.game_clock_minutes when useDbClock; **does not** use quarter_length_minutes |

---

## 9. Gaps and missing data

1. **useTracker never uses `game.quarter_length_minutes`**  
   Even though `GameServiceV3.getGame()` returns it, init uses only `game_clock_minutes` and localStorage for `quarterLen` / `originalQuarterLength`. If localStorage is missing and current clock isn’t a full-quarter value, default 12 is used and locked.

2. **Quarter change does not preserve period length in DB**  
   `GameService.updateGameState()` does not accept or write `quarter_length_minutes`. So when the stat admin advances the quarter, the DB’s `quarter_length_minutes` is unchanged (good) but the **display** is driven by `game_clock_minutes`, which is set from `originalQuarterLength`/localStorage. If those are wrong (12), both DB and overlay show 12.

3. **Overlay has no notion of “locked period length”**  
   On quarter change it trusts `game.game_clock_minutes` only. There is no fallback to `quarter_length_minutes` or a separate “period duration” when the clock is reset.

4. **Stat edit reset**  
   `statEditService` calls `updateGameState` with `game_clock_minutes: 0` (and quarter: 1). It does not set `quarter_length_minutes`; that’s consistent with “reset to 0:00” but worth noting.

5. **Schema doc vs code**  
   `DATABASE_SCHEMA.md` does not list `games.quarter_length_minutes`. Code assumes it exists. If the column is missing, `GameServiceV3.updateInitialClock` PATCH may fail or be ignored for that field.

6. **Possible race**  
   Pre-flight writes `game_clock_minutes` and `quarter_length_minutes` and sets localStorage, then navigates to tracker. If the tracker load runs before the DB write is visible, init could still see old 12 and lock it. Unlikely if delay is 300ms but possible under load.

---

## 10. Data flow diagram (concise)

```
Pre-flight (scheduled game):
  PreFlightCheckModal.quarterLengthMinutes
    → GameServiceV3.updateInitialClock(gameId, { minutes })
    → games.game_clock_minutes, games.quarter_length_minutes
  stat-admin page
    → localStorage['quarterLength_'+gameId] = minutes

Tracker load:
  getGame() → game_clock_minutes, quarter_length_minutes (latter unused)
  localStorage['quarterLength_'+gameId] → originalQuarterLength (or default 12)
  sessionStorage backup can override clock time only

Quarter advance (manual):
  setQuarter(newQuarter)
  clockMinutesForQuarter = localStorage || originalQuarterLength
  → updateGameClock(minutes), updateGameState(game_clock_minutes, …)
  → games.game_clock_minutes updated; games.quarter_length_minutes NOT updated

Overlay refetch (e.g. postgres_changes):
  quarterChanged → useDbClock = true
  → gameClockMinutes = game.game_clock_minutes
  (no use of quarter_length_minutes)
```

---

## 11. Recommendations (for future fixes)

1. **useTracker init:** When determining `quarterLen`, prefer `game.quarter_length_minutes` (if in valid set) over default 12 when localStorage is missing.
2. **setQuarter / updateGameState:** Optionally pass through `quarter_length_minutes` so the DB keeps the same period length on quarter change (if product wants it stored per quarter).
3. **Overlay:** On quarter change, consider using `game.quarter_length_minutes` (or a “period duration” from context) as fallback when the displayed clock is “full period” (e.g. 12:00 or 6:00) so a mistaken 12 doesn’t stick.
4. **Schema:** Document `games.quarter_length_minutes` in DATABASE_SCHEMA.md and confirm migration exists.
5. **Single source of truth:** Decide whether period duration is DB (`quarter_length_minutes`) or localStorage + in-memory (`originalQuarterLength`) and align all readers (tracker, overlay, stats) with that.

---

*End of audit. No code was changed.*
