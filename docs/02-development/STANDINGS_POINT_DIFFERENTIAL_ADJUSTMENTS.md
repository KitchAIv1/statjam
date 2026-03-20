# Standings point differential adjustments

Optional per-tournament, per-team deltas applied **only** when computing public standings via `TournamentStandingsService.getTournamentStandings`.

## `tournaments.ruleset_config` shape

Add a top-level key (merged with existing `ruleset_config` JSON):

```json
{
  "standingsPointDifferentialAdjustments": {
    "<team-uuid>": 20,
    "<team-uuid>": 20
  }
}
```

Values are **added** to `pointsFor - pointsAgainst` for display and **sorting**. They do not change `game_stats`, `games` scores, W/L, PF, or PA columns.

## RIBL6 example (Supabase SQL)

Replace UUIDs if needed. Merges into existing `ruleset_config` without removing other keys at the top level.

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

To remove adjustments, set the object to `{}` or delete the key via a follow-up `UPDATE` that rebuilds `ruleset_config`.
