# Data Fetching

Guidance for how data is fetched across the StatJam frontend and shared services.

---

## Patterns to Avoid

- **Never use `.map(id => query({ id: \`eq.${id}\` }))`** — always use `in.(id1,id2,...)` batch queries for multi-record lookups. Per-id queries create N+1 patterns (e.g. 93 queries for 93 players). See `tournamentLeadersService.ts` for the correct batch pattern.

- **Never fire parallel prefetch calls on mount without a delay** — stagger background prefetching (e.g. `setTimeout(..., 3000)` with cleanup) to avoid competing with critical path renders. See `TournamentPageShell.tsx` leaders prefetch.

- **Always add in-flight guards to hooks that may mount multiple instances simultaneously on the same page** — use a ref (e.g. `useRef<Set<string>>`) to track in-flight cache keys and return early if a fetch for that key is already running; clear the key in a `finally` block. Prevents 8–10× duplicate fetches when OverviewTab, LeadersTab, and prefetch all mount at once. See `useTournamentLeaders.ts`.
