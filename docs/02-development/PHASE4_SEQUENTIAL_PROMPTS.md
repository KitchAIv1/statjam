# Phase 4: Sequential Prompts Implementation

## 🎯 **Feature: Block → Rebound Sequential Prompts**

### **Overview**
Implements NBA-accurate sequential prompts for missed shots:
1. **Block prompt** appears first (optional)
2. **Rebound prompt** appears second (required)

This matches real basketball flow where blocks and rebounds are separate events that can both occur on the same missed shot.

---

## 📋 **Implementation Details**

### **1. PlayEngine Updates**

#### **New Interface: `promptQueue`**
```typescript
export interface PlayEngineResult {
  // ... existing fields ...
  promptQueue?: Array<{
    type: 'assist' | 'rebound' | 'block' | 'turnover';
    sequenceId: string;
    metadata: Record<string, any>;
  }>;
}
```

#### **Sequential Prompt Logic**
```typescript
// ✅ NBA SEQUENCE: Block → Rebound (sequential prompts for missed shots)
const isMissedShot = this.shouldPromptRebound(event) || this.shouldPromptBlock(event);

if (isMissedShot) {
  const sequenceId = uuidv4();
  const promptQueue = [];
  
  // Step 1: Block prompt (optional, appears first)
  if (flags.promptBlocks && this.shouldPromptBlock(event)) {
    promptQueue.push({ type: 'block', sequenceId, metadata: {...} });
  }
  
  // Step 2: Rebound prompt (required, appears second)
  if (flags.promptRebounds && this.shouldPromptRebound(event)) {
    promptQueue.push({ type: 'rebound', sequenceId, metadata: {...} });
  }
  
  // Return queue
  result.promptQueue = promptQueue;
  result.promptType = promptQueue[0].type; // First in queue
}
```

**Key Changes:**
- ✅ Removed `else if` between rebound and block checks
- ✅ Both prompts can now be queued for the same event
- ✅ Block always appears first (if enabled)
- ✅ Rebound always appears second (if enabled)
- ✅ Shared `sequenceId` links both events

---

### **2. useTracker Updates**

#### **New State: `promptQueue`**
```typescript
const [promptQueue, setPromptQueue] = useState<Array<{
  type: 'assist' | 'rebound' | 'block' | 'turnover';
  sequenceId: string;
  metadata: Record<string, any>;
}>>([]);
```

#### **Queue Processing in `recordStat`**
```typescript
// Check if we have a queue (multiple prompts)
if (playResult.promptQueue && playResult.promptQueue.length > 0) {
  console.log('📋 Sequential prompts detected:', playResult.promptQueue.map(p => p.type).join(' → '));
  
  // Store the full queue
  setPromptQueue(playResult.promptQueue);
  
  // Show first prompt in queue
  const firstPrompt = playResult.promptQueue[0];
  setPlayPrompt({
    isOpen: true,
    type: firstPrompt.type,
    sequenceId: firstPrompt.sequenceId,
    primaryEventId: null,
    metadata: firstPrompt.metadata
  });
}
```

#### **Auto-Advance in `clearPlayPrompt`**
```typescript
const clearPlayPrompt = useCallback(() => {
  // Check if there are more prompts in the queue
  if (promptQueue.length > 1) {
    // Remove first prompt and show next
    const nextQueue = promptQueue.slice(1);
    const nextPrompt = nextQueue[0];
    
    console.log('➡️ Advancing to next prompt in queue:', nextPrompt.type);
    
    setPromptQueue(nextQueue);
    setPlayPrompt({
      isOpen: true,
      type: nextPrompt.type,
      sequenceId: nextPrompt.sequenceId,
      primaryEventId: null,
      metadata: nextPrompt.metadata
    });
  } else {
    // No more prompts, clear everything
    setPromptQueue([]);
    setPlayPrompt({ isOpen: false, ... });
  }
}, [promptQueue]);
```

**Key Changes:**
- ✅ Queue stored in state
- ✅ First prompt shown immediately
- ✅ `clearPlayPrompt` auto-advances to next prompt
- ✅ Closing/skipping block → shows rebound
- ✅ Closing/skipping rebound → closes all

---

## 🎮 **User Experience Flow**

### **Scenario: Missed 3-Pointer**

#### **Step 1: User Records Missed Shot**
```
User clicks: "3PT - MISSED" for Player A
```

#### **Step 2: PlayEngine Analysis**
```
🔍 Analyzing event: missed 3_pointer
📋 Sequential prompts detected: block → rebound
```

#### **Step 3: Block Modal Appears**
```
┌─────────────────────────────────┐
│  Was this shot blocked?         │
│                                  │
│  [Player 1] [Player 2] [Player 3]│
│                                  │
│  [Skip]                          │
└─────────────────────────────────┘
```

**User Options:**
- **Select Player** → Records block → Shows rebound modal
- **Skip** → No block recorded → Shows rebound modal

#### **Step 4: Rebound Modal Appears**
```
┌─────────────────────────────────┐
│  Who got the rebound?            │
│                                  │
│  OFFENSIVE (Team A):             │
│  [Player 1] [Player 2] [Player 3]│
│                                  │
│  DEFENSIVE (Team B):             │
│  [Player 4] [Player 5] [Player 6]│
│                                  │
│  [Skip]                          │
└─────────────────────────────────┘
```

**User Options:**
- **Select Player** → Records rebound → Closes all modals
- **Skip** → No rebound recorded → Closes all modals

---

## 🔗 **Event Linking**

All events in the sequence share the same `sequenceId`:

```typescript
// Example sequence
{
  sequenceId: "550e8400-e29b-41d4-a716-446655440000",
  events: [
    { id: "event-1", type: "3_pointer", modifier: "missed", playerId: "A1" },
    { id: "event-2", type: "block", playerId: "B1", linkedEventId: "event-1" },
    { id: "event-3", type: "rebound", modifier: "defensive", playerId: "B1", linkedEventId: "event-1" }
  ]
}
```

**Benefits:**
- ✅ Analytics can query full play sequences
- ✅ Undo/redo can revert entire sequence
- ✅ Play-by-play can show connected events
- ✅ Stats validation (e.g., block + defensive rebound = common)

---

## 🧪 **Testing Checklist**

### **Test Case 1: Block + Rebound**
- [ ] Record missed shot
- [ ] Block modal appears first
- [ ] Select blocker
- [ ] Rebound modal appears second
- [ ] Select rebounder
- [ ] Both stats recorded in database
- [ ] Both events share same `sequenceId`

### **Test Case 2: Skip Block + Rebound**
- [ ] Record missed shot
- [ ] Block modal appears first
- [ ] Click "Skip"
- [ ] Rebound modal appears second
- [ ] Select rebounder
- [ ] Only rebound recorded
- [ ] Rebound has correct `sequenceId`

### **Test Case 3: Block + Skip Rebound**
- [ ] Record missed shot
- [ ] Block modal appears first
- [ ] Select blocker
- [ ] Rebound modal appears second
- [ ] Click "Skip"
- [ ] Only block recorded
- [ ] Block has correct `sequenceId`

### **Test Case 4: Skip Both**
- [ ] Record missed shot
- [ ] Block modal appears first
- [ ] Click "Skip"
- [ ] Rebound modal appears second
- [ ] Click "Skip"
- [ ] Only missed shot recorded
- [ ] No prompts remain open

### **Test Case 5: Coach Mode**
- [ ] Record opponent missed shot
- [ ] No prompts appear (opponent has no players)
- [ ] Record home team missed shot
- [ ] Prompts appear normally

### **Test Case 6: Stat Admin Mode**
- [ ] Ensure Phase 4 enabled via SQL
- [ ] Record missed shot
- [ ] Prompts appear sequentially
- [ ] Both teams' players available in rebound modal

---

## 📊 **Database Schema**

No schema changes required! Uses existing fields:

```sql
-- game_stats table (existing)
CREATE TABLE game_stats (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID,
  team_id UUID NOT NULL,
  stat_type TEXT NOT NULL,
  modifier TEXT,
  sequence_id UUID,           -- ✅ Links events in same play
  linked_event_id UUID,       -- ✅ Points to primary event
  event_metadata JSONB,       -- ✅ Additional context
  quarter INTEGER,
  game_time_minutes INTEGER,
  game_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 **Deployment Steps**

### **1. Verify Phase 4 Enabled**
```sql
-- Check automation settings
SELECT 
  id, 
  name, 
  automation_settings->'sequences' as sequences
FROM tournaments
WHERE id = 'YOUR_TOURNAMENT_ID';
```

**Expected:**
```json
{
  "enabled": true,
  "promptAssists": true,
  "promptRebounds": true,
  "promptBlocks": true,
  "linkEvents": true
}
```

### **2. Enable Phase 4 (if needed)**
```bash
# Run SQL script
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f docs/02-development/ENABLE_PHASE4_STAT_ADMIN.sql
```

### **3. Test in Staging**
- Create test game
- Record missed shots
- Verify sequential prompts
- Check database records

### **4. Deploy to Production**
- Merge feature branch
- Deploy frontend
- Monitor logs for errors
- Verify with live game

---

## 🎯 **Success Criteria**

✅ **Functionality:**
- Block modal appears before rebound modal
- Skipping block shows rebound modal
- Skipping rebound closes all modals
- Both stats recorded with correct `sequenceId`

✅ **Performance:**
- No UI lag between modals
- Database writes complete successfully
- No memory leaks from queue state

✅ **UX:**
- Clear visual feedback
- Intuitive flow
- No confusion about sequence

✅ **Compatibility:**
- Works in Stat Admin mode
- Works in Coach mode
- Works with existing features (possession, clock, etc.)

---

## 📝 **Notes**

### **Why Block First?**
- Blocks are less common than rebounds
- Blocks require immediate decision (happened or not?)
- Rebounds can be determined after block decision
- Matches natural thought process: "Was it blocked? If yes, who? Now who got the rebound?"

### **Why Not Parallel Prompts?**
- Avoids UI clutter (two modals at once)
- Forces deliberate decision-making
- Matches mental model of sequential events
- Easier to implement and test

### **Future Enhancements**
- [ ] Add "Block + Rebound Same Player" shortcut
- [ ] Add "Team Rebound" option
- [ ] Add undo for entire sequence
- [ ] Add play-by-play visualization of sequences

---

## 🐛 **Known Issues**

None at this time.

---

## 📚 **Related Documentation**

- `PHASE4_UI_FLOW.md` - Complete UI flow for all Phase 4 prompts
- `PHASE4_TRACKER_COMPATIBILITY.md` - Stat Admin vs Coach mode differences
- `ENABLE_PHASE4_STAT_ADMIN.sql` - SQL script to enable Phase 4

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Implemented, Ready for Testing

