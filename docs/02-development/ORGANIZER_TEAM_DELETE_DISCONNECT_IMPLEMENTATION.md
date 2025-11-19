# Organizer Team Delete/Disconnect Implementation

**Date**: January 2025  
**Status**: ✅ Complete  
**Priority**: HIGH - Correct implementation per requirements

---

## 🎯 **REQUIREMENTS**

### **Correct Behavior:**
1. ✅ Organizers can DELETE only organizer-created teams (`coach_id IS NULL`)
2. ✅ Organizers can DISCONNECT coach teams (`set tournament_id = NULL`) but NOT delete them
3. ✅ Coaches are the ONLY ones who can DELETE their own teams
4. ✅ Safeguards: Cannot delete/disconnect if active/scheduled games exist

---

## ✅ **IMPLEMENTATION COMPLETE**

### **1. Service Layer Updates**

**File**: `src/lib/services/tournamentService.ts`

#### **TeamService.deleteTeam()** - Updated
- ✅ Validates `coach_id IS NULL` before deletion
- ✅ Throws error if attempting to delete coach team
- ✅ Validates no active/scheduled games
- ✅ Deletes team_players relationships first
- ✅ Updates tournament team count

#### **TeamService.disconnectCoachTeam()** - New Method
- ✅ Validates `coach_id IS NOT NULL` (coach team only)
- ✅ Validates no active/scheduled games
- ✅ Sets `tournament_id = NULL` (disconnects from tournament)
- ✅ Updates tournament team count
- ✅ Team remains accessible to coach

---

### **2. Hook Layer Updates**

**File**: `src/hooks/useTeamManagement.ts`

#### **disconnectTeam()** - New Method
- ✅ Calls `TeamService.disconnectCoachTeam()`
- ✅ Refreshes teams list after disconnect
- ✅ Error handling and logging

---

### **3. UI Component Updates**

#### **TeamDeleteConfirmModal** - Enhanced
**File**: `src/components/shared/TeamDeleteConfirmModal.tsx`

**New Props**:
- `action: 'delete' | 'disconnect'` - Determines modal behavior
- `isCoachTeam: boolean` - Indicates team type

**Features**:
- ✅ Different titles/icons for delete vs disconnect
- ✅ Different warnings and messaging
- ✅ Same game validation for both actions
- ✅ Visual distinction (red for delete, orange for disconnect)

#### **OrganizerTournamentManager** - Updated
**File**: `src/components/OrganizerTournamentManager.tsx`

**Changes**:
- ✅ Conditional button rendering:
  - **Delete button** (Trash2 icon) for organizer teams (`!team.coach_id`)
  - **Disconnect button** (Unlink icon) for coach teams (`team.coach_id`)
- ✅ Updated modal props to pass `action` and `isCoachTeam`
- ✅ Calls appropriate method (`deleteTeam` vs `disconnectTeam`)

---

## 🔒 **VALIDATION & SAFEGUARDS**

### **Delete Validation:**
1. ✅ Team must be organizer-created (`coach_id IS NULL`)
2. ✅ No active games (`status = 'in_progress'`)
3. ✅ No scheduled games (`status = 'scheduled'`)

### **Disconnect Validation:**
1. ✅ Team must be coach-created (`coach_id IS NOT NULL`)
2. ✅ No active games (`status = 'in_progress'`)
3. ✅ No scheduled games (`status = 'scheduled'`)

### **Error Messages:**
- Clear guidance on why action is blocked
- Suggests alternative actions (disconnect vs delete)
- Shows game counts for active/scheduled games

---

## 📊 **USER FLOW**

### **Organizer Team (coach_id IS NULL):**
1. User clicks **Delete** button (Trash2 icon)
2. Modal shows "Delete Team" with destructive styling
3. Validates no active/scheduled games
4. Shows warning if completed games exist
5. Confirms → Permanently deletes team

### **Coach Team (coach_id IS NOT NULL):**
1. User clicks **Disconnect** button (Unlink icon)
2. Modal shows "Disconnect Team" with orange styling
3. Validates no active/scheduled games
4. Shows info that team remains accessible to coach
5. Confirms → Sets `tournament_id = NULL`

---

## 🎨 **UI DIFFERENCES**

### **Delete Button:**
- Icon: `Trash2` (red)
- Hover: `hover:bg-destructive/10 hover:text-destructive`
- Tooltip: "Delete Team"

### **Disconnect Button:**
- Icon: `Unlink` (orange)
- Hover: `hover:bg-orange-600/10 hover:text-orange-600`
- Tooltip: "Disconnect Team"

### **Modal Styling:**
- **Delete**: Red/destructive theme
- **Disconnect**: Orange theme (`bg-orange-600`)

---

## 📝 **FILES MODIFIED**

1. ✅ `src/lib/services/tournamentService.ts`
   - Updated `deleteTeam()` validation
   - Added `disconnectCoachTeam()` method

2. ✅ `src/hooks/useTeamManagement.ts`
   - Added `disconnectTeam()` method

3. ✅ `src/components/shared/TeamDeleteConfirmModal.tsx`
   - Added `action` and `isCoachTeam` props
   - Conditional rendering based on action type

4. ✅ `src/components/OrganizerTournamentManager.tsx`
   - Conditional button rendering
   - Updated modal integration

---

## 🧪 **TESTING CHECKLIST**

- [ ] **Delete Organizer Team** (no games) - Should succeed
- [ ] **Delete Organizer Team** (with active games) - Should fail with error
- [ ] **Delete Organizer Team** (with scheduled games) - Should fail with error
- [ ] **Delete Coach Team** - Should fail with "use disconnect" message
- [ ] **Disconnect Coach Team** (no games) - Should succeed
- [ ] **Disconnect Coach Team** (with active games) - Should fail with error
- [ ] **Disconnect Coach Team** (with scheduled games) - Should fail with error
- [ ] **Disconnect Organizer Team** - Should fail with "use delete" message
- [ ] **UI Button Display** - Correct button shown per team type
- [ ] **Modal Display** - Correct modal content per action type
- [ ] **Tournament Count** - Updates correctly after delete/disconnect

---

## 🔄 **RLS POLICY STATUS**

**Current Policies** (after cleanup):
- ✅ `teams_organizer_select` - SELECT operations
- ✅ `teams_organizer_insert` - INSERT operations
- ✅ `teams_organizer_update` - UPDATE operations (allows disconnect)
- ✅ `teams_organizer_delete_only` - DELETE operations (organizer teams only)
- ✅ `teams_coach_access` - ALL operations for coaches

**Result**:
- ✅ Organizers can UPDATE coach teams (disconnect)
- ✅ Organizers can DELETE only organizer teams
- ✅ Coaches can DELETE their own teams

---

## 📈 **DATA FLOW**

### **Delete Flow:**
```
UI Click → useTeamManagement.deleteTeam() 
→ TeamService.deleteTeam() 
→ Validate coach_id IS NULL 
→ Validate no active games 
→ Delete team_players 
→ Delete team 
→ Update tournament count
```

### **Disconnect Flow:**
```
UI Click → useTeamManagement.disconnectTeam() 
→ TeamService.disconnectCoachTeam() 
→ Validate coach_id IS NOT NULL 
→ Validate no active games 
→ UPDATE teams SET tournament_id = NULL 
→ Update tournament count
```

---

## ✅ **SUCCESS CRITERIA**

✅ Organizers can DELETE only organizer teams  
✅ Organizers can DISCONNECT coach teams  
✅ Coaches can DELETE their own teams  
✅ Validation prevents deletion/disconnect with active games  
✅ Clear UI distinction between delete and disconnect  
✅ Proper error messages guide users  
✅ Tournament team count updates correctly  

---

**Implementation Status**: ✅ **COMPLETE**  
**Ready for Testing**: ✅ **YES**  
**Breaking Changes**: ❌ **NO**

