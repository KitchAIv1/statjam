# Phase 5: Complete Foul Flow Implementation

**Status**: ✅ **COMPLETE**  
**Date**: 2025-10-29  
**Branch**: `feature/phase4-play-sequences`

---

## 📋 Overview

This document details the complete implementation of the foul flow system, which provides a user-friendly multi-step process for recording fouls with proper type selection, victim identification, and automatic free throw sequence triggering.

---

## 🎯 Implementation Goals

1. **Foul Type Selection**: User selects the specific type of foul committed
2. **Victim Selection**: For shooting fouls, user selects which player was fouled
3. **Automatic FT Triggering**: System automatically triggers free throw modal with correct shooter
4. **Offensive Foul Handling**: Automatically record turnover for offensive fouls
5. **Database Accuracy**: Ensure fouls are recorded with correct modifiers and linked to victims

---

## 🏗️ Architecture

### **Flow Diagram**

```
User clicks FOUL button (player pre-selected)
         ↓
┌────────────────────────────────────┐
│  FoulTypeSelectionModal            │
│  - Personal                        │
│  - Shooting (2PT)                  │
│  - Shooting (3PT)                  │
│  - 1-and-1 / Bonus                 │
│  - Technical                       │
│  - Flagrant                        │
│  - Offensive                       │
└────────────────────────────────────┘
         ↓
    User selects type
         ↓
   ┌─────────────────┐
   │ Needs victim?   │
   └─────────────────┘
      /           \
    YES            NO
     ↓              ↓
┌─────────────────────┐   Record foul immediately
│ VictimPlayerSelection│   (Personal, Offensive)
│ - Show opposing team │
│ - Select victim      │
└─────────────────────┘
     ↓
Record foul with victim
     ↓
Trigger FreeThrowSequenceModal
     ↓
Record free throws
```

---

## 📁 Files Created/Modified

### **New Components**

1. **`src/components/tracker-v3/modals/FoulTypeSelectionModal.tsx`**
   - Modal for selecting foul type
   - 7 foul type options with descriptions
   - Color-coded buttons for visual clarity
   - Displays fouler name

2. **`src/components/tracker-v3/modals/VictimPlayerSelectionModal.tsx`**
   - Modal for selecting victim player
   - Shows opposing team players only
   - Displays team name and foul type context
   - Scrollable player list

### **Modified Files**

3. **`src/app/stat-tracker-v3/page.tsx`**
   - Added foul flow state management
   - Implemented `handleFoulRecord` (entry point)
   - Implemented `handleFoulTypeSelection` (type selection handler)
   - Implemented `recordFoulWithoutVictim` (personal/offensive fouls)
   - Implemented `handleVictimSelection` (shooting foul handler)
   - Integrated both new modals
   - Added `is_custom_player` to Player interface

4. **`src/hooks/useTracker.ts`**
   - Exposed `setPlayPrompt` method
   - Added to `UseTrackerReturn` interface
   - Fixed possession tracking bug (`'3_pointer'` → `'free_throw'`)

---

## 🔧 Implementation Details

### **1. Foul Type Selection Modal**

**File**: `src/components/tracker-v3/modals/FoulTypeSelectionModal.tsx`

**Features**:
- 7 distinct foul types with clear descriptions
- Color-coded buttons (gray, blue, purple, indigo, orange, red, yellow)
- Shows fouler name for context
- Responsive design with proper z-index

**Foul Types**:
```typescript
export type FoulType = 
  | 'personal'        // No FTs
  | 'shooting_2pt'    // 2 FTs
  | 'shooting_3pt'    // 3 FTs
  | 'bonus'           // 1-and-1
  | 'technical'       // 1 FT + possession
  | 'flagrant'        // 2 FTs + possession
  | 'offensive';      // Turnover, no FTs
```

---

### **2. Victim Player Selection Modal**

**File**: `src/components/tracker-v3/modals/VictimPlayerSelectionModal.tsx`

**Features**:
- Dynamically shows opposing team players
- Displays foul type context
- Scrollable list for many players
- Player avatars with names
- Cancel option

**Logic**:
- Determines opposing team based on fouler's team
- Filters players automatically
- Passes victim ID and name to handler

---

### **3. Page Integration**

**File**: `src/app/stat-tracker-v3/page.tsx`

#### **State Management**

```typescript
// Foul Flow State
const [showFoulTypeModal, setShowFoulTypeModal] = useState(false);
const [showVictimSelectionModal, setShowVictimSelectionModal] = useState(false);
const [selectedFoulType, setSelectedFoulType] = useState<string | null>(null);
const [foulerPlayerId, setFoulerPlayerId] = useState<string | null>(null);
const [foulerPlayerName, setFoulerPlayerName] = useState<string>('');
```

#### **Handler: `handleFoulRecord`**

**Purpose**: Entry point when user clicks FOUL button

**Logic**:
1. Get fouler player name from roster
2. Store fouler ID and name in state
3. Open `FoulTypeSelectionModal`

#### **Handler: `handleFoulTypeSelection`**

**Purpose**: Process foul type selection

**Logic**:
1. Close foul type modal
2. Store selected foul type
3. Determine if victim selection is needed:
   - **Needs victim**: shooting_2pt, shooting_3pt, bonus, technical, flagrant
   - **No victim**: personal, offensive
4. Route to appropriate handler

#### **Handler: `recordFoulWithoutVictim`**

**Purpose**: Record fouls that don't need victim selection

**Logic**:
1. Determine player type (regular, custom, opponent)
2. Map foul type to database modifier
3. Record foul stat
4. **If offensive foul**: Also record turnover with `offensive_foul` modifier
5. Reset state

#### **Handler: `handleVictimSelection`**

**Purpose**: Record shooting fouls with victim

**Logic**:
1. Close victim selection modal
2. Determine fouler details (player type, team)
3. Determine victim team (opposite of fouler)
4. Map foul type to:
   - Database modifier (`'shooting'`, `'1-and-1'`, `'technical'`, `'flagrant'`)
   - FT count (1, 2, or 3)
   - FT type for modal
5. Record foul stat with metadata
6. **Trigger `FreeThrowSequenceModal`** via `tracker.setPlayPrompt()`:
   ```typescript
   tracker.setPlayPrompt({
     isOpen: true,
     type: 'free_throw',
     sequenceId: null,
     primaryEventId: null,
     metadata: {
       shooterId: victimId,
       shooterName: victimName,
       shooterTeamId: victimTeamId,
       foulType: ftType,
       totalShots: ftCount,
       foulerId: foulerPlayerId
     }
   });
   ```
7. Reset state

---

### **4. useTracker Updates**

**File**: `src/hooks/useTracker.ts`

#### **Exposed `setPlayPrompt`**

Added to return statement:
```typescript
return {
  // ... existing properties
  playPrompt,
  clearPlayPrompt,
  setPlayPrompt // ✅ NEW: Manually set play prompt (for foul flow)
};
```

Added to interface:
```typescript
interface UseTrackerReturn {
  // ... existing properties
  setPlayPrompt: (prompt: {
    isOpen: boolean;
    type: 'assist' | 'rebound' | 'block' | 'turnover' | 'free_throw' | null;
    sequenceId: string | null;
    primaryEventId: string | null;
    metadata: Record<string, any> | null;
  }) => void;
}
```

#### **Bug Fix: Possession Tracking**

**Issue**: Line 893 had incorrect stat type check
```typescript
// ❌ BEFORE
if ((stat.statType === 'field_goal' || stat.statType === 'three_pointer' || stat.statType === '3_pointer') && stat.modifier === 'made') {

// ✅ AFTER
if ((stat.statType === 'field_goal' || stat.statType === 'three_pointer' || stat.statType === 'free_throw') && stat.modifier === 'made') {
```

---

## 🎨 UX Flow

### **Step 1: User Clicks FOUL**
- Player is already selected (pre-requisite)
- `FoulTypeSelectionModal` appears
- Shows fouler name at top

### **Step 2: User Selects Foul Type**

#### **Option A: Personal or Offensive Foul**
- Foul recorded immediately
- If offensive: Turnover also recorded
- Flow complete

#### **Option B: Shooting/Technical/Flagrant Foul**
- `VictimPlayerSelectionModal` appears
- Shows opposing team players
- Shows foul type context

### **Step 3: User Selects Victim**
- Foul recorded with correct modifier
- `FreeThrowSequenceModal` appears automatically
- Shows victim name as shooter
- Shows correct number of shots

### **Step 4: User Records Free Throws**
- Existing Phase 5 FT modal handles this
- Records each FT with correct attribution
- Links FTs to foul via sequence_id

---

## 🔍 Edge Cases Handled

### **1. Coach Mode - Opponent Fouls**
- Fouler can be `'opponent-team'`
- Uses coach's user ID as proxy
- Sets `isOpponentStat: true` flag
- Victim selection still works (shows home team players)

### **2. Custom Players**
- Supports custom players as foulers
- Supports custom players as victims
- Correctly uses `custom_player_id` field

### **3. Offensive Fouls**
- Automatically records turnover
- Uses `'offensive_foul'` modifier for turnover
- No victim selection needed
- No free throws triggered

### **4. Technical/Flagrant Fouls**
- Records 1 FT (technical) or 2 FTs (flagrant)
- Possession should be retained (not implemented yet)
- Victim selection required

---

## 📊 Database Schema

### **Foul Modifiers**

```sql
-- game_stats.modifier for statType = 'foul'
'personal'      -- Regular foul, no FTs
'shooting'      -- Shooting foul (2PT or 3PT)
'1-and-1'       -- Bonus situation
'technical'     -- Technical foul
'flagrant'      -- Flagrant foul
'offensive'     -- Offensive foul
```

### **Linked Events**

```sql
-- Foul → Free Throws linkage
game_stats.sequence_id  -- Links foul to FTs

-- Example:
-- Foul:  { stat_type: 'foul', modifier: 'shooting', sequence_id: 'abc-123' }
-- FT 1:  { stat_type: 'free_throw', modifier: 'made', sequence_id: 'abc-123' }
-- FT 2:  { stat_type: 'free_throw', modifier: 'missed', sequence_id: 'abc-123' }
```

---

## 🧪 Testing Checklist

### **Stat Admin Mode**

- [ ] Personal foul (no victim, no FTs)
- [ ] Shooting foul 2PT (victim selection, 2 FTs)
- [ ] Shooting foul 3PT (victim selection, 3 FTs)
- [ ] 1-and-1 bonus (victim selection, up to 2 FTs)
- [ ] Technical foul (victim selection, 1 FT)
- [ ] Flagrant foul (victim selection, 2 FTs)
- [ ] Offensive foul (no victim, turnover recorded, no FTs)
- [ ] Custom player as fouler
- [ ] Custom player as victim
- [ ] Verify foul modifiers in database
- [ ] Verify FTs linked to foul via sequence_id

### **Coach Mode**

- [ ] Home player fouls opponent (victim selection shows "Opponent Team")
- [ ] Opponent fouls home player (victim selection shows home players)
- [ ] Personal foul by opponent
- [ ] Shooting foul by opponent
- [ ] Offensive foul by opponent (turnover recorded)
- [ ] Custom player as fouler
- [ ] Custom player as victim

### **UI/UX**

- [ ] Foul type modal displays correctly
- [ ] Victim selection modal displays correctly
- [ ] FT modal appears after victim selection
- [ ] Correct player names displayed
- [ ] Correct team names displayed
- [ ] Cancel buttons work
- [ ] Modal z-index layering correct
- [ ] Responsive on mobile

---

## 🐛 Known Issues

### **1. Possession Retention**
**Issue**: Technical and flagrant fouls should retain possession, but this is not yet implemented.

**Solution**: Will be handled in Phase 6 (Advanced Possession Rules)

### **2. Team Foul Count**
**Issue**: Bonus/penalty situation not automatically detected yet.

**Solution**: Will be implemented when team foul tracking is enhanced.

---

## 📈 Future Enhancements

### **Phase 6 Candidates**

1. **Auto-detect bonus situation**
   - Track team fouls per quarter
   - Automatically show "1-and-1" or "Bonus" when threshold reached

2. **Possession retention for technical/flagrant**
   - Update possession engine
   - Show possession indicator after FTs

3. **Foul-out detection**
   - Track player fouls
   - Alert when player reaches 5/6 fouls
   - Suggest substitution

4. **Double foul handling**
   - Allow recording fouls on both teams simultaneously
   - Jump ball for possession

5. **Intentional foul indicator**
   - Add "Intentional" flag to shooting fouls
   - Affects FT count in some rulesets

---

## 🔗 Related Documentation

- **Phase 5 Free Throw Sequences**: `PHASE5_FREE_THROW_SEQUENCES.md`
- **Phase 4 Play Sequences**: `PHASE4_SEQUENTIAL_PROMPTS.md`
- **PlayEngine**: `src/lib/engines/playEngine.ts`
- **useTracker Hook**: `src/hooks/useTracker.ts`

---

## ✅ Completion Checklist

- [x] FoulTypeSelectionModal created
- [x] VictimPlayerSelectionModal created
- [x] Page integration complete
- [x] useTracker updated with setPlayPrompt
- [x] Offensive foul → turnover logic
- [x] Shooting foul → FT modal trigger
- [x] Coach mode support
- [x] Custom player support
- [x] All linting errors resolved
- [x] Documentation complete
- [ ] Testing in Stat Admin mode
- [ ] Testing in Coach mode

---

## 📝 Summary

The complete foul flow implementation provides a **professional, user-friendly, and accurate** system for recording fouls in basketball games. The multi-step modal approach ensures:

1. **Clarity**: Users explicitly select foul type
2. **Accuracy**: Victims are properly identified
3. **Automation**: Free throws triggered automatically
4. **Flexibility**: Supports all foul types and edge cases
5. **Consistency**: Follows existing Phase 4/5 patterns

The system is **ready for testing** and integrates seamlessly with the existing stat tracking engine.

---

**Next Steps**: Test the complete flow in both Stat Admin and Coach modes, then proceed to Phase 6 (Advanced Possession & Foul Rules).

