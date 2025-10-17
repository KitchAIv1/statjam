### Player Dashboard Integration and Theme Consolidation — September 2025

- **Branch**: `feature/figma-player-dashboard`
- **Scope**: Integrate the uploaded Figma Player Dashboard UI into the app, replace the existing player dashboard, and consolidate styling to the orange/red Figma theme (no legacy dark theme). Keep logic separate from UI and preserve role-based access control.
- **Non-goals**: Backend changes, SQL/RLS updates, and complex glassmorphism effects. Data wiring for real player stats is planned next.

---

### Summary

- Replaced the old player dashboard with the uploaded Figma design while retaining existing auth/role protections.
- Consolidated global styling to the orange/red Figma theme; removed legacy dark-theme remnants.
- Normalized UI component imports and casing (e.g., `Button.tsx` vs `button.tsx`) to prevent case-sensitivity build issues.
- Kept glassmorphism minimal (simple themed cards) to ensure reliability and speed; design fidelity remains aligned with Figma.

---

### Changes by Area

- **Global styling (`src/app/globals.css`)**
  - Replaced legacy mixed variables with Figma orange/red theme variables.
  - Removed legacy dark-theme OKLCH set; added dark tokens aligned to Figma palette.
  - Simplified glass classes to safe Tailwind apply-sets (no custom opacity utility tokens):
    - `.glass-card`, `.glass-card-light` → `@apply bg-card border border-border`.
    - `.glass-card-accent` → `@apply bg-accent border border-orange-300`.
  - Fixed Tailwind `@apply` error by removing unsupported `border-accent-foreground/20`.

- **Player dashboard route (`src/app/dashboard/player/page.tsx`)**
  - Enforced role guard via `useAuthStore()`; redirects non-player users to `/auth`.
  - Replaced old inline-styled dashboard with Figma component:
    - Renders `NavigationHeader` + `PlayerDashboard`.
    - Preserves clean loading state.

- **Figma components (copied into `src/components/`)**
  - Imported Figma Player Dashboard assets: `PlayerDashboard.tsx`, `PerformanceChart.tsx`, `SubscriptionModal.tsx`, `EditProfileModal.tsx`, `PremiumCards.tsx`, `AICoaching.tsx`, `TournamentCard.tsx`, `NotificationBell.tsx`, and UI primitives.
  - Normalized imports to absolute paths and corrected casing to match local UI primitives:
    - `./ui/button` → `@/components/ui/Button` (capitalized to match filesystem).
    - Similar updates for `badge`, `card`, `tabs`, `select`, `dialog`, `popover`, `progress`, `input`, `label`.
  - Ensured `PlayerDashboard.tsx` is a client component and uses app tokens.

---

### Files Touched (Key)

- Updated
  - `src/app/globals.css`
  - `src/app/dashboard/player/page.tsx`
  - `src/components/PlayerDashboard.tsx`
  - `src/components/SubscriptionModal.tsx`
  - `src/components/PremiumCards.tsx`
  - `src/components/PerformanceChart.tsx`
  - `src/components/NotificationBell.tsx`
  - `src/components/EditProfileModal.tsx`
  - `src/components/AICoaching.tsx`
  - `src/components/TournamentCard.tsx`

- Added (from Figma upload, previously present in repo under Figma dir; now integrated under `src/components/`)
  - Figma UI primitives and feature components referenced by the player dashboard.

---

### Risk/Impact

- Import casing conflicts on case-insensitive filesystems (macOS/Windows) could trigger duplicate module warnings; resolved by standardizing to `@/components/ui/Button` and matching filenames.
- Global CSS token changes affect shared components; reviewed for landing page and dashboards alignment.
- Glassmorphism minimized to avoid GPU-heavy effects and Tailwind token mismatches.

---

### Testing Checklist

- Auth and routing
  - [ ] Login as a user with role `player` and navigate to `/dashboard/player`.
  - [ ] Verify non-player users are redirected to `/auth`.

- UI/Styling
  - [ ] Confirm orange/red theme is consistent across the page (no legacy dark colors).
  - [ ] Verify layout, spacing, and typography match Figma (header, tabs, cards, chart block, right column panels).
  - [ ] Verify simplified glass card visuals still match brand and pass contrast checks.

- Regressions
  - [ ] Landing page renders with the same theme and without flicker.
  - [ ] Viewer and Stat Admin pages unaffected.

---

### Rollback

- Checkout `main` or revert the branch:
  - `git checkout main`
  - Or revert PR merging this branch.

---

### Follow-ups (Next)

- Wire real data into the player dashboard using existing services (e.g., `playerService`, games/stats endpoints).
- Add organizer/player schedules integration once endpoints are confirmed.
- Optional: Reintroduce refined glassmorphism using Figma tokens when stable.
- Cleanup: remove any obsolete old dashboard assets once confirmed unused.

---

### Notes

- Backend and storage remain managed by Supabase; no schema changes included here.
- All logic remains separated from UI. This integration is UI-first with auth/routing glue only.


