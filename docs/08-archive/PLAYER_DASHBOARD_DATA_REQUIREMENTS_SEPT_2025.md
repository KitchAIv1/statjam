### Player Dashboard — Phase 1 Data Requirements (September 2025)

- **Branch**: `feature/figma-player-dashboard`
- **UI Baseline**: Figma player dashboard (orange/red theme). Keep UI as-is; no complex glass effects required in Phase 1.
- **Goal**: Define the exact data and derived metrics needed to power the new Player Dashboard while preserving existing auth/role access rules.

---

### Scope (Phase 1)

- Implement the Figma Player Dashboard UI with real data wiring for the following areas:
  - Identity header (player info, team context)
  - Season averages (core stats)
  - Career highs (core stats)
  - Performance analytics card (headline KPI tiles + time-series chart)
  - My tournaments/upcoming games panel
  - Achievements (core badges)
  - Notifications (bell count and popover list)
  - Profile editing modal (basic bio/athletic fields and photos)

---

### Out of Scope (Phase 1)

- Social highlights/feeds (media tiles, views, shares)
- Premium-only features and paywalls (e.g., AI Coaching full experience, gated cards)
- Advanced visual effects (complex glassmorphism beyond simple themed cards)

Note: These will be addressed in later phases.

---

### Access Control and Roles

- Must use existing auth system and role-based access control.
- Only users with role `player` can access `/dashboard/player`.
- All queries must be scoped to the authenticated `userId`/`playerId` (RLS-safe).

---

### Data Inventory

- **Auth/context**
  - `userId`
  - `role` (must be `player`)
  - `isPremium` (Phase 1 used only for UI flags; see Trial policy)

- **Player identity**
  - `playerId`
  - `name` (full name)
  - `jerseyNumber`
  - `position`
  - `teamId`, `teamName`
  - `age`
  - `height`, `weight`
  - `country` (optional)

- **Media assets**
  - `profilePhotoUrl`
  - `posePhotoUrl`
  - `teamLogoUrl` (optional)

- **Season context**
  - `seasonId` (current)
  - `seasonLabel` (e.g., "2025 Summer")

- **Season averages (derived from game stats)**
  - `pointsPerGame`
  - `reboundsPerGame`
  - `assistsPerGame`
  - `fieldGoalPct` = FGM/FGA
  - [Optional] `threePointPct` = 3PM/3PA
  - [Optional] `freeThrowPct` = FTM/FTA
  - [Optional] `minutesPerGame`

- **Career highs (derived)**
  - `careerHigh.points`
  - `careerHigh.rebounds`
  - `careerHigh.assists`
  - [Optional] `careerHigh.blocks`, `steals`, `threes`, `ftm`

- **Performance analytics**
  - KPI tiles:
    - `trendVsLastMonthPercent` (define basis — e.g., PPG or composite)
    - `seasonHighPoints` (or selected headline metric)
    - `overallRating` (composite; if not formalized, use placeholder rule)
  - Time-series chart (last N games):
    - Per game: `date`, `opponentTeamName`, `points`, `rebounds`, `assists`
    - [Optional series] `fgm`, `fga`, `3pm`, `3pa`, `ftm`, `fta`, `minutes`

- **My tournaments / upcoming games**
  - `entries[]`:
    - `gameId`
    - `tournamentId`, `tournamentName`
    - `opponentTeamId`, `opponentTeamName`, `opponentLogoUrl`
    - `scheduledAt` (ISO)
    - `status` (scheduled/live/completed)
    - [Optional] `location`

- **Achievements**
  - `achievements[]`:
    - `type` (e.g., points, rebounds, double-double, triple-double, locked)
    - `label` (short display label)
    - `value` (number or `?` for locked)
    - `unlockedAt` (optional)

- **Notifications**
  - `notifications[]`:
    - `id`, `title`, `message`
    - `createdAt`
    - `isRead`
    - `type` (system, tournament, team, stat-update)

- **Profile editing modal**
  - Editable fields: `name`, `jerseyNumber`, `position`, `height`, `weight`, `age`, `country`, `profilePhotoUrl`, `posePhotoUrl`
  - Team fields: `teamId` (editable only if permitted) or `teamName` (read-only)

- **UI state (client)**
  - Active tab: `dashboard` | `ai-coaching` (AI Coaching remains gated/off in Phase 1)
  - Modal visibility: subscription (placeholder only), edit profile
  - Chart range/filter: if exposed by UI controls

---

### Derived Metrics and Rules

- Averages computed over current-season games associated to the player.
- Percentages must use made/attempts with division-by-zero safety.
- Trend vs. last month should compare identical metrics across comparable spans (define N games or calendar period consistently).
- Overall rating: use a stable, documented rule or placeholder; do not block the UI if absent.

---

### Theming and UX

- Use the established orange/red theme tokens application-wide.
- Keep Figma layout structure, spacing, and typography.
- Avoid complex glass effects in Phase 1; use simple themed cards.

---

### Trial and Premium Policy (Phase 1 behavior)

- All players receive a 1-month free trial window starting from their first dashboard access (or account creation — to be finalized).
- After the trial ends, players revert to non-premium mode unless subscribed.
- Even if premium features are not yet implemented, the trial state and post-trial non-premium state must be tracked to ensure future compatibility.
- Phase 1 UI must not block core dashboard features due to premium state; premium-only sections remain hidden or marked as upcoming.

---

### Security and Data Access

- Enforce role `player` and scope all data to `userId/playerId`.
- Respect existing Supabase RLS policies; do not fetch cross-user data.
- Defensive null checks for missing media or optional fields.

---

### Testing Checklist

- Auth and ACL
  - [ ] Non-players cannot access `/dashboard/player`.
  - [ ] Player can access and all panels render without errors.

- Data correctness
  - [ ] Season averages match recent games in database.
  - [ ] Career highs align with recorded game stats.
  - [ ] KPI tiles show plausible values; chart renders for last N games.
  - [ ] Upcoming games list only player-relevant entries.
  - [ ] Achievements display correct values/locked states.
  - [ ] Notifications show latest items and mark-as-read works (if enabled).

- UX and theming
  - [ ] Orange/red theme consistent across all cards and tabs.
  - [ ] Layout matches Figma (spacing, typography, component hierarchy).

- Trial logic
  - [ ] Trial status is recorded and visible to logic (non-blocking UI).
  - [ ] Post-trial, dashboard still functions in non-premium mode.

---

### Future Phases (Not Phase 1)

- Social highlights/feeds (media, views, sharing)
- Full premium flows (plans, billing UI, AI Coaching, premium-only panels)
- Advanced analytics (shot charts, on/off, clutch splits)
- Enhanced glassmorphism and motion affordances


