# Rollback Migration 012 - Organizer Team Deletion

**Date**: January 2025  
**Status**: ✅ Rollback Script Created  
**Reason**: Incorrect implementation - organizers should NOT delete coach teams

---

## 🔄 **ROLLBACK REASON**

**Original Implementation (INCORRECT)**:
- Migration 012 allowed organizers to DELETE coach-created teams
- This violates the requirement that coaches are the only ones who can delete their teams

**Correct Requirement**:
- Organizers can DELETE only organizer-created teams (coach_id IS NULL)
- Organizers can DISCONNECT coach teams (set tournament_id = NULL) but NOT delete them
- Coaches are the ONLY ones who can DELETE their own teams

---

## 📋 **ROLLBACK STEPS**

### **Step 1: Apply Rollback Migration**

```sql
-- Run rollback script
\i docs/05-database/migrations/012_organizer_delete_coach_teams_ROLLBACK.sql
```

### **Step 2: Verify Rollback**

```sql
-- Check policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teams' 
AND policyname LIKE '%organizer%';

-- Expected:
-- 1. teams_organizer_manage (ALL - SELECT/INSERT/UPDATE)
-- 2. teams_organizer_delete_only (DELETE - organizer teams only)
```

---

## 🔒 **WHAT THE ROLLBACK DOES**

### **1. Drops Incorrect Policy**
- Removes `teams_organizer_manage` that allowed DELETE of coach teams

### **2. Restores Correct Policies**

**teams_organizer_manage** (ALL operations except DELETE):
- Allows SELECT/INSERT/UPDATE for all teams in organizer's tournaments
- Includes coach teams (for UPDATE/disconnect operations)
- Does NOT include DELETE

**teams_organizer_delete_only** (DELETE only):
- Allows DELETE only for organizer-created teams (coach_id IS NULL)
- Blocks DELETE for coach teams (coach_id IS NOT NULL)

### **3. Maintains Coach Policy**
- `teams_coach_access` remains unchanged
- Coaches can still DELETE their own teams

---

## ✅ **AFTER ROLLBACK**

**Organizer Permissions**:
- ✅ Can SELECT all teams in tournaments
- ✅ Can INSERT new teams
- ✅ Can UPDATE teams (including setting tournament_id = NULL for coach teams)
- ✅ Can DELETE only organizer-created teams (coach_id IS NULL)
- ❌ Cannot DELETE coach teams (coach_id IS NOT NULL)

**Coach Permissions**:
- ✅ Can DELETE their own teams (via teams_coach_access)
- ✅ Can manage their teams independently

---

## 🎯 **NEXT STEPS AFTER ROLLBACK**

1. ✅ Apply rollback migration
2. ⏳ Create disconnect functionality (UPDATE tournament_id = NULL)
3. ⏳ Update service layer to restrict delete to organizer teams
4. ⏳ Update UI to show "Delete" vs "Disconnect" buttons
5. ⏳ Add validation for disconnect operation

---

## 📝 **VERIFICATION CHECKLIST**

After applying rollback:

- [ ] `teams_organizer_manage` exists (ALL except DELETE)
- [ ] `teams_organizer_delete_only` exists (DELETE for organizer teams only)
- [ ] `teams_coach_access` exists (coaches can delete their teams)
- [ ] Organizer cannot DELETE coach team (test should fail)
- [ ] Organizer can UPDATE coach team tournament_id (test should pass)
- [ ] Organizer can DELETE organizer team (test should pass)

---

**Rollback Status**: ✅ **READY TO APPLY**

