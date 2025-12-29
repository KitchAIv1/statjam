# Cloudflare Stream Integration Guide

## Overview

Cloudflare Stream provides WebRTC ingest (browser-native) with automatic transcoding and global CDN delivery. This eliminates the need for a custom relay server.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CURRENT FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser ──WebRTC──> Relay Server ──RTMP──> YouTube/Twitch      │
│  (Canvas)           (needs wrtc)           (destination)         │
│                                                                  │
│  ❌ Problem: Relay server requires wrtc package                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     NEW FLOW (Cloudflare)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser ──WebRTC──> Cloudflare ──> Cloudflare CDN ──> Viewers  │
│  (Canvas)           (managed)       (global delivery)            │
│                                                                  │
│  ✅ No relay server needed                                       │
│  ✅ Auto-scaling                                                 │
│  ✅ Global CDN included                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Cloudflare Stream Features

| Feature | Description |
|---------|-------------|
| **WebRTC Ingest** | Direct browser-to-Cloudflare streaming |
| **WHIP Protocol** | WebRTC-HTTP Ingest Protocol (standard) |
| **Auto Transcoding** | Multiple quality levels generated |
| **Global CDN** | 300+ edge locations worldwide |
| **Low Latency** | LL-HLS for near-real-time playback |
| **Recording** | Optional automatic recording |

## Cost Estimate

| Metric | Cost |
|--------|------|
| Minutes delivered | $1.00 / 1,000 minutes |
| Minutes stored | $5.00 / 1,000 minutes |
| Encoding | Free (included) |

### Example: 100 games/month
- Average game: 2 hours = 120 minutes
- Average viewers: 50 per game
- Total delivery: 100 × 120 × 50 = 600,000 minutes
- **Monthly cost: ~$600**

### Example: 20 games/month (typical org)
- Total delivery: 20 × 120 × 30 = 72,000 minutes
- **Monthly cost: ~$72**

---

## Implementation Steps

### Phase 1: Cloudflare Account Setup (Backend Team)

1. **Create Cloudflare Account**
   - Go to: https://dash.cloudflare.com
   - Sign up or log in

2. **Enable Stream**
   - Navigate to: Stream → Overview
   - Enable Stream product

3. **Create API Token**
   - Go to: My Profile → API Tokens
   - Create token with Stream permissions:
     - `Stream:Edit`
     - `Stream:Read`

4. **Get Account ID**
   - Found in: Overview → Account ID (right sidebar)

5. **Add to Environment Variables**
   ```env
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

### Phase 2: Create Live Input (Backend Team)

Each live stream needs a "Live Input" in Cloudflare.

**API Call to Create Live Input:**

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{
    "meta": {
      "name": "Game: Team A vs Team B"
    },
    "recording": {
      "mode": "automatic"
    }
  }'
```

**Response includes:**
- `uid` - Live input ID
- `webRTC.url` - WebRTC ingest URL (WHIP endpoint)
- `rtmps.url` - RTMP fallback URL
- `playback.hls` - HLS playback URL for viewers

### Phase 3: Frontend Integration (Already Built)

The existing video composition system works as-is. We just need to:

1. Replace `BroadcastService` to use Cloudflare WHIP instead of custom relay
2. Send WebRTC offer to Cloudflare's WHIP endpoint
3. Display playback URL to viewers

### Phase 4: Database Schema (Backend Team)

Add to Supabase:

```sql
-- Store Cloudflare live input per game
ALTER TABLE games ADD COLUMN IF NOT EXISTS
  cloudflare_live_input_id TEXT,
  cloudflare_playback_url TEXT,
  is_streaming BOOLEAN DEFAULT false;
```

### Phase 5: Viewer Playback

Viewers watch via HLS URL:
```
https://customer-{code}.cloudflarestream.com/{video_id}/manifest/video.m3u8
```

Use any HLS player:
- video.js
- hls.js
- Native Safari/iOS

---

## Frontend Changes Required

### 1. New Broadcast Service (Cloudflare WHIP)

Replace the current `broadcastService.ts` with Cloudflare WHIP client:

```typescript
// Simplified flow:
// 1. Get WHIP URL from backend (per game)
// 2. Create RTCPeerConnection
// 3. Add composed MediaStream tracks
// 4. Send SDP offer to WHIP endpoint
// 5. Receive SDP answer
// 6. Stream is live!
```

### 2. API Endpoint Needed (Backend Team)

Create API endpoint that:
1. Creates Cloudflare Live Input for a game
2. Returns WHIP URL to frontend
3. Stores playback URL in database

```
POST /api/stream/start
Body: { gameId: string }
Response: { whipUrl: string, playbackUrl: string }
```

### 3. Viewer Component

```typescript
// Use hls.js or video.js to play the stream
<video src={playbackUrl} />
```

---

## Migration Path

| Step | Owner | Timeline | Status |
|------|-------|----------|--------|
| 1. Cloudflare account setup | Backend | Day 1 | ⬜ |
| 2. API token creation | Backend | Day 1 | ⬜ |
| 3. Create stream API endpoint | Backend | Day 2-3 | ⬜ |
| 4. Database schema update | Backend | Day 2 | ⬜ |
| 5. WHIP client implementation | Frontend | Day 3-4 | ⬜ |
| 6. Viewer playback component | Frontend | Day 4-5 | ⬜ |
| 7. Testing | Both | Day 5-6 | ⬜ |

---

## Files to Modify

### Frontend (Already exists, needs update)

| File | Change |
|------|--------|
| `src/lib/services/broadcast/broadcastService.ts` | Replace WebSocket with WHIP |
| `src/hooks/useBroadcast.ts` | Update to use new service |
| `src/components/live-streaming/BroadcastControls.tsx` | Remove stream key input |

### Frontend (New)

| File | Purpose |
|------|---------|
| `src/lib/services/cloudflare/whipClient.ts` | WHIP protocol client |
| `src/components/live-streaming/LiveStreamPlayer.tsx` | HLS viewer component |

### Backend (Team to implement)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/stream/start` | Create Cloudflare live input |
| `POST /api/stream/stop` | End stream, save recording |
| `GET /api/stream/[gameId]` | Get playback URL |

---

## Testing Checklist

- [ ] Cloudflare account created
- [ ] API token works
- [ ] Can create live input via API
- [ ] Browser can connect via WHIP
- [ ] Stream appears in Cloudflare dashboard
- [ ] HLS playback works
- [ ] Stream stops cleanly
- [ ] Recording is saved (if enabled)

---

## Resources

- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [WHIP Protocol](https://developers.cloudflare.com/stream/webrtc-beta/)
- [Stream API Reference](https://developers.cloudflare.com/api/operations/stream-live-inputs-list-live-inputs)
- [hls.js Player](https://github.com/video-dev/hls.js/)

---

## Questions for Backend Team

1. **Cloudflare Account**: Will you create a new account or use existing?
2. **API Keys**: Where will credentials be stored? (Supabase secrets?)
3. **Recording**: Do you want automatic recording of all streams?
4. **Billing**: Who handles Cloudflare billing?

---

## Next Steps

1. **Backend Team**: Set up Cloudflare account and create API token
2. **Backend Team**: Create `/api/stream/start` endpoint
3. **Frontend**: Implement WHIP client once endpoint is ready
4. **Test**: End-to-end stream test

**Ready to proceed when backend confirms Cloudflare setup is complete.**

