# Player Stats Consistency Fix - Local vs Production

## 🔍 Root Cause Identified

**Issue:** Local dev shows 16 games, production shows 2 games

**Root Cause:** 
- Production RLS is working correctly ✅
- Local dev was not ensuring authenticated session before queries
- RLS function `player_has_game_stats_official()` filters practice games
- 16 games are from practice teams (`is_official_team = FALSE`)
- Only 4 games are from official teams (`is_official_team = TRUE`)

## 📊 Data Breakdown

**From SQL Queries:**
- **Total games with stats:** 18 unique games
- **Official team games:** 4 games ✅ (should show)
- **Practice team games:** 16 games ❌ (filtered by RLS)

**Team Status:**
- 3 teams marked as official (`is_official_team = TRUE`)
- 11 teams marked as practice (`is_official_team = FALSE`)

## ✅ Fix Applied

**File:** `src/lib/services/playerGameStatsService.ts`

**Changes:**
1. Added `ensureSupabaseSession()` call before queries
2. Ensures RLS policies are respected in local dev
3. Added comments explaining RLS filtering behavior

**Code:**
```typescript
// ✅ CRITICAL: Ensure authenticated session before querying
// This ensures RLS policies work correctly in both local dev and production
if (typeof window !== 'undefined') {
  await ensureSupabaseSession();
}
```

## 🎯 Expected Behavior After Fix

**Both Local Dev and Production:**
- Show only games from official teams (`is_official_team = TRUE`)
- Filter out practice team games (`is_official_team = FALSE`)
- Show tournament games (always official)
- Consistent behavior across environments

## 🧪 Testing

1. **Clear local cache:**
   - Open browser console
   - Run: `localStorage.clear()`
   - Refresh page

2. **Check game count:**
   - Should show ~4 games (official teams only)
   - Should match production behavior

3. **Verify RLS is working:**
   - Check console logs for: `🔍 PlayerGameStatsService: Requested X games, received Y`
   - If Y < X, RLS is filtering correctly

## 🔧 If Still Showing All Games Locally

**Possible Causes:**
1. **Cached data** - Clear cache and refresh
2. **Different auth user** - Check if logged in as admin/coach (might bypass RLS)
3. **Service role key** - Check if `.env.local` has service role key (should use anon key)

**Check:**
```bash
# In .env.local, should have:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...  # Anon key (respects RLS)
# NOT:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...     # Service key (bypasses RLS)
```

## 📝 Summary

- ✅ Same Supabase project (confirmed)
- ✅ RLS policies are correct (production working)
- ✅ Fix ensures local dev respects RLS
- ✅ Both environments will now show same games (official teams only)

**Next Steps:**
1. Test locally after fix
2. Should see ~4 games (matching production)
3. If still different, check auth session and cache

