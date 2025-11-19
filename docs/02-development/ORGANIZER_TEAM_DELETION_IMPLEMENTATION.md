# Organizer Team Deletion Implementation

**Date**: January 2025  
**Status**: ✅ Complete  
**Priority**: HIGH - Enables organizers to manage all teams in their tournaments

---

## 🎯 **OBJECTIVE**

Enable organizers to delete both organizer-created and coach-created teams within their tournaments, with proper validation and safeguards.

---

## ✅ **IMPLEMENTATION COMPLETE**

### **1. RLS Policy Migration**

**File**: `docs/05-database/migrations/012_organizer_delete_coach_teams.sql`

**Changes**:
- Updated `teams_organizer_manage` policy to allow organizers to manage ALL teams in their tournaments
- Policy now covers both organizer-created teams AND coach-created teams
- No conflicts with existing `teams_coach_access` policy (PostgreSQL RLS uses OR logic)

**Key Policy**:
```sql
CREATE POLICY "teams_organizer_manage"
ON public.teams 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
```

**Impact**: 
- ✅ Organizers can now delete coach teams in their tournaments
- ✅ No conflicts with coach deletion (coaches can still delete their own teams)
- ✅ No impact on other RLS policies

---

### **2. Service Layer Validation**

**File**: `src/lib/services/tournamentService.ts` - `TeamService.deleteTeam()`

**Added Validation**:
- Checks for active games (`status = 'in_progress'`)
- Checks for scheduled games (`status = 'scheduled'`)
- Prevents deletion if team has active/scheduled games
- Provides clear error messages with game counts

**Validation Logic**:
```typescript
// Check for active or scheduled games
const { data: activeGames } = await supabase
  .from('games')
  .select('id, status, start_time')
  .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
  .in('status', ['in_progress', 'scheduled']);

if (activeGames && activeGames.length > 0) {
  throw new Error(
    `Cannot delete team "${teamData.name}". Team has ${activeCount} active game(s) and ${scheduledCount} scheduled game(s).`
  );
}
```

**Impact**:
- ✅ Prevents accidental deletion of teams with active games
- ✅ Prevents cascading deletion of scheduled games
- ✅ Clear error messages guide users

---

### **3. Confirmation Modal Component**

**File**: `src/components/shared/TeamDeleteConfirmModal.tsx`

**Features**:
- Checks team games before showing confirmation
- Shows warning for teams with completed games
- Prevents deletion of teams with active/scheduled games
- Displays game counts and status
- Loading states and error handling

**UI States**:
1. **Checking Games**: Shows loading spinner while checking
2. **Cannot Delete**: Shows error if team has active/scheduled games
3. **Warning**: Shows warning if team has completed games (data loss)
4. **Safe to Delete**: Shows confirmation if team has no games

**Impact**:
- ✅ User-friendly confirmation flow
- ✅ Prevents accidental deletions
- ✅ Clear warnings about data loss

---

### **4. UI Integration**

**File**: `src/components/OrganizerTournamentManager.tsx`

**Changes**:
- Added `TeamDeleteConfirmModal` import
- Added state for team deletion (`isTeamDeleteModalOpen`, `teamToDelete`)
- Replaced direct `deleteTeam()` call with modal trigger
- Integrated modal component with proper handlers

**Integration**:
```typescript
// Button click opens modal
onClick={() => {
  setTeamToDelete({ id: team.id, name: team.name });
  setIsTeamDeleteModalOpen(true);
}}

// Modal confirms deletion
onConfirm={async () => {
  await teamManagement.deleteTeam(teamToDelete.id);
  setIsTeamDeleteModalOpen(false);
  setTeamToDelete(null);
}}
```

**Impact**:
- ✅ Consistent UX with tournament deletion
- ✅ Proper confirmation flow
- ✅ Error handling and user feedback

---

## 🔒 **SAFEGUARDS IMPLEMENTED**

### **1. Database Level**
- ✅ RLS policies ensure only authorized users can delete
- ✅ Foreign key constraints prevent orphaned data
- ✅ Cascading deletes handled properly (team_players, games)

### **2. Service Level**
- ✅ Validation prevents deletion of teams with active/scheduled games
- ✅ Clear error messages guide users
- ✅ Tournament team count automatically updated

### **3. UI Level**
- ✅ Confirmation modal prevents accidental deletions
- ✅ Game status checking before deletion
- ✅ Warnings for data loss scenarios
- ✅ Loading states and error handling

---

## 📊 **CASCADING DELETE EFFECTS**

### **Automatic Cascades** (Database Level):
1. `team_players` → Deleted (ON DELETE CASCADE)
2. `games` → Deleted if team is team_a or team_b (ON DELETE CASCADE)
3. `game_possessions` → Deleted (ON DELETE CASCADE)
4. `games.current_possession_team_id` → Set to NULL (ON DELETE SET NULL)
5. `games.jump_ball_arrow_team_id` → Set to NULL (ON DELETE SET NULL)

### **Prevented Cascades** (Service Level):
- ✅ Active games cannot be deleted (validation prevents team deletion)
- ✅ Scheduled games cannot be deleted (validation prevents team deletion)
- ✅ Completed games can be deleted (user warned about data loss)

---

## 🧪 **TESTING CHECKLIST**

- [ ] **RLS Policy**: Verify organizers can delete coach teams in their tournaments
- [ ] **Validation**: Verify teams with active games cannot be deleted
- [ ] **Validation**: Verify teams with scheduled games cannot be deleted
- [ ] **Modal**: Verify confirmation modal shows correct warnings
- [ ] **Cascade**: Verify team_players are deleted when team is deleted
- [ ] **Cascade**: Verify completed games are deleted when team is deleted
- [ ] **Count**: Verify tournament team count updates after deletion
- [ ] **Error Handling**: Verify error messages are clear and helpful

---

## 📝 **MIGRATION INSTRUCTIONS**

### **Step 1: Apply RLS Migration**
```sql
-- Run migration file
\i docs/05-database/migrations/012_organizer_delete_coach_teams.sql
```

### **Step 2: Verify Policies**
```sql
-- Check policies are correctly set
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'teams';
```

### **Step 3: Test Deletion**
1. Create a tournament as organizer
2. Create a team (organizer-created)
3. Create a team with coach_id (coach-created)
4. Verify both can be deleted by organizer
5. Verify teams with active games cannot be deleted

---

## 🎯 **SUCCESS CRITERIA**

✅ Organizers can delete organizer-created teams  
✅ Organizers can delete coach-created teams in their tournaments  
✅ Teams with active games cannot be deleted  
✅ Teams with scheduled games cannot be deleted  
✅ Clear warnings for data loss scenarios  
✅ No cascading issues with other components  
✅ Tournament team count updates correctly  

---

## 📚 **RELATED FILES**

- `docs/05-database/migrations/012_organizer_delete_coach_teams.sql` - RLS migration
- `src/lib/services/tournamentService.ts` - Service layer validation
- `src/components/shared/TeamDeleteConfirmModal.tsx` - Confirmation modal
- `src/components/OrganizerTournamentManager.tsx` - UI integration
- `src/hooks/useTeamManagement.ts` - Team management hook

---

## 🔄 **ROLLBACK PLAN**

If issues arise:

1. **Revert RLS Policy**:
```sql
DROP POLICY IF EXISTS "teams_organizer_manage" ON teams;
-- Restore previous policy if needed
```

2. **Revert Service Changes**:
- Remove validation logic from `TeamService.deleteTeam()`
- Restore original deletion flow

3. **Revert UI Changes**:
- Remove `TeamDeleteConfirmModal` import and usage
- Restore direct `deleteTeam()` call

---

## 📈 **FUTURE ENHANCEMENTS**

- [ ] Bulk team deletion with validation
- [ ] Soft delete option (archive teams instead of deleting)
- [ ] Team deletion audit log
- [ ] Email notifications to coaches when their teams are deleted
- [ ] Option to transfer games to another team before deletion

---

**Implementation Status**: ✅ **COMPLETE**  
**Ready for Testing**: ✅ **YES**  
**Breaking Changes**: ❌ **NO**

