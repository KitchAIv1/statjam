# Live Streaming MVP - Testing Guide

This guide will help you test the live streaming feature end-to-end.

## Prerequisites

1. **Firebase Setup Complete**
   - Firebase project created
   - Realtime Database enabled
   - Configuration added to `.env.local`
   - See `FIREBASE_SETUP.md` for details

2. **Dependencies Installed**
   ```bash
   cd statjam
   npm install
   ```

3. **Development Server Running**
   ```bash
   npm run dev
   ```

4. **Live Game Available**
   - At least one game with status `live` or `in_progress` in database
   - Game has teams assigned with names

5. **HTTPS Required for iPhone**
   - iPhone requires HTTPS to access camera
   - Use ngrok or deploy to test on mobile: `ngrok http 3000`
   - Or test on same network using your computer's local IP with HTTPS

## Test Setup

### Option A: Local Testing (Desktop Only - for development)

1. Open two browser windows side by side
2. Left window: Dashboard viewer (`http://localhost:3000/dashboard?section=live-stream`)
3. Right window: Mobile camera (`http://localhost:3000/dashboard/mobile-camera`)
4. Follow testing steps below

### Option B: Real Device Testing (iPhone + Desktop)

1. **Setup HTTPS tunnel:**
   ```bash
   # Install ngrok if you haven't
   brew install ngrok
   
   # Create tunnel
   ngrok http 3000
   ```
   
2. **Note the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

3. **Open on Desktop:**
   - Navigate to `https://abc123.ngrok.io/dashboard?section=live-stream`

4. **Open on iPhone:**
   - Navigate to `https://abc123.ngrok.io/dashboard/mobile-camera`

## Testing Steps

### 1. Test Firebase Configuration

**Expected:** Both pages load without "Firebase Not Configured" error

**If Error:**
- Check `.env.local` has all Firebase variables
- Restart dev server: `npm run dev`
- Verify Firebase Realtime Database is enabled

---

### 2. Test Mobile Camera Access

**On Mobile Camera Page:**

1. Grant camera permissions when prompted
2. **Expected:** Camera preview shows on screen
3. **Expected:** Rear camera is active (environment facing)

**If No Camera:**
- Check browser permissions (Settings > Safari > Camera)
- Ensure HTTPS is being used
- Try different browser (Chrome, Safari)

---

### 3. Test Game Selection

**On Both Pages:**

1. Check game dropdown loads
2. **Expected:** See list of live games with team names and scores
3. Select the **same game** on both pages

**If No Games:**
- Verify games exist in database with status `live` or `in_progress`
- Check browser console for Supabase errors
- Verify team names are populated

---

### 4. Test WebRTC Connection

**After Selecting Game:**

1. **Mobile Camera:** Should show "Connecting..." then "Connected"
2. **Dashboard:** Should show "Connecting to camera..." then display video
3. **Expected:** Connection establishes within 5-10 seconds

**Connection Status Indicators:**
- 🟡 Yellow: Connecting
- 🟢 Green: Connected
- 🔴 Red: Error

**If Connection Fails:**
- Check browser console on both devices
- Verify same game ID selected on both
- Check Firebase Realtime Database rules allow read/write
- Try reconnecting using the Reconnect button
- Check network connectivity

---

### 5. Test Video Streaming

**On Dashboard:**

1. **Expected:** Live video from iPhone camera displays
2. **Expected:** Video is smooth (minimal lag <2 seconds)
3. **Expected:** Video fills the container properly
4. Move the iPhone camera around
5. **Expected:** Dashboard updates in real-time

**Video Quality Check:**
- Resolution should be clear (720p+)
- No excessive pixelation
- Smooth playback (not choppy)

**If Video Issues:**
- Check network speed (need >5 Mbps upload on mobile)
- Try on WiFi instead of cellular
- Check camera is not being used by another app

---

### 6. Test Score Overlay

**On Dashboard:**

1. **Expected:** Score overlay appears on top of video
2. **Expected:** Shows correct team names
3. **Expected:** Shows current scores (e.g., "10 - 8")
4. **Expected:** Shows current quarter

**Overlay Should Display:**
```
┌─────────────────────────────────────────┐
│  Home               10 - 8          Away │
│  Team B Name                  Team A Name│
│            Quarter 2                     │
└─────────────────────────────────────────┘
```

**If Overlay Missing:**
- Check that game has team_a_id and team_b_id
- Verify teams table has names
- Check browser console for errors

---

### 7. Test Real-Time Score Updates

**While Connected:**

1. Update game scores in database (manually or via stat tracker)
2. **Expected:** Overlay updates within 1-2 seconds
3. **Expected:** No page refresh needed

**How to Test:**
```sql
-- Update scores in Supabase SQL editor
UPDATE games 
SET home_score = 15, away_score = 12 
WHERE id = 'your-game-id';
```

**Expected Result:** Overlay immediately updates to "15 - 12"

**If No Update:**
- Check Supabase Realtime is enabled for `games` table
- Check browser console for subscription errors
- Verify network connection is stable

---

### 8. Test Connection Persistence

**Keep Stream Running:**

1. Let stream run for 5+ minutes
2. **Expected:** Connection stays active
3. **Expected:** No disconnections or freezing
4. Move between WiFi and cellular (on mobile)
5. **Expected:** Connection recovers or shows clear error

**If Disconnects:**
- Check network stability
- Review Firebase usage limits (100 concurrent connections on free tier)
- Check for JavaScript errors in console

---

### 9. Test Reconnection

**On Dashboard:**

1. Click "Reconnect" button
2. **Expected:** Connection reestablishes within 5 seconds
3. **Expected:** Video resumes
4. **Expected:** Scores still accurate

---

### 10. Test Multiple Games

**Switch Games:**

1. Select different game on mobile camera
2. Select same game on dashboard
3. **Expected:** Connection switches to new game
4. **Expected:** Scores update for new game
5. **Expected:** Video continues streaming

---

## Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Connection Time | < 5 seconds | < 10 seconds |
| Video Latency | < 2 seconds | < 5 seconds |
| Score Update Latency | < 1 second | < 3 seconds |
| Frame Rate | 30 fps | 20 fps |
| Connection Stability | 99%+ | 95%+ |

### Network Requirements

| Connection Type | Upload Speed | Expected Quality |
|----------------|--------------|------------------|
| WiFi (Good) | > 10 Mbps | Excellent |
| WiFi (Fair) | 5-10 Mbps | Good |
| 4G/LTE | > 5 Mbps | Good |
| 3G | < 5 Mbps | Poor (not recommended) |

---

## Troubleshooting Common Issues

### Issue: "Firebase Not Configured"

**Solution:**
1. Copy `.env.example` to `.env.local`
2. Add all Firebase variables
3. Restart dev server

### Issue: Camera Access Denied

**Solution:**
- iPhone Settings > Safari > Camera > Allow
- Use HTTPS (required for camera API)
- Try different browser

### Issue: No Video After Connection

**Solution:**
1. Check both devices selected same game
2. Verify camera preview works on mobile
3. Check browser console for WebRTC errors
4. Try reconnecting

### Issue: Scores Not Updating

**Solution:**
1. Check Supabase Realtime is enabled
2. Verify game has valid team IDs
3. Check browser console for subscription errors
4. Manually update scores to test

### Issue: Poor Video Quality

**Solution:**
- Connect to stronger WiFi
- Close other apps using bandwidth
- Reduce camera resolution (future feature)
- Check device performance

### Issue: Connection Drops Frequently

**Solution:**
- Use WiFi instead of cellular
- Check network stability
- Verify Firebase quota not exceeded
- Review browser console errors

---

## Test Checklist

Use this checklist to verify all features:

- [ ] Firebase configuration loads successfully
- [ ] Mobile camera accesses rear camera
- [ ] Camera preview displays on mobile
- [ ] Game list loads on both pages
- [ ] Can select game on mobile
- [ ] Can select game on dashboard
- [ ] WebRTC connection establishes
- [ ] Video streams from mobile to dashboard
- [ ] Video quality is acceptable
- [ ] Score overlay appears on dashboard
- [ ] Team names display correctly
- [ ] Scores display correctly
- [ ] Quarter number displays correctly
- [ ] Scores update in real-time when changed
- [ ] Connection status indicators work
- [ ] Reconnect button works
- [ ] Connection persists for 5+ minutes
- [ ] Can switch between games
- [ ] No console errors
- [ ] Performance meets benchmarks

---

## Success Criteria

The MVP is successful if:

1. ✅ Video streams from iPhone to dashboard
2. ✅ Score overlay is visible and readable
3. ✅ Scores update in real-time
4. ✅ Connection is stable for full game duration
5. ✅ Setup takes < 10 minutes
6. ✅ No critical errors in console

---

## Next Steps After Successful Test

Once all tests pass:

1. **Document Issues:** Note any bugs or UX issues for Phase 2
2. **Performance Metrics:** Record actual latency and quality
3. **User Feedback:** Get feedback from organizers
4. **Plan Phase 2:** Prioritize enhancements:
   - Camera controls (zoom, focus)
   - Dynamic overlay switching
   - QR code pairing
   - Recording functionality
   - Multiple camera support

---

## Getting Help

**Check Logs:**
- Browser console (F12)
- Firebase Realtime Database console
- Network tab for WebRTC traffic

**Debug Commands:**
```javascript
// In browser console:

// Check Firebase connection
firebase.database().ref('.info/connected').on('value', (snap) => {
  console.log('Firebase connected:', snap.val());
});

// Check WebRTC stats
// Available in browser's chrome://webrtc-internals/
```

**Common Log Messages:**

| Message | Meaning | Action |
|---------|---------|--------|
| "🚀 Initializing connection" | WebRTC starting | Wait for connection |
| "✅ Peer connected" | WebRTC established | Success! |
| "📹 Received remote stream" | Video available | Check video element |
| "📊 Score update received" | Realtime working | Scores should update |
| "❌ Peer error" | Connection failed | Check troubleshooting |

---

## Contact

For issues or questions:
- Check `FIREBASE_SETUP.md` for configuration help
- Review browser console for error details
- Test network connectivity
- Verify database has live games with proper team data

