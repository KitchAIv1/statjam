# Pre-Flight Check Modal - Implementation Guide

## 📋 Overview

The Pre-Flight Check Modal is a UX pattern that allows Stat Admins and Coaches to configure automation settings **before** launching the tracker. This ensures users are aware of automation behavior and can customize it per-game.

---

## 🎯 User Flow

```
Dashboard → Click "Track Game" → Pre-Flight Check Modal → Confirm Settings → Launch Tracker
```

**Benefits:**
- ✅ Users see what automation is enabled before starting
- ✅ Per-game flexibility (different settings for different game types)
- ✅ Smart defaults (uses tournament settings or last used)
- ✅ One-click start for repeat users ("Balanced" preset is default)
- ✅ Advanced control for power users (custom toggles)

---

## 🏗️ Architecture

### Components Created

1. **`PreFlightCheckModal.tsx`** - Main modal component
   - Location: `/src/components/tracker-v3/modals/PreFlightCheckModal.tsx`
   - Responsibility: Display settings, handle preset selection, emit final settings

2. **Integration Points** (to be implemented):
   - **Stat Admin Dashboard**: Show modal when "Track Game" is clicked
   - **Coach Dashboard**: Show modal when "Quick Track" is clicked

---

## 📊 Settings Hierarchy

### 1. Stat Admin Mode

**Loading Priority:**
```typescript
1. games.automation_settings     // If exists, use this (saved from previous pre-flight)
2. tournaments.automation_flags  // Tournament defaults
3. PRESETS['balanced']           // Fallback preset
```

**Saving Flow:**
```typescript
User clicks "Start Tracking" 
→ Save settings to games.automation_settings
→ Pass settings to useTracker
→ Launch tracker with automation configured
```

### 2. Coach Mode

**Loading Priority:**
```typescript
1. games.automation_settings     // If exists, use this
2. COACH_AUTOMATION_FLAGS        // Coach defaults (hardcoded)
3. PRESETS['balanced']           // Fallback preset
```

---

## 🎨 Preset Options

### Minimal (Beginner)
```
Clock Automation: OFF
Possession: ON (auto-flip)
Sequences: ON (prompts only)
Fouls: OFF
```

**Use Case:** New users, practice games, manual control preferred

### Balanced (Recommended) ⭐
```
Clock Automation: ON (full automation)
Possession: ON (auto-flip + persist)
Sequences: ON (all prompts + linking)
Fouls: OFF (Phase 5+)
```

**Use Case:** Standard games, professional tracking, recommended for most users

### Full Automation (Advanced)
```
Clock Automation: ON
Possession: ON (including jump ball arrow)
Sequences: ON (all features)
Fouls: ON (when available)
```

**Use Case:** NBA-level tracking, zero manual intervention

### Custom
```
User toggles individual settings manually
```

**Use Case:** Power users, specific game scenarios, troubleshooting

---

## 💾 Database Schema

### Required Column (if not exists)

```sql
-- Add game-level automation settings
ALTER TABLE games
ADD COLUMN IF NOT EXISTS automation_settings JSONB DEFAULT NULL;

COMMENT ON COLUMN games.automation_settings IS 
'Per-game automation overrides (set via Pre-Flight Check Modal)';
```

### Data Example

```json
{
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
}
```

---

## 🔌 Integration Example (Stat Admin Dashboard)

### Step 1: Add Modal State

```typescript
// In your dashboard page (e.g., src/app/dashboard/stat-admin/page.tsx)
import { PreFlightCheckModal } from '@/components/tracker-v3/modals/PreFlightCheckModal';
import { AutomationFlags } from '@/lib/types/automation';

const [showPreFlight, setShowPreFlight] = useState(false);
const [selectedGame, setSelectedGame] = useState<any>(null);
```

### Step 2: Modify "Track Game" Button

```typescript
// Instead of launching tracker directly:
const handleTrackGame = (game: any) => {
  setSelectedGame(game);
  setShowPreFlight(true); // Show modal instead
};
```

### Step 3: Add Modal to JSX

```typescript
{showPreFlight && selectedGame && (
  <PreFlightCheckModal
    isOpen={showPreFlight}
    onClose={() => {
      setShowPreFlight(false);
      setSelectedGame(null);
    }}
    onStartTracking={async (settings: AutomationFlags) => {
      // Save settings to database
      await saveGameAutomationSettings(selectedGame.id, settings);
      
      // Launch tracker
      router.push(
        `/stat-tracker-v3?gameId=${selectedGame.id}&teamAId=${selectedGame.team_a_id}&teamBId=${selectedGame.team_b_id}`
      );
    }}
    gameId={selectedGame.id}
    gameName={`${selectedGame.team_a?.name || 'Team A'} vs ${selectedGame.team_b?.name || 'Team B'}`}
    tournamentName={selectedGame.tournament?.name}
    tournamentDefaults={selectedGame.tournament?.automation_flags || PRESETS['balanced'].settings}
    userRole="stat_admin"
  />
)}
```

### Step 4: Create Save Function

```typescript
async function saveGameAutomationSettings(gameId: string, settings: AutomationFlags) {
  try {
    const { GameServiceV3 } = await import('@/lib/services/gameServiceV3');
    await GameServiceV3.updateGameAutomation(gameId, settings);
    console.log('✅ Game automation settings saved');
  } catch (error) {
    console.error('❌ Failed to save automation settings:', error);
  }
}
```

---

## 📝 Service Method (Add to GameServiceV3)

```typescript
// In src/lib/services/gameServiceV3.ts

static async updateGameAutomation(
  gameId: string,
  settings: AutomationFlags
): Promise<boolean> {
  try {
    console.log('🎯 GameServiceV3: Updating game automation settings:', gameId);
    
    const response = await makeAuthenticatedRequest(
      `${SUPABASE_URL}/rest/v1/games?id=eq.${gameId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          automation_settings: settings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update game automation: ${response.statusText}`);
    }

    console.log('✅ GameServiceV3: Game automation updated successfully');
    return true;
  } catch (error) {
    console.error('❌ GameServiceV3: Error updating game automation:', error);
    throw error;
  }
}
```

---

## 🚀 Phase 1 Implementation Checklist

### Stat Admin (Priority 1)

- [x] Create `PreFlightCheckModal.tsx` component
- [ ] Add `games.automation_settings` column (SQL migration)
- [ ] Add `GameServiceV3.updateGameAutomation()` method
- [ ] Integrate modal into Stat Admin dashboard
- [ ] Test with tournament games
- [ ] Update `useTracker` to load from `games.automation_settings` first

### Coach (Priority 2)

- [ ] Test modal with coach mode
- [ ] Integrate into Coach dashboard (Quick Track flow)
- [ ] Test with non-tournament coach games
- [ ] Verify COACH_AUTOMATION_FLAGS fallback

### Future Enhancements

- [ ] Add "Remember for next time" checkbox
- [ ] Save user preferences to `users.tracker_preferences`
- [ ] Add preset icons/illustrations
- [ ] Add "Preview" feature (show what each automation does)
- [ ] Add settings history (show what settings were used in past games)

---

## 🧪 Testing Scenarios

### Test 1: First-Time User (No Previous Settings)
1. Click "Track Game"
2. Modal shows with "Balanced" preset selected
3. User clicks "Start Tracking"
4. Tracker launches with balanced automation
5. ✅ Verify: Clock automation works, possession flips, prompts appear

### Test 2: Custom Settings
1. Click "Track Game"
2. User expands "Advanced Settings"
3. User disables "Clock Automation"
4. User clicks "Start Tracking"
5. ✅ Verify: Clock is manual, other automation works

### Test 3: Tournament Defaults
1. Tournament has "Minimal" preset configured
2. Stat admin clicks "Track Game"
3. Modal shows with "Custom" selected (tournament settings)
4. ✅ Verify: Settings match tournament configuration

### Test 4: Re-opening Same Game
1. User tracks game with custom settings
2. User ends game and goes back
3. User clicks "Track Game" again (same game)
4. ✅ Verify: Modal shows previous custom settings

---

## 📌 Important Notes

### UX Considerations
- Default to "Balanced" preset for new users (not overwhelming)
- Hide "Advanced Settings" by default (reveal on demand)
- Show clear status indicators (green = ON, gray = OFF)
- One-click start for repeat users

### Performance
- Settings are saved to database ONCE (before tracking)
- No network calls during tracking (settings loaded into `useTracker`)
- Modal is lightweight (~20KB component)

### Backwards Compatibility
- If `games.automation_settings` is NULL, fall back to tournament defaults
- Existing games continue to work with tournament settings
- No breaking changes to current tracking flow

---

## 🎯 Success Metrics

After implementation, we should see:
- ✅ Users understand what automation is enabled BEFORE tracking
- ✅ Reduced mid-game "How do I turn this off?" questions
- ✅ More consistent tracking (users choose right settings upfront)
- ✅ Faster tracking start (one-click for repeat users)
- ✅ Better data quality (automation prevents human errors)

---

## 📚 Related Documentation

- `/docs/02-development/AUTOMATION_COMPLETE_GUIDE.md` - Full automation system docs
- `/docs/02-development/PHASE2_COACH_MODE_STATUS.md` - Coach mode automation
- `/src/lib/types/automation.ts` - TypeScript interfaces

