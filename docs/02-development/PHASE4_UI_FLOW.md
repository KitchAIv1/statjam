# 🎯 Phase 4: Play Sequences UI Flow

**Date**: October 28, 2025  
**Purpose**: Explain how Phase 4 automation appears in the UI  
**Status**: IMPLEMENTED

---

## 📊 USER EXPERIENCE FLOW

### **Scenario 1: Made Shot → Assist Prompt**

**Step 1: User Records Made Shot**
```
User clicks: "2PT MADE" button
Player: John Doe (#23)
```

**Step 2: Instant UI Updates** (Optimistic)
- ✅ Score updates immediately (+2 points)
- ✅ Last Action shows: "field_goal made recorded"
- ✅ Clock automation processes (Phase 2)
- ✅ Possession flips to opponent (Phase 3)

**Step 3: Play Engine Analyzes** (Phase 4 NEW)
```typescript
PlayEngine.analyzeEvent(madeShot, flags)
→ shouldPrompt: true
→ promptType: 'assist'
→ sequenceId: 'uuid-123'
```

**Step 4: Assist Modal Appears**
```
┌─────────────────────────────────────┐
│  🎯 Assist?                         │
│  John Doe made 2pt shot             │
├─────────────────────────────────────┤
│  Who assisted on this shot?         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ #12 Mike Smith              │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ #7  Sarah Johnson           │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ #15 Alex Brown              │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  [No Assist]  [Record Assist]      │
└─────────────────────────────────────┘
```

**Step 5: User Selects or Skips**

**Option A: User Selects Player**
- User clicks: Mike Smith (#12)
- Modal records assist stat
- Assist linked to shot via `sequence_id`
- Modal closes
- Play-by-play shows: "John Doe made 2PT (Assist: Mike Smith)"

**Option B: User Skips**
- User clicks: "No Assist"
- Modal closes
- No additional stat recorded
- Play-by-play shows: "John Doe made 2PT"

---

### **Scenario 2: Missed Shot → Rebound Prompt**

**Step 1: User Records Missed Shot**
```
User clicks: "2PT MISSED" button
Player: John Doe (#23)
```

**Step 2: Instant UI Updates**
- ✅ No score change (miss)
- ✅ Last Action shows: "field_goal missed recorded"
- ✅ Clock automation processes
- ✅ Possession stays with shooting team (awaiting rebound)

**Step 3: Rebound Modal Appears**
```
┌───────────────────────────────────────────────────┐
│  🏀 Rebound?                                      │
│  John Doe missed field_goal                       │
├───────────────────────────────────────────────────┤
│  Who got the rebound?                             │
│                                                   │
│  Team A (Offense)         Team B (Defense)        │
│  ┌──────────────────┐    ┌──────────────────┐    │
│  │ #12 Mike Smith   │    │ #5  Tom Wilson   │    │
│  └──────────────────┘    └──────────────────┘    │
│  ┌──────────────────┐    ┌──────────────────┐    │
│  │ #7  Sarah J.     │    │ #10 Lisa Davis   │    │
│  └──────────────────┘    └──────────────────┘    │
├───────────────────────────────────────────────────┤
│  [No Rebound]  [Record Rebound]                   │
└───────────────────────────────────────────────────┘
```

**Step 4: User Selects Player**
- User clicks: Tom Wilson (#5) from Team B
- Modal detects: **Defensive Rebound** (different team)
- Indicator shows: "🛡️ Defensive Rebound"
- User clicks: "Record Rebound"
- Rebound stat recorded and linked to miss
- Possession flips to Team B
- Modal closes

---

### **Scenario 3: Missed Shot → Block Prompt**

**Step 1: User Records Missed Shot**
```
User clicks: "3PT MISSED" button
Player: Sarah Johnson (#7)
```

**Step 2: Block Modal Appears**
```
┌─────────────────────────────────────┐
│  🛡️ Block?                          │
│  Sarah Johnson missed three_pointer │
├─────────────────────────────────────┤
│  Who blocked the shot?              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ #5  Tom Wilson              │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ #10 Lisa Davis              │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  [No Block]  [Record Block]         │
└─────────────────────────────────────┘
```

**Step 3: User Selects or Skips**
- If selected: Block stat recorded and linked to miss
- If skipped: No block recorded
- Modal closes

---

## 🔄 TECHNICAL FLOW

### **1. Stat Recording Pipeline**

```typescript
// User clicks stat button
await tracker.recordStat({
  gameId: 'game-123',
  playerId: 'player-456',
  teamId: 'team-789',
  statType: 'field_goal',
  modifier: 'made'
});

// Inside useTracker.recordStat():

// ✅ Step 1: Optimistic UI Updates (instant)
setScores(prev => ({ ...prev, [teamId]: prev[teamId] + 2 }));
setLastAction('field_goal made recorded');

// ✅ Step 2: Clock Automation (Phase 2)
if (ruleset && automationFlags.clock.enabled) {
  const clockResult = ClockEngine.processEvent(...);
  setClock(clockResult.newState);
  setShotClock(clockResult.newState);
}

// ✅ Step 3: Possession Automation (Phase 3)
if (ruleset && automationFlags.possession.enabled) {
  const possessionResult = PossessionEngine.processEvent(...);
  setPossession(possessionResult.newState);
}

// ✅ Step 4: Play Sequence Automation (Phase 4 NEW)
if (ruleset && automationFlags.sequences.enabled) {
  const playResult = PlayEngine.analyzeEvent(gameEvent, flags);
  
  if (playResult.shouldPrompt) {
    setPlayPrompt({
      isOpen: true,
      type: playResult.promptType, // 'assist' | 'rebound' | 'block'
      sequenceId: playResult.sequenceId,
      metadata: playResult.metadata
    });
  }
}

// ✅ Step 5: Database Write (non-blocking)
await GameServiceV3.recordStat(...);
```

### **2. Modal Rendering**

```typescript
// In stat-tracker-v3/page.tsx

// Assist Modal
{tracker.playPrompt.isOpen && tracker.playPrompt.type === 'assist' && (
  <AssistPromptModal
    isOpen={true}
    onClose={tracker.clearPlayPrompt}
    onSelectPlayer={async (playerId) => {
      await tracker.recordStat({
        gameId: gameIdParam,
        playerId: playerId,
        teamId: tracker.playPrompt.metadata?.shooterTeamId,
        statType: 'assist',
        modifier: 'made'
      });
      tracker.clearPlayPrompt();
    }}
    onSkip={tracker.clearPlayPrompt}
    players={teamAPlayers.filter(p => p.id !== shooterId)}
    shooterName={tracker.playPrompt.metadata?.shooterName}
    shotType={tracker.playPrompt.metadata?.shotType}
    shotValue={tracker.playPrompt.metadata?.shotValue}
  />
)}
```

### **3. Event Linking (Database)**

```typescript
// When assist is recorded:
await GameServiceV3.recordStat({
  gameId: 'game-123',
  playerId: 'assister-456',
  statType: 'assist',
  statValue: 1,
  // ✅ PHASE 4: Event linking
  sequenceId: 'uuid-123',        // Links to shot
  linkedEventId: 'shot-event-id', // Points to primary event
  eventMetadata: {
    shotType: 'field_goal',
    shooterId: 'shooter-789',
    automationVersion: 'v4.0-play-sequences'
  }
});
```

---

## 🎨 MODAL DESIGNS

### **AssistPromptModal**
- **Icon**: 👥 UserPlus (blue gradient)
- **Color**: Blue → Purple gradient
- **Layout**: Single column player list
- **Actions**: "No Assist" (outline) | "Record Assist" (gradient)

### **ReboundPromptModal**
- **Icon**: 📈 TrendingUp (orange gradient)
- **Color**: Orange → Red gradient
- **Layout**: Two columns (Team A | Team B)
- **Auto-Detection**: Offensive vs Defensive
- **Indicator**: "⚡ Offensive" or "🛡️ Defensive"
- **Actions**: "No Rebound" (outline) | "Record Rebound" (gradient)

### **BlockPromptModal**
- **Icon**: 🛡️ Shield (red gradient)
- **Color**: Red → Pink gradient
- **Layout**: Single column (defensive players only)
- **Actions**: "No Block" (outline) | "Record Block" (gradient)

### **FreeThrowSequenceModal** (Future)
- **Icon**: 🎯 Target (green gradient)
- **Color**: Green → Teal gradient
- **Layout**: Sequence counter + Made/Missed buttons
- **Progress**: Dots showing 1 of 2, 2 of 2, etc.
- **Actions**: Large "MISSED" (red) | "MADE" (green) buttons

---

## 🎯 USER BENEFITS

### **1. Faster Stat Entry**
- No need to manually record assists/rebounds/blocks
- Prompts appear at the right moment
- One-click selection

### **2. More Complete Stats**
- Assists no longer forgotten
- Rebounds tracked consistently
- Blocks recorded accurately

### **3. Better Play-by-Play**
- Linked events show together
- "John Doe made 2PT (Assist: Mike Smith)"
- "Sarah Johnson missed 3PT (Block: Tom Wilson)"

### **4. NBA-Level Analytics**
- Event sequences stored in database
- Can analyze assist rates, rebound rates, etc.
- Advanced stats like "assisted vs unassisted FG%"

---

## 🔧 CONFIGURATION

### **Enable/Disable Per Tournament**

```sql
-- Enable Phase 4 for a tournament
UPDATE tournaments
SET automation_settings = jsonb_set(
  automation_settings,
  '{sequences}',
  '{
    "enabled": true,
    "promptAssists": true,
    "promptRebounds": true,
    "promptBlocks": true,
    "linkEvents": true,
    "freeThrowSequence": true
  }'::jsonb
)
WHERE id = 'tournament-id';
```

### **Coach Games (Auto-Enabled)**

Coach games automatically have Phase 4 enabled via `COACH_AUTOMATION_FLAGS`:

```typescript
sequences: {
  enabled: true,
  promptAssists: true,
  promptRebounds: true,
  promptBlocks: true,
  linkEvents: true,
  freeThrowSequence: true
}
```

---

## 📊 TESTING CHECKLIST

### **Assist Prompt**
- [ ] Appears after made 2PT
- [ ] Appears after made 3PT
- [ ] Does NOT appear after free throw
- [ ] Shows correct shooter name
- [ ] Filters out shooter from assist list
- [ ] "No Assist" skips and closes
- [ ] "Record Assist" saves and closes
- [ ] Assist linked to shot in database

### **Rebound Prompt**
- [ ] Appears after missed 2PT
- [ ] Appears after missed 3PT
- [ ] Appears after missed FT
- [ ] Shows both teams
- [ ] Auto-detects offensive vs defensive
- [ ] "No Rebound" skips and closes
- [ ] "Record Rebound" saves and closes
- [ ] Rebound linked to miss in database

### **Block Prompt**
- [ ] Appears after missed 2PT
- [ ] Appears after missed 3PT
- [ ] Does NOT appear after missed FT
- [ ] Shows defensive players only
- [ ] Filters out shooter
- [ ] "No Block" skips and closes
- [ ] "Record Block" saves and closes
- [ ] Block linked to miss in database

---

**Document Version**: 1.0  
**Last Updated**: October 28, 2025  
**Maintained By**: StatJam Development Team

