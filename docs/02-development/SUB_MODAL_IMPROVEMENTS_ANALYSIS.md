# Substitution Modal Improvements - Analysis & Implementation Plan

## Current State

### SubstitutionModalV3.tsx
- **Current Props:**
  - `playerOutId`: Player being substituted out
  - `playerOutData`: Player data for display
  - `benchPlayers`: Array of bench players only
  - `onConfirm`: Callback with single `playerInId`

- **Current Behavior:**
  - Shows only bench players
  - Single selection (highlight one player)
  - No jersey number editing
  - One-to-one substitution (one out, one in)

## Requirements

### 1. Show All Player Rosters
**Current:** Only shows `benchPlayers`  
**Required:** Show all players in the game (on-court + bench)

**Analysis:**
- Need to receive both `onCourtPlayers` and `benchPlayers` as props
- Display in two sections: "On Court" and "Bench"
- Allow selecting players from either section
- Visual distinction between sections

**Complexity:** Low  
**Impact:** Medium - Improves UX by showing full roster context

### 2. Jersey Number Editing
**Current:** Jersey number is read-only in player card  
**Required:** Editable jersey number field in player card

**Analysis:**
- Need to add inline editing capability
- Similar to existing jersey number editing elsewhere (EditProfileModal pattern)
- Should save immediately on blur/enter
- Need to handle validation (0-999, allow leading zeros)
- Need to update player data in real-time

**Complexity:** Medium  
**Impact:** High - Enables quick jersey number corrections during game

**Reference Implementation:**
- Check `EditProfileModal.tsx` for jersey number editing pattern
- Use `type="text"` input (not `type="number"`) to allow "00", "001", etc.
- Parse to number on save, store as string during edit

### 3. Checklist System (Multiple Selections)
**Current:** Single selection with highlight  
**Required:** Multiple selections with checkboxes, "Select All" mechanism

**Analysis:**
- Change from single selection to multi-select
- Add checkboxes to each player card
- Track selected players in state (`Set<string>`)
- Add "Select All" / "Deselect All" button
- Update `onConfirm` to accept array of `playerInId[]`
- Handle multiple substitutions in sequence

**Complexity:** Medium-High  
**Impact:** High - Enables bulk substitutions (common in timeouts)

**Implementation Considerations:**
- State management: `const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())`
- Checkbox component: Use existing UI checkbox or create custom
- "Select All" logic: Filter by section (all bench, all on-court, or all)
- Substitution order: May need to process sequentially or in batch
- Validation: Ensure at least one player selected before confirming

**Substitution Logic:**
- Current: `onConfirm(playerInId: string)` → Single substitution
- New: `onConfirm(playerInIds: string[])` → Multiple substitutions
- Backend: May need to handle multiple substitutions in sequence
- UI: Show "Substituting X players..." loading state

## Implementation Plan

### Phase 1: Show All Rosters
1. Update `SubstitutionModalV3Props`:
   ```typescript
   interface SubstitutionModalV3Props {
     // ... existing props
     onCourtPlayers: Player[]; // Add this
     benchPlayers: Player[]; // Keep existing
   }
   ```

2. Update modal UI:
   - Add "On Court" section header
   - Display `onCourtPlayers` in first section
   - Display `benchPlayers` in second section
   - Visual distinction (different background colors/borders)

3. Update `page.tsx` to pass `onCourtPlayers`:
   - Pass `currentRosterA` or `currentRosterB` based on selected player's team

### Phase 2: Jersey Number Editing
1. Add state for editing:
   ```typescript
   const [editingJerseyId, setEditingJerseyId] = useState<string | null>(null);
   const [jerseyValue, setJerseyValue] = useState<string>('');
   ```

2. Add inline edit component:
   - Click jersey number → enter edit mode
   - Input field appears (type="text")
   - Save on blur or Enter key
   - Cancel on Escape key

3. Add save handler:
   - Call update service (need to check if custom player or regular)
   - Update local state optimistically
   - Show success/error feedback

4. Reference existing patterns:
   - Check `EditProfileModal.tsx` for jersey editing
   - Check `CustomPlayerForm.tsx` for jersey input handling

### Phase 3: Checklist System
1. Update state:
   ```typescript
   const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
   ```

2. Update player card:
   - Replace click-to-select with checkbox
   - Add checkbox component
   - Visual feedback for selected state

3. Add "Select All" controls:
   - "Select All Bench" button
   - "Select All On Court" button
   - "Select All" button (both sections)
   - "Deselect All" button

4. Update confirmation:
   - Change `onConfirm` signature to accept `string[]`
   - Process multiple substitutions
   - Show loading state during batch operations

5. Update parent component (`page.tsx`):
   - Handle array of player IDs
   - Process substitutions sequentially or in batch
   - Update rosters after each substitution

## Files to Modify

1. **`statjam/src/components/tracker-v3/SubstitutionModalV3.tsx`**
   - Add `onCourtPlayers` prop
   - Add jersey editing state and handlers
   - Add checklist state and UI
   - Add "Select All" buttons
   - Update player card to show checkbox and editable jersey

2. **`statjam/src/app/stat-tracker-v3/page.tsx`**
   - Pass `onCourtPlayers` to modal
   - Update `handleSubstitution` to handle array of player IDs
   - Process multiple substitutions

3. **`statjam/src/lib/services/coachPlayerService.ts`** (if needed)
   - Add method to update jersey number
   - Handle both regular and custom players

## Complexity Assessment

| Feature | Complexity | Risk | Priority |
|---------|-----------|------|----------|
| Show All Rosters | Low | Low | High |
| Jersey Editing | Medium | Medium | Medium |
| Checklist System | Medium-High | Medium | High |

## Dependencies

- Jersey editing requires player update service
- Multiple substitutions may require backend changes (check if supported)
- Need to verify substitution API supports batch operations

## Questions to Resolve

1. **Jersey Editing:**
   - Should jersey edits persist immediately or only on substitution?
   - Do we need to update database or just local state?

2. **Multiple Substitutions:**
   - Should substitutions happen sequentially or in parallel?
   - What happens if one substitution fails?
   - Should we show individual success/failure for each?

3. **Select All Logic:**
   - Should "Select All" include on-court players? (Usually only bench)
   - Should we prevent selecting all players (need at least 5 on court)?

## Next Steps

1. ✅ Implement #1 (Timeout button) - DONE
2. Review this analysis with user
3. Implement Phase 1 (Show All Rosters)
4. Implement Phase 2 (Jersey Editing)
5. Implement Phase 3 (Checklist System)

