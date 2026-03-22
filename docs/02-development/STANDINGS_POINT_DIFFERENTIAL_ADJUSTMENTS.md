# Standings point differential adjustments

**Version:** Introduced in **StatJam v0.17.14** (March 2026).  
**Code:** [`tournamentStandingsService.ts`](../../src/lib/services/tournamentStandingsService.ts) (`parseStandingsPointDifferentialAdjustments`, `getTournamentStandings`).  
**UI:** Public tournament **Standings** tab via [`useTournamentStandings`](../../src/hooks/useTournamentStandings.ts) → same service.

---

## Purpose

Optional **league-issued** adjustments to **displayed** point differential (PF − PA + delta) for specific teams in a tournament. Does **not** modify `game_stats`, `games.home_score` / `away_score`, wins, or losses.

---

## `tournaments.ruleset_config` shape

Merge a top-level key into existing JSON (do not replace the whole `ruleset_config` unless intentional):

```json
{
  "standingsPointDifferentialAdjustments": {
    "<team-uuid>": 20,
    "<team-uuid>": 20
  }
}
```

| Rule | Detail |
|------|--------|
| Key name | **`standingsPointDifferentialAdjustments`** (camelCase) — required exact match. |
| Values | **JSON numbers** (`20`), not strings (`"20"`). |
| Team IDs | Must match `teams.id` for rows that appear in standings (same IDs as in `games.team_a_id` / `team_b_id`). |

---

## RIBL6 production example (Supabase SQL)

Panthers and Spartans **+20** each for tournament RIBL6:

```sql
UPDATE tournaments
SET ruleset_config = COALESCE(ruleset_config, '{}'::jsonb) || jsonb_build_object(
  'standingsPointDifferentialAdjustments',
  jsonb_build_object(
    '53746db4-7ceb-47f0-933e-672960a94b33', 20,
    'daf87884-6a6e-44f7-880c-cfe5e76074ac', 20
  )
)
WHERE id = '9129be18-f6e5-4c53-ae2b-1638fa75398c';
```

**Verify:**

```sql
SELECT ruleset_config->'standingsPointDifferentialAdjustments' AS adj
FROM tournaments
WHERE id = '9129be18-f6e5-4c53-ae2b-1638fa75398c';
```

**Remove** adjustments (example — rebuild or merge as needed):

```sql
-- Merge empty object (removes deltas if no other code relies on the key)
UPDATE tournaments
SET ruleset_config = ruleset_config || '{"standingsPointDifferentialAdjustments": {}}'::jsonb
WHERE id = '9129be18-f6e5-4c53-ae2b-1638fa75398c';
```

---

## Client cache (troubleshooting)

- In-memory cache: `tournament_standings:<tournamentId>` — **3 minutes** ([`CacheTTL.tournamentStandings`](../../src/lib/utils/cache.ts)).
- [`TournamentPageShell`](../../src/components/tournament/TournamentPageShell.tsx) **prefetches** standings into the same cache on tournament page load.
- After updating `ruleset_config` in Supabase, if Diff does not update immediately: **wait for TTL**, **new browser session / incognito**, or rely on natural expiry. (Future: explicit cache invalidation when tournament config changes.)

---

## Related docs

- [data-fetching.md](../03-architecture/data-fetching.md) — patterns + standings config pointer.
- [CHANGELOG v0.17.14](../01-project/CHANGELOG.md) — release notes.
