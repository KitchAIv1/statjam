# Teams RLS Policy Cleanup

**Date**: January 2025  
**Status**: ✅ Complete  
**Issue**: Redundant RLS policies causing confusion

---

## 🔍 **PROBLEM IDENTIFIED**

Current teams table has **redundant RLS policies**:

1. ✅ `teams_organizer_manage` - Main organizer policy (CORRECT)
2. ❌ `teams_organizer_tournament_access` - **REDUNDANT** (same logic as above)

Both policies do the same thing:
- Allow organizers to manage teams in their tournaments
- Check tournament ownership via EXISTS subquery
- `teams_organizer_tournament_access` has extra `tournament_id IS NOT NULL` check (unnecessary)

---

## ✅ **SOLUTION**

**Migration**: `013_cleanup_teams_rls_policies.sql`

**Action**: Remove redundant `teams_organizer_tournament_access` policy

**Rationale**:
- `teams_organizer_manage` already covers all cases
- EXISTS subquery handles NULL tournament_id gracefully
- Having two policies creates confusion and potential conflicts
- PostgreSQL RLS uses OR logic - redundant policies are unnecessary

---

## 📊 **FINAL POLICY STRUCTURE**

After cleanup, teams table will have:

### **ALL Operations (Full Management)**
1. `teams_organizer_manage` - Organizers manage teams in their tournaments
2. `teams_coach_access` - Coaches manage their own teams

### **SELECT Operations (Read Only)**
3. `teams_organizer_coach_import` - Organizers can SELECT public coach teams for import
4. `teams_public_read` - Public can SELECT teams in public tournaments
5. `teams_public_coach_view` - Public can SELECT public coach teams
6. `teams_authenticated_read_all` - Authenticated users can SELECT all teams

---

## 🔒 **POLICY LOGIC**

### **teams_organizer_manage**
```sql
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments t
    WHERE t.id = teams.tournament_id 
    AND t.organizer_id = auth.uid()
  )
)
```

**Covers**:
- ✅ Organizer-created teams (tournament_id set, organizer owns tournament)
- ✅ Coach-created teams in tournaments (tournament_id set, organizer owns tournament)
- ✅ Handles NULL tournament_id gracefully (EXISTS returns false)

### **teams_coach_access**
```sql
USING (coach_id = auth.uid())
```

**Covers**:
- ✅ Coach-created teams (coach_id matches auth.uid())
- ✅ Works independently of tournaments

---

## ✅ **VERIFICATION**

After applying migration, verify:

```sql
-- Should return 6 policies (no duplicates)
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'teams';

-- Should NOT exist
SELECT * FROM pg_policies 
WHERE tablename = 'teams' 
AND policyname = 'teams_organizer_tournament_access';
-- Expected: 0 rows

-- Should exist
SELECT * FROM pg_policies 
WHERE tablename = 'teams' 
AND policyname = 'teams_organizer_manage';
-- Expected: 1 row
```

---

## 🎯 **IMPACT**

**No Breaking Changes**:
- ✅ Organizers can still delete coach teams (covered by `teams_organizer_manage`)
- ✅ Coaches can still manage their teams (covered by `teams_coach_access`)
- ✅ All read operations remain intact
- ✅ No functionality lost

**Benefits**:
- ✅ Cleaner policy structure
- ✅ Easier to understand and maintain
- ✅ No redundant checks
- ✅ Reduced confusion

---

## 📝 **MIGRATION ORDER**

1. ✅ Apply `012_organizer_delete_coach_teams.sql` (creates teams_organizer_manage)
2. ✅ Apply `013_cleanup_teams_rls_policies.sql` (removes redundant policy)

**Note**: Migration 012 already drops `teams_organizer_tournament_access`, but migration 013 ensures it's cleaned up if it was recreated elsewhere.

---

**Status**: ✅ **READY TO APPLY**

