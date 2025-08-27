# Backend Instructions: Fix Supabase Real-Time Subscriptions

## 🚨 CRITICAL ISSUE IDENTIFIED

**Problem**: Live viewer scores are not updating in real-time because Supabase RLS policies are blocking real-time subscription events.

**Status**: 
- ✅ Frontend subscriptions are working (setup confirmed)
- ✅ Database queries work (manual refresh shows correct data)
- ❌ Real-time INSERT events are NOT being broadcast to subscribers

## 🔍 TECHNICAL DIAGNOSIS

### What's Working:
- Frontend successfully creates real-time subscriptions
- Database contains correct data (35-29 scores)
- Manual data fetching works perfectly
- Subscription callbacks are registered (2 callbacks confirmed)

### What's NOT Working:
- When a new stat is recorded in `game_stats` table
- No real-time INSERT event is broadcast to subscribers
- Frontend never receives the subscription callback
- Live viewer requires manual refresh to see new data

### Root Cause:
**Supabase Row Level Security (RLS) policies are preventing real-time events from being broadcast to authenticated users.**

## 🛠️ REQUIRED BACKEND FIXES

### 1. Check Real-Time Publication Settings

**Action Required**: Verify that the `game_stats` table is enabled for real-time publications.

**Steps**:
1. Go to Supabase Dashboard → Database → Replication
2. Ensure `game_stats` table is in the "Tables in publication" list
3. If not listed, add it to enable real-time events

### 2. Review RLS Policies on `game_stats` Table

**Action Required**: Ensure RLS policies allow authenticated users to receive real-time INSERT events.

**Current Issue**: RLS policies may be blocking real-time subscriptions even if they allow direct queries.

**What to Check**:
- Does the `game_stats` table have RLS enabled?
- Are there SELECT policies that allow authenticated users to read game stats?
- Do the policies work for both direct queries AND real-time subscriptions?

**Required Policy**: Authenticated users should be able to:
- SELECT from `game_stats` where they have access to the game
- Receive real-time notifications for INSERT events on games they can access

### 3. Verify Real-Time Security Settings

**Action Required**: Check if real-time subscriptions have additional security restrictions.

**What to Verify**:
- Are real-time subscriptions enabled for authenticated users?
- Are there any additional filters blocking INSERT events?
- Do the RLS policies apply correctly to real-time events (not just direct queries)?

### 4. Test Real-Time Events

**Action Required**: Test that real-time events are actually being published.

**How to Test**:
1. Open Supabase Dashboard → API → Real-time
2. Create a test subscription to `game_stats` table
3. Insert a test record manually
4. Verify that the INSERT event appears in the real-time logs

## 🎯 EXPECTED OUTCOME

After fixing the RLS policies, the frontend should receive these logs when a stat is recorded:

```
🔔 SubscriptionManager: New game_stats INSERT detected: [payload]
🔔 SubscriptionManager: Notifying 2 callbacks  
🔔 V2 Feed: Subscription callback received for table: game_stats
🔄 V2 Feed: Triggering fetchAll() for game_stats update
```

And the live viewer scores should update **instantly** without requiring a page refresh.

## 🔧 COMMON RLS REAL-TIME ISSUES & SOLUTIONS

### Issue 1: RLS Policies Too Restrictive
**Problem**: Policies work for queries but not real-time events
**Solution**: Ensure policies use functions/conditions that work in real-time context

### Issue 2: Missing Real-Time Publication
**Problem**: Table not enabled for real-time events
**Solution**: Add table to Supabase replication publication

### Issue 3: Authentication Context in Real-Time
**Problem**: Real-time events don't have same auth context as queries
**Solution**: Adjust policies to work with real-time authentication model

## 📋 VERIFICATION CHECKLIST

- [ ] `game_stats` table is in real-time publication
- [ ] RLS policies allow SELECT for authenticated users
- [ ] RLS policies work for real-time subscriptions (not just queries)
- [ ] Test INSERT event appears in Supabase real-time logs
- [ ] Frontend receives real-time callbacks when stat is recorded
- [ ] Live viewer updates instantly without refresh

## 🚨 PRIORITY

**HIGH PRIORITY** - This affects core user experience. Users expect real-time score updates during live games.

## 💡 TEMPORARY WORKAROUND

A 3-second polling fallback has been implemented in the frontend as a temporary measure, but this should be removed once real-time subscriptions are working properly.

---

**Contact**: Frontend team for testing coordination once backend changes are implemented.
