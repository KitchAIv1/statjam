# Phase 2 Clock Automation: Coach Mode Status

## 🎯 Executive Summary

**YES** - The Phase 2 Clock Automation Engine is **FULLY ENABLED** for coach mode, but with an important caveat about the dummy tournament.

---

## ✅ What Works in Coach Mode

### 1. **Clock Automation Engine**
- ✅ ClockEngine is integrated into `useTracker.recordStat()`
- ✅ Auto-pause logic for fouls, timeouts, violations
- ✅ Shot clock reset rules (NBA/FIBA/NCAA)
- ✅ NBA last 2-minute rule (clock stops on made baskets)
- ✅ Free throw mode detection (shot clock disabled)

### 2. **Ruleset System**
- ✅ Loads ruleset from tournament (NBA/FIBA/NCAA/CUSTOM)
- ✅ Applies custom overrides if CUSTOM ruleset
- ✅ Fallback to NBA ruleset if no tournament found

### 3. **Automation Flags**
- ✅ Loads `automation_settings` from tournament
- ✅ Defaults to all OFF if not configured
- ✅ Checks `automationFlags.clock.enabled` before processing

---

## ⚠️ The Coach Mode Caveat

### How Coach Games Work

When a coach creates a "Quick Track" game:

1. **Dummy Tournament Creation** (lines 20-65 in `coachGameService.ts`):
   ```typescript
   // Creates or finds "Coach Games (System)" tournament
   const dummyTournament = {
     name: 'Coach Games (System)',
     organizer_id: user.id,
     tournament_type: 'single_elimination',
     venue: 'Various',
     is_public: false,
     // ... other fields
   };
   ```

2. **Game Creation** (lines 67-86):
   ```typescript
   const game = {
     tournament_id: dummyTournamentId, // Links to dummy tournament
     team_a_id: request.coach_team_id,
     team_b_id: request.coach_team_id, // Placeholder
     stat_admin_id: user.id,
     // ... other fields
   };
   ```

3. **Ruleset Loading** (lines 220-265 in `useTracker.ts`):
   ```typescript
   // Fetches tournament by tournament_id
   const tournament = await fetch(`/tournaments?id=eq.${tournamentId}`);
   
   // Loads ruleset (defaults to 'NBA' if not set)
   const rulesetId = tournament.ruleset || 'NBA';
   setRuleset(RulesetService.getRuleset(rulesetId));
   
   // Loads automation flags (defaults to all OFF)
   const flags = tournament.automation_settings || DEFAULT_AUTOMATION_FLAGS;
   setAutomationFlags(flags);
   ```

---

## 🔍 Current State for Coach Games

### Default Configuration

**Dummy Tournament "Coach Games (System)"**:
- **Ruleset**: Not explicitly set → defaults to `'NBA'`
- **Automation Settings**: Not explicitly set → defaults to all OFF

```typescript
DEFAULT_AUTOMATION_FLAGS = {
  clock: { enabled: false },
  possession: { enabled: false },
  sequences: { enabled: false }
};
```

### What This Means

1. **Ruleset**: ✅ NBA rules are applied (12-min quarters, 24s shot clock)
2. **Clock Automation**: ❌ **DISABLED by default** (flags are OFF)
3. **Manual Control**: ✅ All clock controls work (start/stop/reset/edit)

---

## 🚀 How to Enable Clock Automation for Coach Mode

### Option 1: Enable for ALL Coach Games (Recommended)

Update the dummy tournament creation to include automation settings:

```sql
-- Run this SQL to enable Phase 2 automation for all coach games
UPDATE tournaments
SET 
  ruleset = 'NBA',
  automation_settings = jsonb_build_object(
    'clock', jsonb_build_object(
      'enabled', true,
      'autoPause', true,
      'autoReset', true,
      'stopOnMadeBasket', true
    ),
    'possession', jsonb_build_object('enabled', false),
    'sequences', jsonb_build_object('enabled', false)
  )
WHERE name = 'Coach Games (System)';
```

### Option 2: Enable for Specific Coach Games

1. Find the tournament ID for a specific coach game:
   ```sql
   SELECT g.id, g.tournament_id, t.name
   FROM games g
   JOIN tournaments t ON g.tournament_id = t.id
   WHERE g.stat_admin_id = '<coach_user_id>'
   AND g.is_coach_game = true;
   ```

2. Update that specific tournament:
   ```sql
   UPDATE tournaments
   SET automation_settings = jsonb_build_object(
     'clock', jsonb_build_object('enabled', true, ...)
   )
   WHERE id = '<tournament_id>';
   ```

### Option 3: Create a New Dummy Tournament with Automation

Modify `coachGameService.ts` to create the dummy tournament with automation enabled:

```typescript
const { data: newTournament } = await supabase
  .from('tournaments')
  .insert({
    name: 'Coach Games (System)',
    // ... other fields ...
    ruleset: 'NBA',
    automation_settings: {
      clock: {
        enabled: true,
        autoPause: true,
        autoReset: true,
        stopOnMadeBasket: true
      },
      possession: { enabled: false },
      sequences: { enabled: false }
    }
  });
```

---

## 📊 Testing Status

### Phase 2 Test Cases (from PHASE2_TESTING_GUIDE.md)

| Test Case | Stat Admin Mode | Coach Mode (Default) | Coach Mode (Enabled) |
|-----------|----------------|---------------------|---------------------|
| 1. Foul Auto-Pause | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 2. Timeout Auto-Pause | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 3. Shot Clock Reset (Rebound) | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 4. Shot Clock Reset (Steal) | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 5. Shot Clock 14s (Off Rebound) | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 6. NBA Last 2 Min Rule | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |
| 7. Free Throw Mode | ✅ (if enabled) | ❌ (flags OFF) | ✅ (if enabled) |

---

## 🎯 Recommendation

### For Beta Testing

**Enable automation for the dummy tournament** so coaches can test Phase 2 features:

```sql
-- Enable Phase 2 Clock Automation for all coach games
UPDATE tournaments
SET 
  ruleset = 'NBA',
  automation_settings = jsonb_build_object(
    'clock', jsonb_build_object(
      'enabled', true,
      'autoPause', true,
      'autoReset', true,
      'stopOnMadeBasket', true
    ),
    'possession', jsonb_build_object('enabled', false),
    'sequences', jsonb_build_object('enabled', false)
  )
WHERE name = 'Coach Games (System)';
```

### For Production

**Add a UI toggle in Coach Settings** to let coaches enable/disable automation per game or per team.

---

## 📝 Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Engine Integration** | ✅ COMPLETE | ClockEngine is fully integrated |
| **Ruleset Support** | ✅ COMPLETE | NBA/FIBA/NCAA rules work |
| **Manual Controls** | ✅ COMPLETE | All buttons work (start/stop/reset/edit) |
| **Auto-Pause** | ⚠️ DISABLED | Flags are OFF by default |
| **Auto-Reset** | ⚠️ DISABLED | Flags are OFF by default |
| **NBA Last 2 Min** | ⚠️ DISABLED | Flags are OFF by default |
| **Free Throw Mode** | ⚠️ DISABLED | Flags are OFF by default |

**Action Required**: Run the SQL update to enable automation for coach games, or modify `coachGameService.ts` to create tournaments with automation enabled by default.

---

## 🔗 Related Files

- `src/hooks/useTracker.ts` (lines 220-265): Ruleset & automation loading
- `src/hooks/useTracker.ts` (lines 717-787): Clock automation processing
- `src/lib/services/coachGameService.ts` (lines 20-65): Dummy tournament creation
- `src/lib/engines/clockEngine.ts`: Clock automation logic
- `docs/02-development/PHASE2_TESTING_GUIDE.md`: Full test cases

---

**Last Updated**: 2025-10-28  
**Phase**: Phase 2 (Clock Automation)  
**Status**: Engine Complete, Flags Disabled by Default

