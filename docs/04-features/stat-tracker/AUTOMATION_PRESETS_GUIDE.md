# Stat Tracker Automation Presets Guide

## Overview
Stat admins and coaches can select between three automation modes before launching any game. This guide explains exactly what each preset does, how the new comparison UI works, and how demo games remain private while providing full training capabilities.

- **Locations**: `/dashboard/stat-admin/automation-guide`, `/dashboard/coach/automation-guide`
- **Component**: `src/components/tracker-v3/AutomationPresetsComparison.tsx`
- **Page**: `src/app/dashboard/stat-admin/automation-guide/page.tsx`
- **Related Services**: `GameServiceV3.updateGameAutomation`, `useTracker`

## Preset Profiles

| Feature Category | 🎯 Minimal (Beginner) | ⚡ Balanced (Recommended) | 🚀 Full Automation |
|------------------|-----------------------|---------------------------|--------------------|
| Game Clock       | Manual control, no auto pause/reset | Auto pause/reset + FT mode | Auto pause/reset + FT mode |
| Possession       | Auto flip arrow + persist state | Same as Minimal | Same as Balanced + jump ball arrow |
| Sequences        | **Disabled** (no prompts) | Assist/Rebound/Block prompts + linked events | Same as Balanced |
| Fouls            | Manual | Manual | Bonus free throws, foul-out, technical ejection |
| Undo History     | Off | Off | On (max 50 actions) |

### Minimal (Beginner)
- Clock, sequences, fouls, undo automation disabled
- Only possession auto-flip/persist is enabled to keep scoreboard accurate
- Designed for training sessions and manual audit scenarios

### Balanced (Recommended)
- Clock automation (auto pause/reset, FT mode) enabled
- Assist/rebound/block prompts with linked event sequencing
- Fouls remain manual for tighter control

### Full Automation (Advanced)
- Everything from Balanced plus foul enforcement and undo history
- Jump ball arrow automation for alternating possession
- Ideal for experienced crews who want the fastest workflow

## Demo Game Workflow

1. **Launch** the demo card from the Stat Admin dashboard (`Tracker Automation Guide` quick link)
2. **Select preset** in the Pre-Flight modal – Minimal is now fully manual (no prompts)
3. **Settings save** per game via `GameServiceV3.updateGameAutomation`
4. **RLS updates** (migrations 008, 009, 010) allow stat admins to:
   - Insert/update demo stats (`game_stats`)
   - Update aggregate `stats` table
   - Persist automation presets on demo games (`games_update_policy`)
5. **Tracker Banner** shows `🎯 DEMO MODE` to reinforce private training context

## Files Updated in This Release

- `src/components/tracker-v3/TopScoreboardV3.tsx` – Demo badge + prop support
- `src/app/dashboard/stat-admin/page.tsx` – Automation guide CTA + preset persistence
- `src/app/dashboard/stat-admin/automation-guide/page.tsx` – New documentation screen
- `src/components/tracker-v3/AutomationPresetsComparison.tsx` – Reusable comparison table
- `src/hooks/useTracker.ts` – Minimal preset now skips automation sequences
- `database/migrations/008-010` – Demo-friendly RLS policies

## QA Checklist

- [ ] Launch demo game → choose **Minimal** → no assist/rebound/block prompts
- [ ] Switch to **Balanced** → prompts appear and can be completed
- [ ] Switch to **Full** → foul automation + undo history active
- [ ] Verify `games.automation_settings` updated via Supabase console
- [ ] Confirm demo stats visible only on Stat Admin dashboard and tracker banner

## References
- README section **“Automation & Demo Training”**
- `database/DEMO_GAME_RLS_FIX_INSTRUCTIONS.md`
- `docs/04-features/stat-tracker/STAT_TRACKER_V3.md` (pending updates)
