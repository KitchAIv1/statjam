# Live Streaming Feature - MVP

Stream live games from iPhone camera to organizer dashboard with real-time score overlays.

## Overview

The live streaming feature allows tournament organizers to:
- Stream live video from an iPhone camera to their dashboard
- Display real-time score overlays on top of the video
- Connect multiple devices using WebRTC peer-to-peer technology
- Monitor game scores that update automatically during play

## Features

### ✅ Implemented (MVP)

1. **Mobile Camera Page** (`/dashboard/mobile-camera`)
   - Access iPhone rear camera
   - Select live game to stream
   - Real-time connection status
   - Camera preview with game info overlay

2. **Dashboard Viewer** (`/dashboard?section=live-stream`)
   - Receive video stream from mobile camera
   - Display live score overlay
   - Real-time score updates from database
   - Connection management controls

3. **Score Overlay**
   - Team names (Home vs Away)
   - Live scores
   - Current quarter
   - Auto-updates via Supabase Realtime

4. **WebRTC Connection**
   - Peer-to-peer video streaming
   - Firebase Realtime Database for signaling
   - Automatic connection management
   - Connection status indicators

### 🚧 Not Included (Future Enhancements)

- Camera controls (zoom, focus, exposure)
- Dynamic overlay switching (multiple stat views)
- QR code pairing
- Recording functionality
- Multiple camera support
- Advanced error recovery
- Stream quality controls

## Architecture

### Technology Stack

- **WebRTC**: Peer-to-peer video streaming (via Simple-Peer)
- **Firebase Realtime Database**: Signaling for WebRTC connection
- **Supabase Realtime**: Live score updates
- **Next.js**: React framework
- **TypeScript**: Type safety

### Data Flow

```
┌─────────────┐                    ┌──────────────┐
│   iPhone    │                    │  Dashboard   │
│   Camera    │                    │   Viewer     │
└─────────────┘                    └──────────────┘
       │                                  │
       │ 1. Select Game                   │ 1. Select Game
       │                                  │
       ▼                                  ▼
┌─────────────────────────────────────────────────┐
│         Firebase Realtime Database              │
│         (WebRTC Signaling)                      │
│  - Offer/Answer Exchange                        │
│  - ICE Candidate Exchange                       │
└─────────────────────────────────────────────────┘
       │                                  │
       │ 2. WebRTC Connection             │
       │◄─────────────────────────────────┤
       │                                  │
       │ 3. Video Stream (P2P)            │
       ├──────────────────────────────────►
       │                                  │
       │                                  │ 4. Fetch Scores
       │                                  ▼
       │                          ┌──────────────┐
       │                          │  Supabase    │
       │                          │  (Database)  │
       │                          └──────────────┘
       │                                  │
       │                                  │ 5. Score Updates
       │                                  │    (Realtime)
       │                                  ▼
       │                          Score Overlay
```

### Key Components

#### 1. Firebase Integration (`src/lib/firebase.ts`)
- Initialize Firebase app
- Configure Realtime Database
- Connection management

#### 2. WebRTC Service (`src/lib/services/webrtcService.ts`)
- Firebase signaling logic
- Room management (join/leave)
- Offer/Answer exchange
- ICE candidate handling

#### 3. WebRTC Hook (`src/hooks/useWebRTCStream.ts`)
- Simple-Peer integration
- Connection lifecycle management
- Stream state management
- Error handling

#### 4. Mobile Camera Page (`src/app/dashboard/mobile-camera/page.tsx`)
- Camera access (rear camera)
- Game selection
- WebRTC initiator (sends video)
- Connection status UI

#### 5. Dashboard Viewer (`src/components/OrganizerLiveStream.tsx`)
- Video receiver
- Score overlay component
- Real-time score subscription
- Connection controls

## Setup

### 1. Install Dependencies

```bash
cd statjam
npm install
```

Adds:
- `firebase` (^11.2.0)
- `simple-peer` (^9.11.1)
- `@types/simple-peer` (^9.11.8)

### 2. Configure Firebase

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

**Quick Setup:**
1. Create Firebase project at console.firebase.google.com
2. Enable Realtime Database
3. Add configuration to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test Locally

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test:**
1. Desktop: Open `http://localhost:3000/dashboard?section=live-stream`
2. Mobile (with HTTPS): Use ngrok or similar
3. Select same game on both devices
4. Video should stream with score overlay

## Usage

### For Organizers

1. **Setup (One Time)**
   - Ensure Firebase is configured
   - Have live game in system with teams

2. **Start Streaming**
   - Open dashboard: Navigate to "Live Stream" section
   - Open mobile page: Click "Open Mobile Camera" button
   - Select game on both devices
   - Position iPhone to capture game
   - Verify connection status shows "Connected"

3. **During Game**
   - Video streams automatically
   - Scores update in real-time as stats are recorded
   - Monitor connection status indicator

4. **End Streaming**
   - Simply close the mobile camera page
   - Dashboard will show "Disconnected"

### Connection Flow

```
Mobile Camera                          Dashboard Viewer
─────────────                          ────────────────
1. Open page                          1. Open Live Stream section
2. Grant camera permission            2. Select game
3. Select game                        3. Wait for connection
4. Auto-connect to Firebase           4. Receive video stream
5. Send video stream                  5. Display with overlay
```

## Firebase Database Structure

```
/rooms
  /{gameId}
    /offer
      sdp: "..."
      from: "mobile"
      timestamp: 1234567890
    /answer
      sdp: "..."
      from: "dashboard"
      timestamp: 1234567891
    /candidates
      /mobile
        /1234567892
          candidate: "..."
          timestamp: 1234567892
      /dashboard
        /1234567893
          candidate: "..."
          timestamp: 1234567893
    /status
      mobileConnected: true
      dashboardConnected: true
      lastActivity: 1234567894
```

## Performance

### Expected Metrics

- **Connection Time**: 3-5 seconds
- **Video Latency**: 1-2 seconds
- **Score Update Latency**: <1 second
- **Frame Rate**: 30 fps
- **Network Usage**: ~2-5 Mbps (video only)

### Network Requirements

- **Mobile Upload**: Minimum 5 Mbps (10+ Mbps recommended)
- **Desktop Download**: Minimum 5 Mbps
- **Latency**: <100ms recommended
- **Connection Type**: WiFi strongly recommended for mobile

### Browser Compatibility

| Browser | Mobile Camera | Dashboard Viewer |
|---------|--------------|------------------|
| Safari (iOS 14+) | ✅ Full support | ✅ Full support |
| Chrome (iOS) | ⚠️ Limited | ✅ Full support |
| Chrome (Desktop) | N/A | ✅ Full support |
| Firefox (Desktop) | N/A | ✅ Full support |
| Edge (Desktop) | N/A | ✅ Full support |

**Note**: iOS Safari is required for rear camera access.

## Cost Estimate

### Firebase (Free Tier - Spark Plan)

- **Storage**: 1 GB (signaling uses ~1 MB per session)
- **Bandwidth**: 10 GB/month (signaling uses ~5-10 MB per hour)
- **Connections**: 100 concurrent

**Estimated Monthly Cost**: $0 (well within free tier)

**Note**: Video data is peer-to-peer, NOT through Firebase.

### Scaling

For 50 concurrent games:
- Signaling: ~500 MB/day
- Bandwidth: ~250 MB/day
- **Still free tier eligible**

## Troubleshooting

### Common Issues

1. **"Firebase Not Configured"**
   - Add Firebase variables to `.env.local`
   - Restart dev server

2. **Camera Access Denied**
   - Use HTTPS (required for camera API)
   - Check browser permissions
   - iOS: Settings > Safari > Camera

3. **Connection Fails**
   - Verify both devices selected same game
   - Check Firebase database rules
   - Ensure network allows WebRTC (not blocked by firewall)

4. **No Score Overlay**
   - Verify game has team_a_id and team_b_id
   - Check teams exist in database
   - Enable Supabase Realtime

5. **Poor Video Quality**
   - Use WiFi instead of cellular
   - Check upload speed on mobile device
   - Reduce other network usage

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed troubleshooting.

## Security Considerations

### MVP (Current)

- ⚠️ Firebase Test Mode: Anyone can read/write
- ⚠️ No authentication on signaling
- ⚠️ Rooms don't auto-expire

### Production Recommendations

1. **Add Firebase Authentication**
   ```json
   {
     "rules": {
       "rooms": {
         "$gameId": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       }
     }
   }
   ```

2. **Implement Room Cleanup**
   - Auto-delete room data after 24 hours
   - Cloud Function to clean up old rooms

3. **Add Rate Limiting**
   - Prevent abuse of signaling channel
   - Limit connections per user

4. **Validate Signaling Data**
   - Sanitize all inputs
   - Verify offer/answer format

## Future Enhancements (Phase 2)

### Priority 1 - User Experience
- [ ] QR code pairing (no manual game selection)
- [ ] Camera controls (zoom, focus, exposure)
- [ ] Auto-reconnect on disconnect
- [ ] Better error messages

### Priority 2 - Features
- [ ] Multiple overlay templates
- [ ] Toggle overlay on/off
- [ ] Picture-in-picture support
- [ ] Recording to Supabase Storage
- [ ] Playback of recorded games

### Priority 3 - Advanced
- [ ] Multiple camera angles
- [ ] Switching between cameras
- [ ] Broadcast to YouTube/Twitch
- [ ] Lower latency (<500ms)
- [ ] Adaptive bitrate streaming

## Files Created/Modified

### New Files
```
statjam/src/lib/firebase.ts
statjam/src/lib/services/webrtcService.ts
statjam/src/hooks/useWebRTCStream.ts
statjam/src/app/dashboard/mobile-camera/page.tsx
statjam/docs/04-features/live-streaming/FIREBASE_SETUP.md
statjam/docs/04-features/live-streaming/TESTING_GUIDE.md
statjam/docs/04-features/live-streaming/README.md
```

### Modified Files
```
statjam/package.json (added firebase, simple-peer)
statjam/env.example (added Firebase variables)
statjam/src/components/OrganizerLiveStream.tsx (complete rewrite)
```

## Documentation

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase configuration guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive testing instructions
- **[README.md](./README.md)** - This file (overview and usage)

## Support

### Getting Help

1. **Configuration Issues**: See FIREBASE_SETUP.md
2. **Testing Issues**: See TESTING_GUIDE.md
3. **Browser Console**: Check for error messages (F12)
4. **Firebase Console**: Monitor Realtime Database activity
5. **Network Tab**: Check WebRTC traffic

### Debug Commands

```javascript
// Check Firebase connection
firebase.database().ref('.info/connected').on('value', (snap) => {
  console.log('Firebase connected:', snap.val());
});

// WebRTC internals (Chrome)
// Open: chrome://webrtc-internals/
```

## License

Part of STATJAM platform. See main project LICENSE.

## Changelog

### v1.0.0 (MVP) - 2025-10-30

**Added:**
- Mobile camera streaming page
- Dashboard video receiver
- Score overlay with real-time updates
- WebRTC peer-to-peer connection
- Firebase signaling service
- Connection status indicators
- Basic error handling
- Comprehensive documentation

**Technology:**
- Simple-Peer for WebRTC
- Firebase Realtime Database for signaling
- Supabase Realtime for score updates

**Known Limitations:**
- No camera controls
- Manual game selection required
- Basic reconnection logic
- Test mode Firebase security

