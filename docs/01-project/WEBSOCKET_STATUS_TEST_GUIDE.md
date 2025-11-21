# WebSocket Subscription Status - Test & Verification Guide

**Date**: November 21, 2025  
**Purpose**: Verify if WebSocket subscriptions are actually working or falling back to polling

---

## How to Test

### Step 1: Open Browser Console

1. Open StatJam in browser (www.statjam.net)
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Clear console logs

### Step 2: Navigate to Live Game Viewer

1. Find an active game (or create one)
2. Navigate to `/game-viewer/[gameId]` page
3. Watch console logs

### Step 3: Record a Stat

1. Open stat tracker in another tab/window (or have someone else record)
2. Record a stat (2PT made, 3PT, etc.)
3. Watch console logs in game viewer tab

---

## What Logs Indicate WebSocket IS Working ✅

### Initial Setup Logs (When Page Loads):

```
🔌 SubscriptionManager: Creating NBA-level hybrid subscription for game: [gameId]
🔌 HybridService: Setting up NBA-level subscription for game_stats-game_id=eq.[gameId]
🔌 HybridService: WebSocket status for game_stats-game_id=eq.[gameId]: SUBSCRIBED
✅ HybridService: WebSocket connected for game_stats-game_id=eq.[gameId]
```

### When Stat is Recorded (WebSocket Working):

```
🔔 HybridService: WebSocket event received for game_stats: {eventType: 'INSERT', new: {...}, ...}
🔔 SubscriptionManager: New game_stats detected: {...}
🔔 useGameViewerV2: Real-time update received: game_stats {...}
```

**Key Indicators**:
- ✅ Status shows "SUBSCRIBED" (not "CHANNEL_ERROR" or "TIMED_OUT")
- ✅ You see "🔔 WebSocket event received" when stat is recorded
- ✅ NO polling logs (no "🔄 HybridService: Polling detected changes")
- ✅ Update happens instantly (< 500ms) without manual refresh

---

## What Logs Indicate WebSocket is NOT Working ❌

### Initial Setup Logs (WebSocket Failing):

```
🔌 HybridService: WebSocket status for game_stats-game_id=eq.[gameId]: CHANNEL_ERROR
⚠️ HybridService: WebSocket failed for game_stats-game_id=eq.[gameId], status: CHANNEL_ERROR
🔄 HybridService: Switching to polling fallback for game_stats-game_id=eq.[gameId]
🔄 HybridService: Starting polling fallback for game_stats-game_id=eq.[gameId] (1000ms)
```

**OR**

```
🔌 HybridService: WebSocket status for game_stats-game_id=eq.[gameId]: TIMED_OUT
⚠️ HybridService: WebSocket failed for game_stats-game_id=eq.[gameId], status: TIMED_OUT
🔄 HybridService: Switching to polling fallback for game_stats-game_id=eq.[gameId]
```

### When Stat is Recorded (Polling Active):

```
🔄 HybridService: Polling detected changes in game_stats
🔔 HybridService: Polling detected changes in game_stats
🔔 SubscriptionManager: New game_stats detected: {...}
```

**Key Indicators**:
- ❌ Status shows "CHANNEL_ERROR" or "TIMED_OUT"
- ❌ You see "🔄 Switching to polling fallback"
- ❌ You see "🔄 Polling detected changes" (not "WebSocket event received")
- ❌ Updates happen every 1-3 seconds (polling interval), not instantly
- ❌ No "🔔 WebSocket event received" logs

---

## Test Scenarios

### Scenario 1: Test WebSocket Connection

**Steps**:
1. Open game viewer page
2. Check console for subscription status
3. Look for "SUBSCRIBED" vs "CHANNEL_ERROR" status

**Expected Logs if Working**:
```
🔌 HybridService: WebSocket status for game_stats-game_id=eq.xxx: SUBSCRIBED
✅ HybridService: WebSocket connected for game_stats-game_id=eq.xxx
```

**Expected Logs if NOT Working**:
```
🔌 HybridService: WebSocket status for game_stats-game_id=eq.xxx: CHANNEL_ERROR
⚠️ HybridService: WebSocket failed for game_stats-game_id=eq.xxx, status: CHANNEL_ERROR
🔄 HybridService: Switching to polling fallback
```

---

### Scenario 2: Test Real-Time Updates

**Steps**:
1. Open game viewer page (note current score/time)
2. Record a stat in stat tracker (another tab)
3. Watch game viewer console for update logs
4. Check if score updates instantly or after delay

**Expected Logs if WebSocket Working**:
```
🔔 HybridService: WebSocket event received for game_stats: {eventType: 'INSERT', ...}
🔔 SubscriptionManager: New game_stats detected: {...}
🔔 useGameViewerV2: Real-time update received: game_stats {...}
```

**Timing**: Update should appear within 100-500ms

**Expected Logs if Polling Active**:
```
🔄 HybridService: Polling detected changes in game_stats
🔔 HybridService: Polling detected changes in game_stats
```

**Timing**: Update appears after 1-3 second delay (polling interval)

---

### Scenario 3: Monitor Polling Activity

**Steps**:
1. Open game viewer page
2. Watch console for polling logs
3. Count how many polling queries occur

**If WebSocket Working**:
- NO polling logs should appear
- Only WebSocket event logs

**If Polling Active**:
- You'll see repeated polling logs every 1-3 seconds:
```
🔄 HybridService: Polling detected changes in game_stats
🔄 HybridService: Polling detected changes in game_stats
🔄 HybridService: Polling detected changes in game_stats
```

---

## Diagnostic Checklist

### Check 1: Subscription Status
- [ ] Look for "SUBSCRIBED" status in logs
- [ ] If "CHANNEL_ERROR" or "TIMED_OUT" → WebSocket NOT working
- [ ] If "SUBSCRIBED" → WebSocket connected (but may still not receive events)

### Check 2: Event Reception
- [ ] Record a stat while watching console
- [ ] Look for "🔔 WebSocket event received" log
- [ ] If present → WebSocket IS working
- [ ] If missing → WebSocket connected but events blocked

### Check 3: Polling Activity
- [ ] Check for "🔄 Polling detected changes" logs
- [ ] If present → Polling fallback is active
- [ ] If absent → Either WebSocket working OR no updates happening

### Check 4: Update Timing
- [ ] Record stat and time the update
- [ ] If < 500ms → Likely WebSocket
- [ ] If 1-3 seconds → Likely polling

---

## Common Log Patterns

### Pattern 1: WebSocket Working Perfectly ✅
```
🔌 HybridService: WebSocket status: SUBSCRIBED
✅ HybridService: WebSocket connected
[Stat recorded]
🔔 HybridService: WebSocket event received
🔔 SubscriptionManager: New game_stats detected
🔔 useGameViewerV2: Real-time update received
[UI updates instantly]
```

### Pattern 2: WebSocket Connected But Events Blocked ⚠️
```
🔌 HybridService: WebSocket status: SUBSCRIBED
✅ HybridService: WebSocket connected
[Stat recorded]
[NO event logs]
[After 1-3 seconds]
🔄 HybridService: Polling detected changes
[UI updates after delay]
```

### Pattern 3: WebSocket Failed, Polling Active ❌
```
🔌 HybridService: WebSocket status: CHANNEL_ERROR
⚠️ HybridService: WebSocket failed
🔄 HybridService: Switching to polling fallback
🔄 HybridService: Starting polling fallback (1000ms)
[Stat recorded]
[After 1-3 seconds]
🔄 HybridService: Polling detected changes
[UI updates after delay]
```

---

## What to Paste for Analysis

When testing, paste these specific log sections:

1. **Initial Subscription Setup** (first 10-20 lines when page loads)
2. **When Stat is Recorded** (logs that appear when you record a stat)
3. **Any Error Messages** (CHANNEL_ERROR, TIMED_OUT, etc.)
4. **Polling Logs** (if any appear)

**Example Format**:
```
=== INITIAL SETUP ===
[Paste subscription setup logs]

=== STAT RECORDED ===
[Paste logs when stat is recorded]

=== ERRORS ===
[Paste any error messages]
```

---

## Quick Test Command

**In Browser Console** (after page loads):
```javascript
// Check subscription status
console.log('Testing WebSocket status...');
// Then record a stat and watch for logs
```

---

## Expected Behavior Summary

### If WebSocket Working:
- ✅ Status: "SUBSCRIBED"
- ✅ Logs: "🔔 WebSocket event received" when stat recorded
- ✅ Timing: Updates within 100-500ms
- ✅ No polling logs

### If Polling Active:
- ⚠️ Status: "CHANNEL_ERROR" or "TIMED_OUT"
- ⚠️ Logs: "🔄 Polling detected changes" every 1-3 seconds
- ⚠️ Timing: Updates after 1-3 second delay
- ⚠️ No "WebSocket event received" logs

---

**Test Guide Created**: November 21, 2025  
**Next Step**: Run test and paste logs to verify actual status

