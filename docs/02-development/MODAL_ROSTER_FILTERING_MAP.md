# Modal Roster Filtering - Implementation Map

## Overview
Update all auto-sequence modals to only show **on-court players** (first 5), matching the `BlockedShotSelectionModal` implementation.

## Current State Analysis

### ✅ Already Correct
- **BlockedShotSelectionModal**: Receives `currentRosterA`/`currentRosterB` (on-court only)
  - Line 1281: `return shooterTeamId === gameData.team_a_id ? currentRosterA : currentRosterB;`

### ❌ Need Updates (Showing ALL Players)
1. **AssistPromptModal** (Line 1081-1089)
   - Currently: `teamAPlayers` or `teamBPlayers` (ALL players)
   - Should: `currentRosterA` or `currentRosterB` (on-court only)

2. **ReboundPromptModal** (Line 1158-1162)
   - Currently: `teamAPlayers` and `teamBPlayers` (ALL players)
   - Should: `currentRosterA` and `currentRosterB` (on-court only)

3. **BlockPromptModal** (Line 1209-1217)
   - Currently: `teamAPlayers` or `teamBPlayers` (ALL players)
   - Should: `currentRosterA` or `currentRosterB` (on-court only)

4. **TurnoverPromptModal** (Line 1341-1349)
   - Currently: `teamAPlayers` or `teamBPlayers` (ALL players)
   - Should: `currentRosterA` or `currentRosterB` (on-court only)

5. **VictimPlayerSelectionModal** (Line 1391-1396)
   - Currently: `teamAPlayers` or `teamBPlayers` (ALL players)
   - Should: `currentRosterA` or `currentRosterB` (on-court only)

## Implementation Plan

### Step 1: Update Modal Components
- Add "(On Court)" label to player lists (like BlockedShotSelectionModal line 151)
- No prop changes needed (modals already accept `Player[]`)

### Step 2: Update page.tsx Modal Calls
- Replace `teamAPlayers` → `currentRosterA`
- Replace `teamBPlayers` → `currentRosterB`
- Ensure logic correctly determines which roster to use

### Step 3: Update Modal Labels
- Add "(On Court)" text to team headers
- Match BlockedShotSelectionModal styling

## Files to Modify

1. `statjam/src/app/stat-tracker-v3/page.tsx`
   - Lines 1081-1089 (AssistPromptModal)
   - Lines 1158-1162 (ReboundPromptModal)
   - Lines 1209-1217 (BlockPromptModal)
   - Lines 1341-1349 (TurnoverPromptModal)
   - Lines 1391-1396 (VictimPlayerSelectionModal)

2. `statjam/src/components/tracker-v3/modals/AssistPromptModal.tsx`
   - Add "(On Court)" label

3. `statjam/src/components/tracker-v3/modals/ReboundPromptModal.tsx`
   - Add "(On Court)" labels for both teams

4. `statjam/src/components/tracker-v3/modals/BlockPromptModal.tsx`
   - Add "(On Court)" label

5. `statjam/src/components/tracker-v3/modals/TurnoverPromptModal.tsx`
   - Add "(On Court)" label

6. `statjam/src/components/tracker-v3/modals/VictimPlayerSelectionModal.tsx`
   - Add "(On Court)" label

## Reference Implementation
See `BlockedShotSelectionModal.tsx` line 151:
```typescript
<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
  {shooterTeamName} (On Court)
</h3>
```

