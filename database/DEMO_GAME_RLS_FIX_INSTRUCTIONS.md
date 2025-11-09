# Demo Game RLS Fix Instructions

## Issue
Stat admins are getting **403 errors** when trying to insert stats for demo games:
```
❌ GameServiceV3: Failed to record stat - HTTP 403: 
{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"game_stats\""}
```

## Root Cause
- Demo games don't have a `stat_admin_id` assigned (they're meant to be accessible to ALL stat admins)
- The existing RLS policy only allows stat admins to insert stats for games where `stat_admin_id = auth.uid()`
- This blocks ALL stat admins from inserting stats into demo games

## Solution
Update the `game_stats` RLS policy to allow stat admins to insert stats for:
1. **Assigned games**: `stat_admin_id = auth.uid()` (existing behavior)
2. **Demo games**: `is_demo = true` (new behavior - any stat admin can track demo games)

## Steps to Fix

### 1. Go to Supabase SQL Editor
Navigate to: **Supabase Dashboard > SQL Editor**

### 2. Run the Migration
Copy and paste the entire contents of:
```
statjam/database/migrations/008_demo_game_stats_rls.sql
```

### 3. Execute the SQL
Click **"Run"** to execute the migration

### 4. Verify Success
You should see:
```
=== DEMO GAME STATS RLS SETUP COMPLETE ===
```

And the policies list should show:
- `game_stats_stat_admin_insert` (FOR INSERT)
- `game_stats_stat_admin_all` (FOR ALL)

Both policies should now include the `OR g.is_demo = true` condition.

### 5. Test
1. Go to your Stat Admin Dashboard
2. Click "Launch Tracker" on the demo game
3. Try recording a stat (e.g., 2PT shot)
4. Should work without 403 errors ✅

## What This Changes

### Policies Modified (STAT ADMIN ONLY):
1. **`game_stats_stat_admin_insert`** - INSERT policy for stat admins
2. **`game_stats_stat_admin_manage`** - ALL operations policy for stat admins

### Policies NOT Modified (COACH - UNTOUCHED):
- ✅ `game_stats_coach_access` - Coach ALL operations (UNCHANGED)
- ✅ `game_stats_custom_player_coach_insert` - Coach custom player INSERT (UNCHANGED)
- ✅ `game_stats_custom_player_coach_read` - Coach custom player SELECT (UNCHANGED)
- ✅ All other SELECT policies (players, organizers, public) - (UNCHANGED)

### Behavior After Migration:
- **Demo games**: Any stat admin can track stats for demo games (NEW)
- **Regular games**: Only the assigned stat admin can track stats (UNCHANGED)
- **Coach games**: Coaches can still track their own games (UNCHANGED)
- **No data pollution**: Demo games are flagged with `is_demo: true` and sorted separately

## Safety ✅
- This change is **safe** and **isolated** to STAT ADMIN policies only
- Coach tracker interface is completely separate and UNAFFECTED
- Regular game security is unchanged
- Demo games are already filtered and displayed separately in the UI
- No impact on player, organizer, or public read access

