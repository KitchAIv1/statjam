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
Apply three targeted migrations so demo games behave exactly like live assignments:
1. **`008_demo_game_stats_rls.sql`** – Allows stat admins to insert/delete demo game stats  
2. **`009_demo_stats_table_rls.sql`** – Allows aggregate `stats` table triggers to update for demo games  
3. **`010_demo_games_update_rls.sql`** – Allows stat admins to update demo game metadata (automation presets, etc.)

## Steps to Fix

### 1. Go to Supabase SQL Editor
Navigate to: **Supabase Dashboard > SQL Editor**

### 2. Run the Migrations (in order)
Run each migration separately to make auditing easy:
```
1) statjam/database/migrations/008_demo_game_stats_rls.sql
2) statjam/database/migrations/009_demo_stats_table_rls.sql
3) statjam/database/migrations/010_demo_games_update_rls.sql
```

### 3. Execute the SQL
Click **"Run"** after pasting each file. You should see:
```
=== DEMO GAME STATS RLS SETUP COMPLETE ===
=== DEMO STATS TABLE RLS SETUP COMPLETE ===
=== DEMO GAMES UPDATE RLS SETUP COMPLETE ===
```

### 4. Verify Success
After all three scripts run, confirm the following policies exist:
- `game_stats_stat_admin_insert` (FOR INSERT)
- `game_stats_stat_admin_manage` (FOR ALL)
- `stats_stat_admin_manage` (FOR ALL)
- `games_update_policy` (FOR UPDATE)

Each policy should now include the `OR ... is_demo = true` condition.

### 5. Test End-to-End
1. Go to your Stat Admin Dashboard
2. Click "Launch Tracker" on the demo game
3. Try recording a stat (e.g., 2PT shot)
4. Switch automation presets (Minimal/Balanced/Full) in Pre-Flight modal
5. Launch tracker and confirm no automation prompts appear in Minimal mode
6. Should work without 403 errors ✅

## What This Changes

### Policies Modified (STAT ADMIN ONLY):
1. **`game_stats_stat_admin_insert`** - INSERT policy for stat admins  
2. **`game_stats_stat_admin_manage`** - ALL operations policy for stat admins  
3. **`stats_stat_admin_manage`** - Aggregate stats management for demo games  
4. **`games_update_policy`** - Allows automation settings updates on demo games

### Policies NOT Modified (COACH - UNTOUCHED):
- ✅ `game_stats_coach_access` - Coach ALL operations (UNCHANGED)
- ✅ `game_stats_custom_player_coach_insert` - Coach custom player INSERT (UNCHANGED)
- ✅ `game_stats_custom_player_coach_read` - Coach custom player SELECT (UNCHANGED)
- ✅ All other SELECT policies (players, organizers, public) - (UNCHANGED)

### Behavior After Migration:
- **Demo games**: Any stat admin can track, aggregate, and configure demo games (NEW)
- **Regular games**: Only the assigned stat admin can update stats/automation (UNCHANGED)
- **Coach games**: Coaches can still track their own games (UNCHANGED)
- **No data pollution**: Demo games are flagged with `is_demo: true` and sorted separately

## Safety ✅
- This change is **safe** and **isolated** to STAT ADMIN policies only
- Coach tracker interface is completely separate and UNAFFECTED
- Regular game security is unchanged
- Demo games are already filtered and displayed separately in the UI
- No impact on player, organizer, or public read access

