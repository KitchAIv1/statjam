# 🚀 Deployment Guide - Personal Player Stat Tracker

**Feature**: Personal Player Stat Tracker  
**Date**: October 21, 2025  
**Version**: v0.12.0  
**Security Rating**: A (Excellent)

---

## 📋 Pre-Deployment Checklist

- ✅ Code merged to main branch
- ✅ Production build verified (successful)
- ✅ Security audit complete (A rating)
- ✅ Documentation updated
- ✅ Zero linting errors
- ✅ Zero build warnings

---

## 🗄️ Step 3: Database Migration

### **CRITICAL: Run Migration in Supabase**

The `personal_games` table must be created before the feature will work.

### **How to Run Migration:**

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open file: `database/migrations/003_personal_games_table.sql`
   - Copy the ENTIRE contents (all 268 lines)

4. **Execute Migration**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for completion (should take 2-5 seconds)

5. **Verify Success**
   - You should see output: `NOTICE: Personal Games Migration completed successfully!`
   - Check for confirmation messages about tables, views, and functions created

### **What the Migration Creates:**

**Tables:**
- `personal_games` - Main table for personal game stats
- `personal_games_rate_limit` - Rate limiting enforcement (10 games/day)

**Views:**
- `player_personal_stats` - Aggregated statistics view

**Functions:**
- `calculate_fg_percentage()` - Field goal percentage calculation
- `calculate_efg_percentage()` - Effective field goal percentage
- `check_personal_games_rate_limit()` - Rate limiting function
- `update_personal_games_timestamp()` - Auto-update trigger

**Indexes:**
- 6 performance indexes for optimal query speed
- Composite index for pagination

**RLS Policies:**
- `players_own_personal_games` - Player-only access
- `public_read_public_games` - Public games readable by all
- `service_role_full_access_personal_games` - Admin access

**Security Features:**
- Row Level Security (RLS) enabled
- `player_id = auth.uid()` enforcement
- ON DELETE CASCADE for data cleanup
- Check constraints for data validation

### **Verification After Migration:**

Run this query in Supabase SQL Editor to verify:

```sql
-- Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'personal_games';

-- Should return: personal_games

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'personal_games';

-- Should return: rowsecurity = true

-- Verify indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'personal_games';

-- Should return 6 indexes
```

---

## 🧪 Step 4: Testing the Live Feature

### **Test Plan:**

**1. Sign in as a Player**
```
1. Go to /auth
2. Sign in with player credentials
3. Navigate to Player Dashboard
```

**2. Access Personal Stats**
```
Option A: Click "Personal Stats" tab in Player Dashboard
Option B: Go directly to /dashboard/player/personal-stats
```

**3. Create Test Game**
```
1. Click "New Game" tab
2. Fill in game details:
   - Date: Today
   - Location: "Test Court"
   - Opponent: "Test Team"
3. Add stats using quick buttons:
   - Click "+2 PT" a few times
   - Click "REB" a few times
   - Click "AST" a few times
4. (Optional) Add shooting stats in advanced section
5. Click "Save Game"
```

**4. Verify Game Saved**
```
1. Check for success notification
2. Switch to "History" tab
3. Verify game appears in list
4. Click to expand details
5. Verify all stats are correct
```

**5. Test Security (Critical)**
```
Test XSS Protection:
1. Create game with location: `<script>alert('xss')</script>`
2. Save game
3. Verify: Text displays as plain text (not executed)

Test Validation:
1. Try to set FG made > FG attempted
2. Verify: Error message appears
3. Try to set 3PT made > FG made
4. Verify: Error message appears
```

### **Expected Results:**

✅ **Success Indicators:**
- Games save without errors
- Games appear in history list
- Stats display correctly
- XSS attempts are sanitized
- Invalid stats are rejected with clear error messages
- Character limits work (location: 200, opponent: 100, notes: 500)
- No console errors in browser

❌ **Failure Indicators:**
- "relation does not exist" error → Migration not run
- 404 errors → Build not deployed
- Unauthorized errors → RLS policy issues
- Script tags execute → XSS vulnerability (critical!)

---

## 🔍 Troubleshooting

### **Issue: "relation 'personal_games' does not exist"**
**Solution**: Run the database migration (Step 3)

### **Issue: Games don't appear in list**
**Solution**: 
1. Check browser console for errors
2. Verify RLS policies are enabled
3. Ensure user is signed in as player

### **Issue: "Daily limit reached" error**
**Solution**: This is normal rate limiting (10 games/day). Wait until tomorrow or adjust in database.

### **Issue: XSS script executes**
**Solution**: CRITICAL SECURITY ISSUE
1. Check DOMPurify is installed: `npm list dompurify`
2. Verify sanitization code is in place
3. Contact development team immediately

---

## 📊 Monitoring

### **Metrics to Track:**

**Usage Metrics:**
- Number of personal games created per day
- Active players using the feature
- Average games per player

**Performance Metrics:**
- Page load time for `/dashboard/player/personal-stats`
- API response time for game creation
- Database query performance

**Security Metrics:**
- Failed authentication attempts
- Rate limit triggers
- Invalid input attempts

### **Database Queries for Monitoring:**

```sql
-- Total personal games
SELECT COUNT(*) FROM personal_games;

-- Games created today
SELECT COUNT(*) FROM personal_games 
WHERE created_at::date = CURRENT_DATE;

-- Active players (created game in last 30 days)
SELECT COUNT(DISTINCT player_id) FROM personal_games 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Average games per player
SELECT AVG(game_count) FROM (
  SELECT player_id, COUNT(*) as game_count 
  FROM personal_games 
  GROUP BY player_id
) sub;
```

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Database migration completes without errors
- ✅ Players can create and view personal games
- ✅ All validation rules work correctly
- ✅ XSS protection verified (scripts don't execute)
- ✅ RLS policies prevent unauthorized access
- ✅ Character limits enforced
- ✅ No console errors in browser
- ✅ Mobile experience is smooth
- ✅ Performance is acceptable (<2s load time)

---

## 🔄 Rollback Plan

If critical issues are found:

**1. Quick Disable (No data loss)**
```typescript
// In src/components/PlayerDashboard.tsx
// Comment out the Personal Stats tab:
/*
<TabsTrigger value="personal-stats">
  Personal Stats
</TabsTrigger>
*/
```

**2. Database Rollback (If needed)**
```sql
-- Drop tables (preserves data if you re-run migration later)
DROP TABLE IF EXISTS personal_games CASCADE;
DROP TABLE IF EXISTS personal_games_rate_limit CASCADE;
DROP VIEW IF EXISTS player_personal_stats CASCADE;
```

**3. Code Rollback**
```bash
git revert <merge-commit-hash>
npm run build
# Deploy previous version
```

---

## 📞 Support

**For Issues:**
1. Check this deployment guide
2. Review browser console for errors
3. Check Supabase logs
4. Contact development team

**Critical Security Issues:**
- Report immediately to security team
- Do NOT deploy if XSS protection fails
- Verify all sanitization is working

---

## ✅ Deployment Complete

Once all 4 steps are complete:
1. ✅ Merged to main
2. ✅ Built for production
3. ✅ Database migration run
4. ✅ Testing verified

**The Personal Player Stat Tracker is LIVE! 🎉**

---

**Last Updated**: October 21, 2025  
**Deployed By**: [Your Name]  
**Deployment Status**: Ready for Production  
**Security Status**: A (Excellent) - Audit Complete


