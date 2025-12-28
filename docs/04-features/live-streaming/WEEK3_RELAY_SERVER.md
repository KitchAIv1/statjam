# Week 3: Relay Server Implementation

## Overview

Implemented the relay server architecture for broadcasting composed video streams to YouTube/Twitch.

## Architecture

### Frontend Components

1. **BroadcastService** (`src/lib/services/broadcast/broadcastService.ts`)
   - Sends composed MediaStream to relay server via WebRTC
   - Manages WebSocket connection for signaling
   - Handles ICE candidate exchange
   - < 200 lines ✅

2. **useBroadcast Hook** (`src/hooks/useBroadcast.ts`)
   - React hook for managing broadcast state
   - Provides `start()` and `stop()` functions
   - < 100 lines ✅

3. **BroadcastControls Component** (`src/components/live-streaming/BroadcastControls.tsx`)
   - UI for selecting platform (YouTube/Twitch)
   - Stream key input
   - Connection status display
   - < 200 lines ✅

### Relay Server (Node.js)

Located in `relay-server/` directory:

1. **WebSocket Server** (`relay-server/src/index.ts`)
   - Receives WebRTC offers from browser
   - Manages WebSocket connections

2. **WebRTC Handler** (`relay-server/src/webrtcHandler.ts`)
   - Handles WebRTC peer connections
   - Creates answers for browser offers
   - < 200 lines ✅

3. **RTMP Converter** (`relay-server/src/rtmpConverter.ts`)
   - Converts WebRTC stream to RTMP using FFmpeg
   - Pushes to YouTube/Twitch
   - < 200 lines ✅

## Integration

The broadcast controls are integrated into the video composition test page:
- Appears when composition is active
- Allows entering YouTube/Twitch stream key
- Starts/stops broadcasting

## Setup Instructions

### Frontend
No additional setup needed - already integrated.

### Relay Server

1. Navigate to relay server:
```bash
cd relay-server
```

2. Install dependencies:
```bash
npm install
```

3. Install FFmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

4. Start server:
```bash
npm run dev  # Development
# or
npm run build && npm start  # Production
```

5. Set environment variable (optional):
```bash
export PORT=8080  # Default is 8080
```

## Usage Flow

1. Start video composition (webcam + overlay)
2. Enter YouTube/Twitch stream key in BroadcastControls
3. Click "Start Broadcast"
4. Browser sends WebRTC offer to relay server
5. Relay server creates answer and establishes connection
6. Relay server receives video stream
7. FFmpeg converts to RTMP and pushes to platform
8. Stream goes live on YouTube/Twitch

## TODO / Known Limitations

1. **MediaStream to Node.js Stream Conversion**
   - Currently placeholder - needs implementation
   - Requires additional WebRTC setup in Node.js

2. **Error Handling**
   - Add retry logic for failed connections
   - Better error messages for users

3. **Connection Health**
   - Monitor bitrate, dropped frames
   - Auto-reconnect on failures

4. **Testing**
   - End-to-end testing with actual YouTube/Twitch
   - Load testing for multiple concurrent streams

## File Structure

```
statjam/
├── src/
│   ├── lib/services/broadcast/
│   │   ├── types.ts
│   │   ├── broadcastService.ts
│   │   └── index.ts
│   ├── hooks/
│   │   └── useBroadcast.ts
│   └── components/live-streaming/
│       └── BroadcastControls.tsx
└── relay-server/
    ├── src/
    │   ├── index.ts
    │   ├── types.ts
    │   ├── webrtcHandler.ts
    │   └── rtmpConverter.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

## Compliance with .cursorrules

✅ All files under size limits:
- Services: < 200 lines
- Hooks: < 100 lines
- Components: < 200 lines
- Functions: < 40 lines

✅ Single responsibility principle
✅ Proper separation of concerns
✅ TypeScript types defined

