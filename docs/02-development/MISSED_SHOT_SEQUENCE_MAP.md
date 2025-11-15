# Missed Shot Auto Sequence - Current Flow & Block Removal Assessment

## 📋 **Current Missed Shot Auto Sequence**

### **Flow Diagram:**

```
1. User Records Missed Shot (2PT or 3PT)
   ↓
2. PlayEngine.analyzeEvent() detects missed shot
   ↓
3. Creates prompt queue: [block, rebound] (if blocks enabled)
   ↓
4. Block Prompt Modal Appears (OPTIONAL - can skip)
   ├─→ User selects blocker → Records block → clearPlayPrompt() → Advances queue
   └─→ User clicks "No Block" → clearPlayPrompt() → Advances queue
   ↓
5. Rebound Prompt Modal Appears (REQUIRED)
   ├─→ User selects rebounder → Records rebound → clearPlayPrompt() → Sequence complete
   └─→ Sequence complete
```

### **Code Flow:**

#### **1. Missed Shot Recorded** (`useTracker.ts` line 856)
```typescript
await tracker.recordStat({
  statType: 'field_goal' or 'three_pointer',
  modifier: 'missed'
});
```

#### **2. PlayEngine Analysis** (`playEngine.ts` lines 140-188)
```typescript
// Detects missed shot
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

#### **3. Queue Processing** (`useTracker.ts` lines 1142-1154)
```typescript
if (playResult.promptQueue && playResult.promptQueue.length > 0) {
  setPromptQueue(playResult.promptQueue);
  const firstPrompt = playResult.promptQueue[0];
  setPlayPrompt({
    isOpen: true,
    type: firstPrompt.type, // 'block' if enabled
    sequenceId: firstPrompt.sequenceId,
    metadata: firstPrompt.metadata
  });
}
```

#### **4. Block Modal** (`page.tsx` lines 1148-1200)
- User selects blocker OR clicks "No Block"
- Both paths call `tracker.clearPlayPrompt()`

#### **5. Queue Advancement** (`useTracker.ts` lines 1418-1447)
```typescript
const clearPlayPrompt = useCallback(() => {
  if (promptQueue.length > 1) {
    // Remove first prompt (block) and show next (rebound)
    const nextQueue = promptQueue.slice(1);
    const nextPrompt = nextQueue[0];
    setPromptQueue(nextQueue);
    setPlayPrompt({
      isOpen: true,
      type: nextPrompt.type, // 'rebound'
      ...
    });
  } else {
    // No more prompts, clear everything
    setPromptQueue([]);
    setPlayPrompt({ isOpen: false, ... });
  }
}, [promptQueue]);
```

#### **6. Rebound Modal** (`page.tsx` lines 1076-1145)
- User selects rebounder
- Records rebound
- `clearPlayPrompt()` → Queue empty → Sequence complete

---

## 🎯 **Proposed Change: Remove Block Prompt from Sequence**

### **New Flow:**

```
1. User Records Missed Shot (2PT or 3PT)
   ↓
2. PlayEngine.analyzeEvent() detects missed shot
   ↓
3. Creates prompt queue: [rebound] (block removed)
   ↓
4. Rebound Prompt Modal Appears (REQUIRED)
   ├─→ User selects rebounder → Records rebound → clearPlayPrompt() → Sequence complete
   └─→ Sequence complete
```

### **Impact:**

✅ **Block can still be recorded manually** via stat buttons  
✅ **Rebound prompt still works** (critical path preserved)  
✅ **Simpler UX** - one less modal to interact with  
✅ **Faster stat entry** - direct to rebound

---

## 🔍 **Complexity Assessment**

### **Complexity: LOW-MEDIUM** ⚡

**Why LOW:**
- Block prompt is already optional (can be skipped)
- Removing it from queue is straightforward
- No breaking changes to existing functionality
- Block remains available as manual stat entry

**Why MEDIUM:**
- Need to ensure queue logic handles single-item queues correctly
- Need to verify rebound prompt still receives correct metadata
- Need to test edge cases (blocks disabled vs. removed from sequence)

---

## ✅ **Safety Assessment**

### **Safety: SAFE** ✅

**Reasons:**
1. **Block is optional** - Already skippable, so removing from sequence doesn't break anything
2. **Manual recording preserved** - Users can still record blocks via stat buttons
3. **Critical path intact** - Rebound prompt (required) still works
4. **No data loss** - Existing blocks in database unaffected
5. **Backward compatible** - Old games with blocks still display correctly

**Potential Risks:**
- ⚠️ **Low risk:** If `promptQueue` has only 1 item (rebound), `clearPlayPrompt()` logic already handles it correctly
- ⚠️ **Low risk:** Need to ensure `shouldPromptBlock()` check doesn't interfere with rebound detection

---

## 🛠️ **Implementation Plan**

### **Files to Modify:**

1. **`src/lib/engines/playEngine.ts`** (lines 151-164)
   - Remove block prompt from queue creation
   - Keep `shouldPromptBlock()` method (for manual block detection if needed)

2. **`src/app/stat-tracker-v3/page.tsx`** (lines 1148-1200)
   - Block modal code can remain (for manual block recording)
   - No changes needed if block removed from auto-sequence

3. **`src/hooks/useTracker.ts`** (lines 1142-1154, 1418-1447)
   - Queue logic already handles single-item queues correctly
   - No changes needed

### **Testing Checklist:**

- [ ] Missed 2PT → Rebound prompt appears (no block prompt)
- [ ] Missed 3PT → Rebound prompt appears (no block prompt)
- [ ] Rebound prompt has correct shooter metadata
- [ ] Rebound recording works correctly
- [ ] Manual block recording still works via stat buttons
- [ ] Queue advancement logic handles single-item queue
- [ ] No console errors or UI glitches

---

## 📊 **Code Changes Required**

### **Change 1: Remove Block from Queue** (`playEngine.ts`)

**Current:**
```typescript
// Step 1: Block prompt (optional, appears first)
if (flags.promptBlocks && this.shouldPromptBlock(event)) {
  promptQueue.push({
    type: 'block',
    sequenceId: sequenceId,
    metadata: {...}
  });
}

// Step 2: Rebound prompt (required, appears second)
if (flags.promptRebounds && this.shouldPromptRebound(event)) {
  promptQueue.push({
    type: 'rebound',
    sequenceId: sequenceId,
    metadata: {...}
  });
}
```

**Proposed:**
```typescript
// ✅ REMOVED: Block prompt from auto-sequence
// Blocks can still be recorded manually via stat buttons

// Rebound prompt (required, appears immediately)
if (flags.promptRebounds && this.shouldPromptRebound(event)) {
  promptQueue.push({
    type: 'rebound',
    sequenceId: sequenceId,
    metadata: {
      shotType: event.statType,
      shooterId: this.getPlayerIdentifier(event),
      shooterTeamId: event.teamId
    }
  });
}
```

**Lines to modify:** `playEngine.ts` lines 151-164 (remove block queue push)

---

## ✅ **Recommendation**

**PROCEED WITH IMPLEMENTATION** ✅

**Rationale:**
- Low complexity, safe change
- Improves UX (faster stat entry)
- Preserves manual block recording capability
- No breaking changes
- Queue logic already handles single-item queues

**Estimated Effort:** 15-30 minutes
- Remove block from queue (5 min)
- Testing (10-20 min)
- Documentation update (5 min)

