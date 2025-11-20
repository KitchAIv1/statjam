# Jersey Number Update Flow - Database Persistence Verification

**Date**: January 2025  
**Status**: ✅ VERIFIED - Database persistence confirmed  
**Issue**: User requested verification that jersey number edits save to database, not just local storage

---

## 🔍 Investigation Summary

### Flow Analysis

1. **User Action**: User clicks jersey number in substitution modal → `EditableJerseyNumber` component
2. **Component Logic**: `EditableJerseyNumber.tsx` → `handleSave()` function
3. **Service Call**: Calls `PlayerJerseyService.updateJerseyNumber()`
4. **Database Update**: 
   - **Custom Players**: `CoachPlayerService.updateCustomPlayer()` → `supabase.from('custom_players').update()`
   - **Regular Players**: `TeamService.updatePlayer()` → `supabase.from('users').update()`
5. **Local State Update**: After DB success, updates local state via `onUpdate()` callback

---

## ✅ Database Persistence Confirmed

### Custom Players Flow

**File**: `src/lib/services/coachPlayerService.ts` (lines 344-410)

```typescript
static async updateCustomPlayer(customPlayerId: string, updates: UpdateCustomPlayerRequest) {
  // ... authentication check ...
  
  // ✅ DATABASE UPDATE
  const { data: updatedPlayer, error: updateError } = await supabase
    .from('custom_players')
    .update(updateData)  // ← jersey_number is included here
    .eq('id', customPlayerId)
    .select()
    .single();
    
  // Returns success/error based on DB result
}
```

**Database Table**: `custom_players`  
**Column**: `jersey_number`  
**Update Method**: Supabase `.update()` → **PERSISTS TO DATABASE** ✅

---

### Regular Players Flow

**File**: `src/lib/services/tournamentService.ts` (lines 1615-1643)

```typescript
static async updatePlayer(playerId: string, updates: { jerseyNumber?: number }) {
  // ✅ DATABASE UPDATE
  const { error } = await supabase
    .from('users')
    .update({
      jersey_number: updates.jerseyNumber  // ← Direct DB update
    })
    .eq('id', playerId);
    
  // Returns true/false based on DB result
}
```

**Database Table**: `users`  
**Column**: `jersey_number`  
**Update Method**: Supabase `.update()` → **PERSISTS TO DATABASE** ✅

---

## 🔄 Complete Flow Diagram

```
User clicks jersey number
    ↓
EditableJerseyNumber.handleSave()
    ↓
PlayerJerseyService.updateJerseyNumber()
    ↓
    ├─→ Custom Player? → CoachPlayerService.updateCustomPlayer()
    │                      ↓
    │                   supabase.from('custom_players').update()
    │                      ↓
    │                   ✅ DATABASE SAVED
    │
    └─→ Regular Player? → TeamService.updatePlayer()
                           ↓
                        supabase.from('users').update()
                           ↓
                        ✅ DATABASE SAVED
    ↓
onUpdate() callback → Updates local state (for UI feedback)
```

---

## ⚠️ Potential Issues & Verification

### Issue 1: Custom Player Detection

**Location**: `EditableJerseyNumber.tsx` (line 52)

```typescript
const isCustomPlayer = player.is_custom_player === true || player.id.startsWith('custom-');
```

**Verification Needed**: 
- ✅ `is_custom_player` flag is set correctly when players are loaded (verified in `page.tsx` line 242)
- ⚠️ Fallback check `player.id.startsWith('custom-')` may not be accurate if custom player IDs don't follow this pattern

**Recommendation**: The primary check (`is_custom_player === true`) should be sufficient. The fallback is a safety net.

---

### Issue 2: Error Handling

**Current Behavior**: 
- If DB update fails, `result.success` is `false`
- Error notification is shown to user
- Local state is NOT updated (correct behavior)

**Verification**: ✅ Error handling is correct - local state only updates after DB success

---

### Issue 3: Local State Update

**Location**: `page.tsx` (lines 828-838)

```typescript
const handlePlayerJerseyUpdate = (playerId: string, updatedPlayer: Player) => {
  // Updates local state arrays
  setTeamAPlayers(prev => prev.map(...));
  setTeamBPlayers(prev => prev.map(...));
  // ... updates rosters and benches
};
```

**Purpose**: Immediate UI feedback after successful DB update  
**Timing**: Called AFTER `PlayerJerseyService.updateJerseyNumber()` succeeds  
**Verification**: ✅ This is correct - local state is updated AFTER database persistence

---

## 🧪 Testing Recommendations

To verify database persistence:

1. **Test Custom Player Jersey Update**:
   - Edit jersey number for a custom player in substitution modal
   - Check database: `SELECT jersey_number FROM custom_players WHERE id = '<player_id>'`
   - Verify value matches what was entered

2. **Test Regular Player Jersey Update**:
   - Edit jersey number for a regular player in substitution modal
   - Check database: `SELECT jersey_number FROM users WHERE id = '<player_id>'`
   - Verify value matches what was entered

3. **Test Error Handling**:
   - Temporarily break database connection
   - Try to edit jersey number
   - Verify error notification appears
   - Verify local state does NOT update

4. **Test Persistence Across Sessions**:
   - Edit jersey number
   - Refresh page or restart app
   - Verify jersey number persists (loaded from database)

---

## ✅ Conclusion

**Database Persistence**: ✅ **CONFIRMED**

- Jersey number updates ARE saved to the database
- Custom players: `custom_players.jersey_number` column
- Regular players: `users.jersey_number` column
- Local state updates are for UI feedback only (happen AFTER DB success)
- Error handling prevents local state updates if DB update fails

**No Issues Found**: The implementation correctly persists to database before updating local state.

---

**Last Updated**: January 2025  
**Verified By**: Code Review & Flow Analysis

