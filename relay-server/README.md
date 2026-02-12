# StatJam Relay Server

WebRTC to RTMP relay server for broadcasting to YouTube/Twitch.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Ensure FFmpeg is installed:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm run build
npm start
```

## Environment Variables

- `PORT` - WebSocket server port (default: 8080)
- `SENTRY_DSN` - (optional) Sentry DSN for error tracking; when set, relay errors (FFmpeg, RTMP, WebSocket) are reported. Omit for no Sentry.

## Architecture

1. Browser sends WebRTC offer via WebSocket
2. Server creates WebRTC answer
3. Server receives video stream from browser
4. FFmpeg converts stream to RTMP
5. Stream is pushed to YouTube/Twitch

## TODO

- [ ] Implement MediaStream to Node.js stream conversion
- [ ] Add proper error handling
- [ ] Add connection health monitoring
- [ ] Add logging/metrics

