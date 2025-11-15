# 🔍 Player Profile Data Discrepancy - Debug Guide

## Purpose
This guide helps verify the discrepancy between Player Dashboard and Player Profile Modal data before implementing fixes.

## How to Use

### Step 1: Open Browser Console
1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Clear the console (optional, but recommended)

### Step 2: Load Player Dashboard
1. Navigate to `/dashboard/player` (your own dashboard)
2. Look for console logs starting with:
   - `📊 Player Dashboard - DISPLAYED VALUES`
   - `🔍 Player Data Snapshot [DASHBOARD]`
   - `⚡ usePlayerDashboardData: Using cached dashboard data` OR `🔍 usePlayerDashboardData: Cache miss`
   - `⚡ PlayerDashboardService.getIdentity: Using cached data` OR `🔍 PlayerDashboardService.getIdentity: Fetching from database`

### Step 3: Open Player Profile Modal
1. Navigate to a tournament page (e.g., `/tournament/[id]`)
2. Go to the **Players** tab
3. Click on a player card (the same player from Step 2)
4. Look for console logs starting with:
   - `📊 Player Profile Modal - RAW DATA`
   - `📊 Player Profile Modal - DISPLAYED VALUES`
   - `🔍 Player Data Snapshot [MODAL]`
   - `🔍 PlayerDashboardService.getIdentity: Fetching from database` OR `⚡ PlayerDashboardService.getIdentity: Using cached data`

### Step 4: Check Comparison Log
After both snapshots are logged, you should see:
- `🔍 COMPARISON: Dashboard vs Modal`
- This will show:
  - ✅ **MATCH** - if values are the same
  - ⚠️ **DIFFERENCES** - if values differ (with exact differences listed)

## What to Look For

### Identity Data Differences
Check these fields in the comparison:
- **Name**: `"Red Jameson Jr."` vs what modal shows
- **Jersey Number**: `23` vs what modal shows
- **Position**: `"SG"` vs what modal shows
- **Height**: `"72\""` vs what modal shows
- **Weight**: `"220 lbs"` vs what modal shows
- **Age**: `46` vs what modal shows
- **Location**: `"🇨🇦 Canada"` vs what modal shows

### Season Averages Differences
Check these stats:
- **Points**: `4.9` vs what modal shows
- **Rebounds**: `0.2` vs what modal shows
- **Assists**: `0.6` vs what modal shows
- **FG%**: `92.9%` vs what modal shows
- **3PT%**: `95.8%` vs what modal shows
- **FT%**: `100%` vs what modal shows
- **MPG**: `11.9` vs what modal shows

### Career Highs Differences
Check these values:
- **Points**: Career high vs what modal shows
- **Rebounds**: Career high vs what modal shows
- **Assists**: Career high vs what modal shows

## Key Questions to Answer

### 1. Are both showing data for the same player ID?
- Check the console logs for `Player ID:` in both snapshots
- They should match exactly
- If different, that's the root cause

### 2. What data does the Player Profile Modal show vs the Dashboard?
- Look at the `🔍 COMPARISON` log
- It will list all differences automatically
- Note which fields differ

### 3. When was the profile last edited?
- Check if `currentPlayerData` in dashboard logs has unsaved changes
- If `currentPlayerData` differs from `data.identity`, there may be unsaved edits

### 4. Cache Status
- Check if dashboard used cache: `⚡ usePlayerDashboardData: Using cached dashboard data`
- Check if modal used cache: `⚡ PlayerDashboardService.getIdentity: Using cached data`
- Different cache keys or TTLs could cause stale data

## Expected Console Output Format

```
📊 Player Dashboard - DISPLAYED VALUES
  Name: Red Jameson Jr.
  Jersey: 23
  Position: SG
  Height: 72"
  Weight: 220 lbs
  Age: 46
  Location: 🇨🇦 Canada
  Season PTS: 4.9
  Season REB: 0.2
  Season AST: 0.6
  Season FG%: 92.9%
  Season 3PT%: 95.8%
  Season FT%: 100%
  Season MPG: 11.9
  Career PTS: [value]
  Career REB: [value]
  Career AST: [value]
  ---
  Raw data.identity: {...}
  Raw data.season: {...}
  Raw data.careerHighs: {...}
  currentPlayerData: {...}

🔍 Player Data Snapshot [DASHBOARD] - [playerId]
  Timestamp: [ISO timestamp]
  Identity: {...}
  Season Averages: {...}
  Career Highs: {...}

📊 Player Profile Modal - RAW DATA
  Player ID: [playerId]
  Identity: {...}
  Season Averages: {...}
  Career Highs: {...}

📊 Player Profile Modal - DISPLAYED VALUES
  Name: [value]
  Jersey: [value]
  Position: [value]
  Height: [value]
  Weight: [value]
  Age: [value]
  Location: [value]
  Season PTS: [value]
  Season REB: [value]
  Season AST: [value]
  Season FG%: [value]
  Season 3PT%: [value]
  Season FT%: [value]
  Season MPG: [value]
  Career PTS: [value]
  Career REB: [value]
  Career AST: [value]

🔍 Player Data Snapshot [MODAL] - [playerId]
  Timestamp: [ISO timestamp]
  Identity: {...}
  Season Averages: {...}
  Career Highs: {...}

🔍 COMPARISON: Dashboard vs Modal
  ⚠️ IDENTITY DIFFERENCES: [list of differences]
  ⚠️ SEASON AVERAGES DIFFERENCES: [list of differences]
  ⚠️ CAREER HIGHS DIFFERENCES: [list of differences]
  OR
  ✅✅✅ ALL DATA MATCHES ✅✅✅
```

## Next Steps

After collecting the console logs:
1. **Share the console output** - Copy/paste the comparison logs
2. **Note any differences** - The comparison tool will highlight them
3. **Check cache status** - Note which components used cached vs fresh data
4. **Verify player IDs match** - Ensure both are showing the same player

This will help us implement a 100% accurate fix.

