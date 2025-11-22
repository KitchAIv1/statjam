# Block Modal Reuse Assessment

**Date**: November 21, 2025  
**Purpose**: Assess if `ReboundPromptModal` can be efficiently reused for `BlockPromptModal` in the auto-sequence

---

## Current State Analysis

### BlockPromptModal
- **Purpose**: Select defensive player who blocked a shot
- **Props**: 
  - `defensivePlayers: Player[]` (single team, defensive players only)
  - `shooterName: string`
  - `shotType: string`
  - `onSelectPlayer: (playerId: string) => void` (no type parameter)
  - `onSkip: () => void`
- **UI**: Single column, max-w-md, red/pink theme
- **Logic**: Simple player selection, no type determination
- **Lines**: ~172 lines

### ReboundPromptModal
- **Purpose**: Select player who got rebound, determine offensive/defensive type
- **Props**:
  - `teamAPlayers: Player[]` (both teams)
  - `teamBPlayers: Player[]` (both teams)
  - `teamAId: string`
  - `teamBId: string`
  - `shooterTeamId: string`
  - `shooterName: string`
  - `shotType: string`
  - `onSelectPlayer: (playerId: string, reboundType: 'offensive' | 'defensive') => void` (requires type)
  - `onSkip: () => void`
- **UI**: Two columns (grid), max-w-2xl, orange/red theme
- **Logic**: Complex team ID comparison to determine rebound type
- **Lines**: ~296 lines

---

## Key Differences

| Aspect | BlockPromptModal | ReboundPromptModal |
|--------|------------------|-------------------|
| **Player Source** | Single team (defensive only) | Both teams |
| **Selection Logic** | Simple selection | Type determination (offensive/defensive) |
| **Callback Signature** | `(playerId: string) => void` | `(playerId: string, reboundType: 'offensive' | 'defensive') => void` |
| **UI Layout** | Single column | Two columns (grid) |
| **Modal Size** | max-w-md | max-w-2xl |
| **Color Theme** | Red/pink | Orange/red |
| **Header Icon** | Shield | TrendingUp |
| **Skip Button Text** | "No Block" | "No Rebound" |

---

## Reuse Feasibility Assessment

### Option 1: Make ReboundPromptModal Flexible (Conditional Rendering)

**Approach**: Add a `mode` prop to `ReboundPromptModal` to handle both cases

**Pros**:
- Single component to maintain
- Shared UI structure
- Consistent styling patterns

**Cons**:
- **HIGH COMPLEXITY**: Requires conditional logic throughout
- **PROP BLOAT**: Would need to accept both single-team and dual-team props
- **LOGIC COMPLEXITY**: Would need to conditionally show/hide rebound type logic
- **CALLBACK COMPLEXITY**: Would need to handle different callback signatures
- **MAINTAINABILITY RISK**: More complex component = harder to maintain
- **VIOLATES SINGLE RESPONSIBILITY**: One component doing two different things

**Code Impact**:
```typescript
// Would need to handle both cases:
interface ReboundPromptModalProps {
  mode?: 'rebound' | 'block'; // NEW
  // ... all rebound props
  defensivePlayers?: Player[]; // NEW (for block mode)
  // ... conditional logic everywhere
}
```

**Complexity Rating**: **HIGH** (8/10)
**Maintainability Rating**: **LOW** (3/10)

---

### Option 2: Create Shared Base Component

**Approach**: Extract common UI structure into a base component, create specific modals that use it

**Pros**:
- Shared UI structure (header, footer, player list)
- Clear separation of concerns
- Each modal maintains single responsibility
- Easier to maintain and test

**Cons**:
- **MEDIUM EFFORT**: Requires refactoring both modals
- **MORE FILES**: Additional base component file
- **PROP DRILLING**: May need to pass many props to base component

**Code Impact**:
```typescript
// New base component:
<PlayerSelectionModalBase
  title="Block?"
  icon={<Shield />}
  players={defensivePlayers}
  onSelect={handleSelect}
  onSkip={handleSkip}
  // ... shared UI structure
/>

// Block modal uses base:
<PlayerSelectionModalBase mode="block" ... />

// Rebound modal uses base:
<PlayerSelectionModalBase mode="rebound" ... />
```

**Complexity Rating**: **MEDIUM** (5/10)
**Maintainability Rating**: **HIGH** (8/10)

---

### Option 3: Keep Separate (Current State)

**Approach**: Keep `BlockPromptModal` and `ReboundPromptModal` as separate components

**Pros**:
- **CLEAR SEPARATION**: Each component has single responsibility
- **SIMPLE LOGIC**: No conditional complexity
- **EASY TO MAINTAIN**: Clear, focused components
- **NO REFACTORING RISK**: Current implementation works
- **FAST TO UNDERSTAND**: Clear purpose for each component

**Cons**:
- **CODE DUPLICATION**: Some shared UI patterns (header, footer, player list)
- **MORE FILES**: Two separate component files

**Complexity Rating**: **LOW** (2/10)
**Maintainability Rating**: **HIGH** (9/10)

---

## Recommendation

### **Keep Separate Components** (Option 3)

**Rationale**:
1. **Single Responsibility Principle**: Each modal has a clear, distinct purpose
   - Block: Select defensive player (simple selection)
   - Rebound: Select any player + determine type (complex logic)

2. **Different Requirements**: 
   - Blocks only need defensive players (single team)
   - Rebounds need both teams + type determination

3. **Different Callback Signatures**: 
   - Block: `(playerId: string) => void`
   - Rebound: `(playerId: string, reboundType: 'offensive' | 'defensive') => void`

4. **Code Duplication is Minimal**: 
   - Shared patterns (header, footer, player list) are ~50 lines
   - Total duplication: ~100 lines
   - **Not worth the complexity** of making one component handle both cases

5. **Maintainability**: 
   - Separate components are easier to understand and modify
   - Changes to block logic don't affect rebound logic
   - Easier to test independently

6. **Current Implementation Works**: 
   - No bugs or issues with current approach
   - "If it ain't broke, don't fix it"

---

## Alternative: Light Refactoring (If Needed)

If code duplication becomes a concern in the future, consider:

### Extract Shared UI Components (Not Full Modal)

```typescript
// Shared components (not full modal):
<ModalHeader icon={<Shield />} title="Block?" />
<PlayerList players={defensivePlayers} onSelect={handleSelect} />
<ModalFooter onSkip={handleSkip} onConfirm={handleConfirm} />
```

**Benefits**:
- Reduces duplication of UI structure
- Keeps modal logic separate
- Easier to maintain than full modal merge
- Lower risk than Option 1 or 2

**When to Consider**:
- If more similar modals are added (e.g., StealPromptModal, AssistPromptModal)
- If UI patterns need to be consistent across all modals
- If duplication exceeds ~200 lines

---

## Conclusion

**Recommendation**: **Keep `BlockPromptModal` and `ReboundPromptModal` as separate components**

**Reasoning**:
- Different purposes (block selection vs rebound selection + type determination)
- Different prop requirements (single team vs both teams)
- Different callback signatures
- Minimal code duplication (~100 lines) doesn't justify complexity increase
- Current implementation is clear, maintainable, and working

**If Reuse is Required**:
- Consider Option 2 (shared base component) only if:
  - More similar modals are added (3+ modals with similar patterns)
  - Code duplication exceeds ~200 lines
  - UI consistency becomes a priority

**Current State**: **No changes needed** - separate components are the right approach.

---

**End of Assessment**

