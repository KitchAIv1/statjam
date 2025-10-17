# 🔍 **RLS POLICY ISSUE ANALYSIS - POST SQL CHANGES**

## 📋 **SYMPTOMS**

After applying SQL changes from `BACKEND_FIXES_APPLIED.sql`:

1. **❌ AUTHENTICATION BROKEN**
   - User can sign in successfully
   - Session is created (console shows: "User found: stat@example.com")
   - BUT: No redirect to dashboard occurs
   - **Root Cause**: `userRole` is null/undefined, preventing redirect

2. **❌ LIVE GAMES NOT SHOWING**
   - Homepage "Live Tournament Action" section shows "Loading live games..."
   - No live game cards appear
   - **Root Cause**: Unauthenticated users (anon role) cannot access `games` table

---

## 🔬 **ROOT CAUSE ANALYSIS**

### **Problem 1: Authentication - Missing User Profile Access**

**Flow**:
```
1. User signs in → ✅ Session created
2. AuthStore calls UserService.getUserProfile() 
3. UserService queries: SELECT * FROM users WHERE id = auth.uid()
4. ❌ RLS POLICY BLOCKS ACCESS (possible missing self-access policy)
5. userProfile returns null → userRole is null
6. AuthPageV2 redirect condition fails: if (user && userRole && !authLoading)
7. User stuck on auth page
```

**SQL Changes That May Have Caused This**:
- We added policies for `game_stats`, `game_substitutions`, `games`, `teams`, `tournaments`
- We did NOT verify existing `users` table RLS policies
- **Hypothesis**: Either no self-access policy exists, or it was accidentally modified

**Expected Policy** (Should exist):
```sql
CREATE POLICY "users_self_access_policy" ON users
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());
```

---

### **Problem 2: Live Games - Missing Public Access to Games**

**Flow**:
```
1. Homepage loads → useLiveGames hook fires
2. useLiveGames queries: SELECT * FROM games WHERE status = 'live'
3. ❌ RLS POLICY BLOCKS ACCESS (missing public SELECT policy for games)
4. Query returns empty array
5. UI shows "Loading live games..." forever
```

**SQL Changes That May Have Caused This**:
- In `BACKEND_FIXES_APPLIED.sql`, we added:
  - `game_stats_public_realtime` policy ✅
  - `game_substitutions_public_realtime` policy ✅
  - **BUT MISSED**: `games_public_read_policy` ❌

**Expected Policy** (We know we need to add this):
```sql
CREATE POLICY "games_public_read_policy" ON games
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = games.tournament_id 
      AND t.is_public = true
    )
  );
```

---

## 🎯 **WHAT SQL WAS APPLIED**

### **From BACKEND_FIXES_APPLIED.sql**:

1. ✅ **ALTER PUBLICATION supabase_realtime ADD TABLE game_stats**
   - Result: game_stats now broadcasts realtime events
   
2. ✅ **ALTER PUBLICATION supabase_realtime ADD TABLE game_substitutions**
   - Result: game_substitutions now broadcasts realtime events

3. ✅ **CREATE POLICY "game_stats_public_realtime" ON game_stats**
   - Allows `public` role to SELECT from game_stats (for realtime)
   - Only for public tournaments

4. ✅ **CREATE POLICY "game_substitutions_public_realtime" ON game_substitutions**
   - Allows `public` role to SELECT from game_substitutions (for realtime)
   - Only for public tournaments

5. ✅ **CREATE TRIGGER game_stats_update_scores**
   - Auto-updates `games.home_score` and `games.away_score`
   - Runs after INSERT/DELETE on game_stats

6. ⚠️ **MISSING**: Public access policies for `games`, `teams`, `tournaments` tables

---

## 🧪 **DIAGNOSTIC STEPS**

Run the `DIAGNOSTIC_RLS_CHECK.sql` script to verify current state:

```bash
# In Supabase SQL Editor, run:
cat DIAGNOSTIC_RLS_CHECK.sql
```

**Expected Output**:
1. **Users table**: Should have `users_self_access_policy` for authenticated users
2. **Games table**: Should have policies for organizer, stat_admin, AND public
3. **Teams table**: Should have policies for organizer AND public
4. **Tournaments table**: Should have policies for organizer AND public

**If Missing**:
- Auth breaks because users can't access their own profile
- Live viewer breaks because anon users can't see games

---

## 🛠️ **FIXES REQUIRED**

### **Fix 1: Ensure Users Can Access Their Own Profile**

```sql
-- Check if this exists
SELECT policyname FROM pg_policies WHERE tablename = 'users' AND policyname LIKE '%self%';

-- If missing, create it:
CREATE POLICY "users_self_access_policy" ON users
  FOR SELECT 
  TO authenticated
  USING (id = auth.uid());
```

### **Fix 2: Add Public Access to Games**

```sql
CREATE POLICY "games_public_read_policy" ON games
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = games.tournament_id 
      AND t.is_public = true
    )
  );
```

### **Fix 3: Add Public Access to Teams**

```sql
CREATE POLICY "teams_public_read_policy" ON teams
  FOR SELECT 
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t 
      WHERE t.id = teams.tournament_id 
      AND t.is_public = true
    )
  );
```

### **Fix 4: Add Public Access to Tournaments**

```sql
CREATE POLICY "tournaments_public_read_policy" ON tournaments
  FOR SELECT 
  TO anon
  USING (is_public = true);
```

---

## 🔄 **ROLLBACK PLAN (If Needed)**

If we need to completely rollback the SQL changes:

```sql
-- Remove the policies we added
DROP POLICY IF EXISTS "game_stats_public_realtime" ON game_stats;
DROP POLICY IF EXISTS "game_substitutions_public_realtime" ON game_substitutions;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE game_stats;
ALTER PUBLICATION supabase_realtime DROP TABLE game_substitutions;

-- Remove triggers
DROP TRIGGER IF EXISTS game_stats_update_scores ON game_stats;
DROP TRIGGER IF EXISTS game_stats_delete_update_scores ON game_stats;
DROP FUNCTION IF EXISTS update_game_scores();
```

---

## 📊 **VERIFICATION CHECKLIST**

After applying fixes:

- [ ] **Auth Test**: Sign in as stat_admin → Should redirect to `/dashboard/stat-admin`
- [ ] **Auth Test**: Sign in as player → Should redirect to `/dashboard/player`
- [ ] **Live Viewer Test**: Open homepage in incognito → Should see live game cards
- [ ] **Real-time Test**: Record stat → Live viewer should update without refresh

---

## 🎯 **NEXT STEPS**

1. **Run `DIAGNOSTIC_RLS_CHECK.sql`** to see current policy state
2. **Apply missing policies** based on diagnostic results
3. **Test authentication** (sign in/redirect)
4. **Test live viewer** (should show games on homepage)
5. **Test real-time** (stat changes should broadcast)

---

## 📝 **LESSONS LEARNED**

1. **Always check existing policies** before adding new ones
2. **Public access requires explicit anon role policies**
3. **Authentication depends on users table self-access policy**
4. **Live viewer requires public access to games, teams, tournaments**
5. **Realtime requires BOTH: publication + SELECT policies**
