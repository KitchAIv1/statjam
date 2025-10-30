# Stat Tracker V3 - Quick Reference Guide

**Quick access guide for developers working on the stat tracker**

---

## File Locations

### Core Files
```
src/app/stat-tracker-v3/page.tsx          # Main orchestration
src/hooks/useTracker.ts                    # State management
src/hooks/useShotClockViolation.ts         # Violation detection
```

### Services
```
src/lib/services/gameServiceV3.ts          # Primary API layer
src/lib/services/teamServiceV3.ts          # Team/player data
src/lib/services/statsService.ts           # Stats aggregation
```

### Types
```
src/lib/types/automation.ts                # Automation flags
src/lib/types/tracker.ts                   # Core tracker types
```

### Desktop Components
```
src/components/tracker-v3/
  ├── TopScoreboardV3.tsx                  # Scoreboard + clocks
  ├── TeamRosterV3.tsx                     # Player roster
  ├── DesktopStatGridV3.tsx                # Stat entry buttons
  ├── PossessionIndicator.tsx              # Possession display
  └── SubstitutionModalV3.tsx              # Substitution UI
```

### Mobile Components
```
src/components/tracker-v3/mobile/
  ├── MobileLayoutV3.tsx                   # Mobile wrapper
  ├── MobileStatGridV3.tsx                 # Mobile stat buttons
  └── CompactScoreboardV3.tsx              # Mobile scoreboard
```

### Modals
```
src/components/tracker-v3/modals/
  ├── PreFlightCheckModal.tsx              # Automation config
  ├── ShotClockViolationModal.tsx          # Violation alert
  ├── AssistPromptModal.tsx                # Assist selection
  ├── ReboundPromptModal.tsx               # Rebound selection
  ├── BlockPromptModal.tsx                 # Block selection
  ├── TurnoverPromptModal.tsx              # Turnover details
  ├── FoulTypeSelectionModal.tsx           # Foul type picker
  ├── VictimPlayerSelectionModal.tsx       # Fouled player
  └── FreeThrowSequenceModal.tsx           # FT recording
```

---

## Common Tasks

### Add a New Stat Type

1. **Update type definition** (`src/lib/types/tracker.ts`):
```typescript
export type StatType =
  | 'three_pointer'
  | 'field_goal'
  | 'your_new_stat'; // Add here
```

2. **Add button** (`src/components/tracker-v3/DesktopStatGridV3.tsx`):
```typescript
<button
  onClick={() => handleStatClick('your_new_stat')}
  className="stat-button"
>
  Your Stat
</button>
```

3. **Handle recording** (`src/hooks/useTracker.ts`):
```typescript
// Add logic in recordStat() method
if (stat.statType === 'your_new_stat') {
  statValue = 1; // or custom logic
}
```

4. **Update database** (if needed):
```sql
-- Add to game_stats_type_check constraint
ALTER TABLE game_stats DROP CONSTRAINT game_stats_type_check;
ALTER TABLE game_stats ADD CONSTRAINT game_stats_type_check
  CHECK (stat_type IN ('three_pointer', 'field_goal', 'your_new_stat', ...));
```

---

### Add a New Automation Flag

1. **Update type** (`src/lib/types/automation.ts`):
```typescript
export interface YourAutomationFlags {
  enabled: boolean;
  yourFeature: boolean;
}

export interface AutomationFlags {
  clock: ClockAutomationFlags;
  yourCategory: YourAutomationFlags; // Add here
}
```

2. **Update defaults**:
```typescript
export const DEFAULT_AUTOMATION_FLAGS: AutomationFlags = {
  clock: { ... },
  yourCategory: {
    enabled: false,
    yourFeature: false
  }
};
```

3. **Implement logic** (`src/hooks/useTracker.ts`):
```typescript
if (automationFlags.yourCategory.enabled && automationFlags.yourCategory.yourFeature) {
  // Your automation logic
}
```

4. **Add to Pre-Flight Check** (`src/components/tracker-v3/modals/PreFlightCheckModal.tsx`):
```typescript
<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    checked={currentSettings.yourCategory.yourFeature}
    onChange={() => toggleSetting('yourCategory', 'yourFeature')}
  />
  <span>Your Feature</span>
</label>
```

---

### Add a New Modal

1. **Create component** (`src/components/tracker-v3/modals/YourModal.tsx`):
```typescript
interface YourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export function YourModal({ isOpen, onClose, onConfirm }: YourModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Your modal content */}
    </div>
  );
}
```

2. **Add state** (`src/app/stat-tracker-v3/page.tsx`):
```typescript
const [showYourModal, setShowYourModal] = useState(false);
```

3. **Trigger modal**:
```typescript
const handleYourAction = () => {
  setShowYourModal(true);
};
```

4. **Render modal**:
```typescript
{showYourModal && (
  <YourModal
    isOpen={showYourModal}
    onClose={() => setShowYourModal(false)}
    onConfirm={(data) => {
      // Handle confirmation
      setShowYourModal(false);
    }}
  />
)}
```

---

### Debug Automation Issues

1. **Check automation flags**:
```typescript
console.log('Automation flags:', tracker.automationFlags);
```

2. **Verify settings hierarchy**:
```sql
-- Check game settings
SELECT automation_settings FROM games WHERE id = '<game-id>';

-- Check tournament settings
SELECT automation_settings FROM tournaments WHERE id = '<tournament-id>';
```

3. **Enable all automation** (for testing):
```sql
-- Run this in Supabase SQL Editor
UPDATE tournaments
SET automation_settings = jsonb_set(
  COALESCE(automation_settings, '{}'::jsonb),
  '{clock,enabled}',
  'true'
);
```

4. **Check console logs**:
```typescript
// Look for these in browser console
"🎯 AUTOMATION:" // Automation triggers
"🏀 Recording stat:" // Stat recording
"⏰ Clock automation:" // Clock actions
"🔄 Possession flip:" // Possession changes
```

---

### Test a Specific Feature

#### Test Shot Clock Violation
1. Start game clock
2. Start shot clock
3. Let shot clock run to 0
4. Verify modal appears
5. Verify game clock pauses
6. Record violation or dismiss

#### Test Assist Sequence
1. Enable sequences automation
2. Record made 2PT or 3PT
3. Verify assist prompt appears
4. Select assisting player
5. Verify assist is recorded with `sequence_id`

#### Test Free Throw Sequence
1. Record shooting foul (2PT or 3PT)
2. Select fouled player
3. Record FT results (made/missed)
4. Verify score updates
5. Verify possession handling

#### Test Pre-Flight Check
1. Go to Stat Admin dashboard
2. Click "Launch Tracker"
3. Verify modal appears
4. Select preset or customize
5. Start tracking
6. Verify settings are applied

---

## API Quick Reference

### GameServiceV3

```typescript
// Get game data
const game = await GameServiceV3.getGameById(gameId);

// Record stat
await GameServiceV3.recordStat({
  gameId,
  playerId,
  teamId,
  statType: 'field_goal',
  modifier: 'made',
  quarter: 1,
  gameTimeMinutes: 10,
  gameTimeSeconds: 30,
  statValue: 2
});

// Record timeout
await GameServiceV3.recordTimeout({
  gameId,
  teamId,
  quarter: 1,
  gameClockMinutes: 8,
  gameClockSeconds: 45,
  timeoutType: 'full'
});

// Update game status
await GameServiceV3.updateGameStatus(gameId, 'completed');

// Save automation settings
await GameServiceV3.updateGameAutomation(gameId, automationFlags);
```

### useTracker Hook

```typescript
const tracker = useTracker({
  initialGameId: gameId,
  teamAId: teamAId,
  teamBId: teamBId,
  isCoachMode: false
});

// Record stat
await tracker.recordStat({
  gameId,
  playerId,
  teamId,
  statType: 'three_pointer',
  modifier: 'made'
});

// Clock control
tracker.startClock();
tracker.stopClock();
tracker.resetClock();
tracker.setCustomTime(10, 0);

// Shot clock control
tracker.startShotClock();
tracker.stopShotClock();
tracker.resetShotClock(24);

// Substitution
await tracker.substitute({
  gameId,
  teamId,
  playerOutId,
  playerInId,
  quarter: 1,
  gameTimeSeconds: 600
});

// Timeout
tracker.startTimeout(teamId, 'full');

// End game
await tracker.closeGame();
```

---

## Database Quick Reference

### Query Game Stats
```sql
SELECT 
  gs.*,
  u.name as player_name,
  t.name as team_name
FROM game_stats gs
LEFT JOIN users u ON gs.player_id = u.id
LEFT JOIN teams t ON gs.team_id = t.id
WHERE gs.game_id = '<game-id>'
ORDER BY gs.created_at DESC;
```

### Check Automation Settings
```sql
-- Game settings
SELECT id, automation_settings 
FROM games 
WHERE id = '<game-id>';

-- Tournament settings
SELECT id, name, automation_settings 
FROM tournaments 
WHERE id = '<tournament-id>';
```

### Enable All Automation
```sql
UPDATE tournaments
SET automation_settings = '{
  "clock": {
    "enabled": true,
    "autoPause": true,
    "autoReset": true,
    "ftMode": true,
    "madeBasketStop": false
  },
  "possession": {
    "enabled": true,
    "autoFlip": true,
    "persistState": true,
    "jumpBallArrow": false
  },
  "sequences": {
    "enabled": true,
    "promptAssists": true,
    "promptRebounds": true,
    "promptBlocks": true,
    "linkEvents": true,
    "freeThrowSequence": true
  },
  "fouls": {
    "enabled": false,
    "bonusFreeThrows": false,
    "foulOutEnforcement": false,
    "technicalEjection": false
  },
  "undo": {
    "enabled": false,
    "maxHistorySize": 50
  }
}'::jsonb;
```

### Check Game Status
```sql
SELECT 
  g.id,
  g.status,
  g.quarter,
  g.game_clock_minutes,
  g.game_clock_seconds,
  g.home_score,
  g.away_score,
  ta.name as team_a_name,
  tb.name as team_b_name
FROM games g
LEFT JOIN teams ta ON g.team_a_id = ta.id
LEFT JOIN teams tb ON g.team_b_id = tb.id
WHERE g.id = '<game-id>';
```

---

## Troubleshooting Checklist

### Stats Not Recording
- [ ] Check browser console for errors
- [ ] Verify player is selected
- [ ] Verify clock is running (if required)
- [ ] Check auth token is valid
- [ ] Verify database constraints
- [ ] Check network tab for failed requests

### Automation Not Working
- [ ] Check `automationFlags` in console
- [ ] Verify game has `automation_settings`
- [ ] Verify tournament has `automation_settings`
- [ ] Check Pre-Flight Check was used
- [ ] Run `ENABLE_ALL_AUTOMATION.sql`
- [ ] Clear cache and hard reload

### Modals Not Appearing
- [ ] Check modal state variable
- [ ] Verify automation flag is enabled
- [ ] Check console for errors
- [ ] Verify trigger conditions are met
- [ ] Check z-index conflicts

### Clock Issues
- [ ] Verify `automationFlags.clock.enabled`
- [ ] Check clock state in `useTracker`
- [ ] Verify clock interval is running
- [ ] Check for conflicting clock controls
- [ ] Verify database persistence

### Possession Issues
- [ ] Verify `automationFlags.possession.enabled`
- [ ] Check possession state in `useTracker`
- [ ] Verify auto-flip logic
- [ ] Check database `game_possessions` table
- [ ] Verify team IDs are correct

---

## Performance Tips

### Optimize Re-renders
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ prop }) => {
  // Component logic
});

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);

// Use useMemo for computed values
const computedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);
```

### Optimize Database Queries
```typescript
// Use select() to fetch only needed fields
const { data } = await supabase
  .from('game_stats')
  .select('id, stat_type, stat_value')
  .eq('game_id', gameId);

// Use indexes for frequently queried columns
CREATE INDEX idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX idx_game_stats_player_id ON game_stats(player_id);
```

### Reduce Bundle Size
```typescript
// Use dynamic imports for modals
const PreFlightCheckModal = dynamic(
  () => import('@/components/tracker-v3/modals/PreFlightCheckModal'),
  { ssr: false }
);
```

---

## Code Style Guidelines

### Component Structure
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';

// 2. Types/Interfaces
interface ComponentProps {
  prop1: string;
  prop2: number;
}

// 3. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 6. Handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 7. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions
```typescript
// Components: PascalCase
export function StatTrackerV3() {}

// Hooks: camelCase with 'use' prefix
export function useTracker() {}

// Services: PascalCase with 'Service' suffix
export class GameServiceV3 {}

// Constants: UPPER_SNAKE_CASE
const DEFAULT_AUTOMATION_FLAGS = {};

// Variables/Functions: camelCase
const gameId = 'abc';
function recordStat() {}
```

---

## Git Workflow

### Branch Naming
```bash
feature/shot-clock-violation
fix/timeout-ui-bug
refactor/use-tracker-hook
docs/stat-tracker-guide
```

### Commit Messages
```bash
feat: Add shot clock violation detection
fix: Correct timeout UI display with nullish coalescing
refactor: Extract modal logic to custom hook
docs: Update stat tracker architecture guide
```

### Before Committing
```bash
# 1. Run linter
npm run lint

# 2. Run type check
npm run type-check

# 3. Test locally
npm run dev

# 4. Build check
npm run build
```

---

## Useful Commands

### Development
```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run type-check

# Build for production
npm run build
```

### Database
```bash
# Connect to Supabase
supabase db remote connect

# Run migration
supabase db push

# Reset database
supabase db reset
```

### Debugging
```bash
# Enable verbose logging
localStorage.setItem('debug', 'true')

# Clear all storage
localStorage.clear()
sessionStorage.clear()

# Check auth token
localStorage.getItem('supabase.auth.token')
```

---

## Resources

### Documentation
- [Main Architecture Doc](./STAT_ADMIN_TRACKER_COMPLETE_MAP.md)
- [Shot Clock Violation](../02-development/SHOT_CLOCK_VIOLATION_IMPLEMENTATION.md)
- [Pre-Flight Check](../02-development/PRE_FLIGHT_CHECK_IMPLEMENTATION.md)
- [Game Ended State](../02-development/GAME_ENDED_STATE_FIX.md)

### External Links
- [Next.js Docs](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**Last Updated**: October 30, 2025  
**Maintained By**: Development Team

