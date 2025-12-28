# Live Stream Organizer Games Issue - Audit Report

**Date**: December 18, 2025  
**Issue**: Live Stream component only showing COACH games, not ORGANIZER games  
**Status**: 🔍 Root Cause Identified

---

## 🐛 Problem Statement

When an organizer accesses the Live Stream page (`/dashboard?section=live-stream`), the component only displays games from **COACH mode**, not games from **ORGANIZER tournaments**.

---

## 🔍 Root Cause Analysis

### **Current Query in OrganizerLiveStream.tsx (Lines 187-225)**

```typescript
const { data, error } = await supabase
  .from('games')
  .select(`...`)
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

### **What's Missing:**

1. ❌ **No filter for `is_coach_game`** - Query doesn't exclude coach games
2. ❌ **No filter for tournament ownership** - Query doesn't filter by organizer's tournaments
3. ❌ **No filter for `is_coach_game = FALSE`** - Should only show organizer games

---

## 📊 Database Schema Context

### **Games Table Structure:**

```sql
games (
  id UUID,
  tournament_id UUID,        -- Links to tournaments table
  is_coach_game BOOLEAN,     -- TRUE = coach game, FALSE/NULL = organizer game
  stat_admin_id UUID,        -- Assigned stat admin
  status TEXT,               -- 'live', 'in_progress', etc.
  ...
)
```

### **Game Types:**

1. **Organizer Games:**
   - `is_coach_game = FALSE` (or NULL)
   - `tournament_id` → links to tournament
   - Tournament has `organizer_id` → links to organizer user
   - Access: Via tournament ownership

2. **Coach Games:**
   - `is_coach_game = TRUE`
   - `stat_admin_id` = coach user ID
   - `tournament_id` may be NULL or point to a different tournament
   - Access: Via `stat_admin_id` OR public view policy

---

## 🔐 RLS Policies Analysis

### **Current RLS Policies on `games` Table:**

1. **`games_coach_public_view`** (Migration 023)
   ```sql
   CREATE POLICY "games_coach_public_view" ON games
     FOR SELECT TO anon, authenticated
     USING (is_coach_game = TRUE);
   ```
   - ✅ **ALLOWS ANYONE** (including organizers) to view coach games
   - This is why organizer sees coach games!

2. **`games_organizer_manage`** (FINAL_RLS_CLEAN_SLATE)
   ```sql
   CREATE POLICY "games_organizer_manage" ON games
     FOR ALL TO authenticated
     USING (
       EXISTS (
         SELECT 1 FROM tournaments t
         WHERE t.id = games.tournament_id 
         AND t.organizer_id = auth.uid()
       )
     );
   ```
   - ✅ Allows organizers to see games in their tournaments
   - Requires tournament join (more expensive)

3. **`games_stat_admin_manage`**
   ```sql
   CREATE POLICY "games_stat_admin_manage" ON games
     FOR ALL TO authenticated
     USING (stat_admin_id = auth.uid());
   ```
   - ✅ Allows stat admins to see their assigned games

### **RLS Policy Behavior:**

**Supabase RLS policies are OR'ed together**, meaning:
- If ANY policy matches, the row is returned
- Organizer can see:
  - ✅ Games in their tournaments (via `games_organizer_manage`)
  - ✅ Coach games (via `games_coach_public_view`) ← **THIS IS THE PROBLEM**

---

## 🎯 Why Organizer Sees Only Coach Games

### **Scenario Analysis:**

**Hypothesis 1: Coach games are more recent/visible**
- If there are many coach games with status 'live'/'in_progress'
- And fewer organizer games with same status
- The query returns coach games first (sorted by `created_at DESC`)
- Organizer sees coach games in dropdown

**Hypothesis 2: RLS policy priority**
- `games_coach_public_view` is simpler (no join) → faster
- `games_organizer_manage` requires tournament join → slower
- Supabase might return coach games first due to simpler policy

**Hypothesis 3: Query doesn't filter game type**
- Query doesn't specify `is_coach_game = FALSE`
- RLS allows both types
- Result: Mix of coach + organizer games, but coach games dominate

---

## 🔍 Comparison with Other Components

### **How OrganizerGameScheduler Fetches Games:**

**File**: `src/components/OrganizerGameScheduler.tsx` (Lines 36-99)

```typescript
// ✅ CORRECT APPROACH: Get tournaments first, then games
const tournaments = useTournaments(user);
const tournamentGamesPromises = tournaments.map(tournament => 
  GameService.getGamesByTournament(tournament.id)  // ← Filters by tournament
);
```

**Key Difference:**
- ✅ Gets organizer's tournaments first
- ✅ Fetches games per tournament
- ✅ Only gets games from organizer's tournaments
- ✅ Automatically excludes coach games (they're not in organizer tournaments)

### **How OrganizerDashboardService Fetches Games:**

**File**: `src/lib/services/organizerDashboardService.ts` (Lines 119-170)

```typescript
// ✅ CORRECT APPROACH: Filter by tournament ownership
const tournaments = await TournamentService.getTournamentsByOrganizer(organizerId);
const tournamentIds = tournaments.map(t => t.id);

const { data: games, error } = await supabase
  .from('games')
  .select(`...`)
  .in('tournament_id', tournamentIds)  // ← Filters by organizer's tournaments
  .order('start_time', { ascending: true });
```

**Key Difference:**
- ✅ Gets organizer's tournaments first
- ✅ Filters games by `tournament_id IN (organizer_tournament_ids)`
- ✅ Only returns organizer games

---

## ✅ Solution Options

### **Option 1: Filter by `is_coach_game = FALSE` (Simplest)**

**Change Query:**
```typescript
const { data, error } = await supabase
  .from('games')
  .select(`...`)
  .eq('is_coach_game', false)  // ← ADD THIS
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

**Pros:**
- ✅ Simple one-line fix
- ✅ Explicitly excludes coach games
- ✅ Fast (indexed column)

**Cons:**
- ⚠️ Still shows ALL organizer games (not just current organizer's)
- ⚠️ Doesn't filter by tournament ownership

### **Option 2: Filter by Tournament Ownership (Most Accurate)**

**Change Query:**
```typescript
// First get organizer's tournaments
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id')
  .eq('organizer_id', user.id);

const tournamentIds = tournaments?.map(t => t.id) || [];

// Then get games from those tournaments
const { data, error } = await supabase
  .from('games')
  .select(`...`)
  .in('tournament_id', tournamentIds)  // ← ADD THIS
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

**Pros:**
- ✅ Only shows organizer's own games
- ✅ Matches pattern used in other components
- ✅ More secure (respects tournament ownership)

**Cons:**
- ⚠️ Requires two queries
- ⚠️ Slightly more complex

### **Option 3: Combined Filter (Best of Both)**

**Change Query:**
```typescript
// Get organizer's tournaments
const { data: tournaments } = await supabase
  .from('tournaments')
  .select('id')
  .eq('organizer_id', user.id);

const tournamentIds = tournaments?.map(t => t.id) || [];

// Get games: organizer tournaments + exclude coach games
const { data, error } = await supabase
  .from('games')
  .select(`...`)
  .in('tournament_id', tournamentIds)  // ← Organizer's tournaments
  .or('is_coach_game.is.null,is_coach_game.eq.false')  // ← Exclude coach games
  .in('status', ['live', 'in_progress', 'LIVE', 'IN_PROGRESS'])
  .order('created_at', { ascending: false })
  .limit(20);
```

**Pros:**
- ✅ Most accurate (only organizer's games)
- ✅ Explicitly excludes coach games
- ✅ Matches other components' patterns

**Cons:**
- ⚠️ Requires two queries
- ⚠️ Most complex

---

## 📋 Recommended Solution

### **Recommended: Option 2 (Tournament Ownership Filter)**

**Rationale:**
1. ✅ Matches existing patterns in codebase (`OrganizerGameScheduler`, `OrganizerDashboardService`)
2. ✅ Only shows organizer's own games (correct behavior)
3. ✅ Automatically excludes coach games (they're not in organizer tournaments)
4. ✅ More secure (respects RLS and tournament ownership)

**Implementation:**
- Get organizer's tournaments first (using `useAuthContext` to get `user.id`)
- Filter games by `tournament_id IN (organizer_tournament_ids)`
- This automatically excludes coach games

---

## 🔍 Verification Steps

### **To Verify the Issue:**

1. **Check current query results:**
   ```sql
   -- Run as organizer user
   SELECT 
     id, 
     tournament_id, 
     is_coach_game, 
     status,
     created_at
   FROM games
   WHERE status IN ('live', 'in_progress', 'LIVE', 'IN_PROGRESS')
   ORDER BY created_at DESC
   LIMIT 20;
   ```
   - Count how many have `is_coach_game = TRUE` (coach games)
   - Count how many have `is_coach_game = FALSE/NULL` (organizer games)

2. **Check organizer's tournaments:**
   ```sql
   SELECT id, name FROM tournaments WHERE organizer_id = '<organizer_user_id>';
   ```

3. **Check games in organizer's tournaments:**
   ```sql
   SELECT 
     g.id, 
     g.is_coach_game, 
     g.status,
     t.name as tournament_name
   FROM games g
   JOIN tournaments t ON t.id = g.tournament_id
   WHERE t.organizer_id = '<organizer_user_id>'
     AND g.status IN ('live', 'in_progress', 'LIVE', 'IN_PROGRESS');
   ```

---

## 🎯 Summary

### **Root Cause:**
The query in `OrganizerLiveStream.tsx` doesn't filter by:
1. Tournament ownership (organizer's tournaments)
2. Game type (`is_coach_game = FALSE`)

This allows the `games_coach_public_view` RLS policy to return coach games, which may dominate the results.

### **Solution:**
Filter games by tournament ownership (get organizer's tournaments first, then filter games by `tournament_id`). This matches the pattern used in other organizer components and automatically excludes coach games.

### **Files to Modify:**
- `src/components/OrganizerLiveStream.tsx` (lines 183-225)
- `src/components/OrganizerDashboard.tsx` (line 80) - Pass `user` prop

### **Dependencies:**
- Need access to `user.id` (organizer ID)
- **Current**: Component doesn't receive `user` prop
- **Solution**: Either:
  1. Pass `user` prop from `OrganizerDashboard` (line 80)
  2. Use `useAuthContext()` hook inside `OrganizerLiveStream`

---

## ✅ Next Steps

1. **Implement tournament ownership filter** in `OrganizerLiveStream.tsx`
2. **Test with organizer account** - should only see organizer games
3. **Verify coach games are excluded** - should not appear in dropdown
4. **Test with multiple organizers** - each should only see their own games

