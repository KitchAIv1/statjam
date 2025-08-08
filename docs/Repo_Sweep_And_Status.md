## Repo sweep and current status (2025-08-08)

### What was done
- Resolved merge conflict markers that were crashing the app.
  - Cleaned `src/app/stat-tracker/page.tsx` around local score updates and quarter prompt.
  - Cleaned `src/lib/services/gameService.ts` (substitution logging block).
  - Cleaned `src/hooks/useGameStream.tsx` (subscription for `game_substitutions`) and removed all conflict markers.
- Verified no remaining conflict markers in source files.
- Ran a production build to validate.

### Result
- Dev server: runs without crashes.
- Build: fails due to ESLint/type errors (no TS compile errors).

### Build-time issues to address (high level)
- Numerous ESLint “no-explicit-any” errors across:
  - `src/app/dashboard/stat-admin/page.tsx`
  - `src/app/dashboard/tournaments/[id]/page.tsx`
  - `src/app/dashboard/tournaments/[id]/schedule/page.tsx`
  - `src/app/dashboard/tournaments/[id]/teams/page.tsx`
  - `src/app/tournaments/page.tsx`
  - `src/app/game-viewer/[gameId]/page.tsx`
  - Hooks: `src/hooks/useGameStream.tsx`, `src/hooks/usePlayFeed.tsx`, `src/lib/hooks/*`
  - Services: `src/lib/services/*.ts`
  - Types: `src/lib/types/game.ts`
- A few `react/no-unescaped-entities` and missing deps warnings in hooks.

### Options to proceed
1) Fast unblock (config): set `eslint.ignoreDuringBuilds: true` in `next.config.js` to allow builds while we fix types incrementally.
2) Targeted fixes: address the most critical `any` types where data shapes are known (game, stat, substitution, play-by-play), and patch unescaped quotes. Likely 6–10 focused edits to get a green build.
3) Relax rule scope: locally disable `no-explicit-any` on specific lines/blocks where external SDK types are ambiguous.

### Recommendation
- Take option (2) first for critical surfaces (`useGameStream`, `usePlayFeed`, `gameService`, viewer pages), then decide whether to keep strict rules or relax in a few places. This preserves code quality and avoids hiding real issues.

### Next actions (pending approval)
- Patch the identified files with minimal, accurate types and fix the unescaped quotes.
- Re-run build; if green, commit and push.

