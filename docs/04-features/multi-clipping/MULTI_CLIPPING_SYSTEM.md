# 🎬 Multi-Clipping System - Implementation Guide

**Date**: December 28, 2025  
**Status**: 🚧 In Development  
**Phase**: 1

---

## 📋 Overview

The multi-clipping system automatically generates individual highlight clips from video-tracked stats. After QC approval, the system extracts ±2 second clips around each eligible stat event and uploads them to Bunny.net for distribution.

---

## 🎯 Clip-Eligible Stats

Only these stat types generate clips:

| Stat Type | Generates Clip | Notes |
|-----------|----------------|-------|
| Made 2PT | ✅ Yes | Field goal + made |
| Made 3PT | ✅ Yes | Field goal + made |
| Made FT | ✅ Yes | Free throw + made |
| Rebound (OFF) | ✅ Yes | All rebounds |
| Rebound (DEF) | ✅ Yes | All rebounds |
| Assist | ✅ Yes | |
| Steal | ✅ Yes | |
| Block | ✅ Yes | |
| Missed Shot | ❌ No | Tracked for stats only |
| Turnover | ❌ No | |
| Foul | ❌ No | |

---

## 🔄 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. STAT TRACKING (Existing)                                │
├─────────────────────────────────────────────────────────────┤
│  Stat Admin tracks stats via Video Tracking Studio          │
│  Each stat has video_timestamp_ms stored                    │
│  Status: game_videos.assignment_status = 'in_progress'      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. SUBMIT FOR QC                                           │
├─────────────────────────────────────────────────────────────┤
│  Stat Admin clicks "Submit Stats for Review"                │
│  Creates clip_generation_job with status = 'pending'        │
│  System counts clip-eligible stats (total_clips)            │
│  Admin notified: "Game ready for QC review"                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. QC REVIEW (Admin)                                       │
├─────────────────────────────────────────────────────────────┤
│  Admin reviews stats timeline with video sync               │
│  Can edit/delete individual stats                           │
│  Timeline shows: "87 clips will be generated"               │
│  Options: [Approve & Generate] or [Request Corrections]     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. CLIP GENERATION (Railway Backend)                       │
├─────────────────────────────────────────────────────────────┤
│  Job status → 'approved' → 'processing'                     │
│  Backend fetches all clip-eligible stats                    │
│  For each stat (10 parallel):                               │
│    1. Calculate clip window (timestamp ±2s)                 │
│    2. FFmpeg extracts clip from source video                │
│    3. Encode to 720p MP4                                    │
│    4. Upload to Bunny.net /clips/game_id/player_id/         │
│    5. Update generated_clips record (status = 'ready')      │
│  Job status → 'completed'                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. DISTRIBUTION                                            │
├─────────────────────────────────────────────────────────────┤
│  COACHES (Free):                                            │
│    - See clips in play-by-play feed                         │
│    - Stream clips from dashboard                            │
│                                                              │
│  PLAYERS (Paid - $5.00):                                    │
│    - See "Highlights Available" on game                     │
│    - Preview clip before purchase                           │
│    - Purchase unlocks all personal clips                    │
│    - Stream or download                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/
├── app/
│   └── dashboard/
│       ├── admin/
│       │   ├── qc-review/
│       │   │   └── [gameId]/
│       │   │       └── page.tsx       # QC review page
│       │   └── clip-jobs/
│       │       └── page.tsx           # Clip generation dashboard
│       ├── coach/
│       │   └── game/
│       │       └── [gameId]/
│       │           └── clips/
│       │               └── page.tsx   # Coach clip viewer
│       └── player/
│           └── clips/
│               └── page.tsx           # Player clip purchase
│
├── components/
│   └── clips/
│       ├── QCReviewTimeline.tsx       # Timeline with video sync
│       ├── QCStatCard.tsx             # Individual stat review card
│       ├── ClipJobProgress.tsx        # Job progress display
│       ├── ClipGrid.tsx               # Grid of clip thumbnails
│       ├── ClipPlayer.tsx             # Video player for clips
│       ├── ClipPurchaseCard.tsx       # Purchase UI
│       └── ClipPreviewModal.tsx       # Preview before purchase
│
├── hooks/
│   ├── useClipGeneration.ts           # Clip job management
│   ├── useClipEligibility.ts          # Check which stats are eligible
│   └── usePlayerClips.ts              # Player's available clips
│
└── lib/
    └── services/
        └── clipService.ts             # Clip-related API calls

clip-worker/                           # Railway backend (separate repo)
├── Dockerfile
├── package.json
├── src/
│   ├── server.ts                      # Express server
│   ├── routes/
│   │   └── clips.ts                   # API routes
│   ├── services/
│   │   ├── clipGenerator.ts           # FFmpeg clip extraction
│   │   ├── bunnyUpload.ts             # Bunny.net upload
│   │   └── supabaseClient.ts          # Supabase connection
│   ├── jobs/
│   │   └── processClipJob.ts          # Job processor
│   └── utils/
│       └── logger.ts                  # Logging
├── railway.json
└── README.md
```

---

## 🗄️ Database Schema

### `clip_generation_jobs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| game_id | UUID | Reference to games |
| video_id | UUID | Reference to game_videos |
| status | TEXT | pending, approved, processing, completed, failed, cancelled |
| total_clips | INT | Total clip-eligible stats |
| completed_clips | INT | Successfully generated |
| failed_clips | INT | Failed generation |
| approved_at | TIMESTAMPTZ | When QC approved |
| approved_by | UUID | Admin who approved |
| error_message | TEXT | Error details if failed |

### `generated_clips`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | Reference to clip_generation_jobs |
| stat_event_id | UUID | Reference to game_stats |
| player_id | UUID | Regular player (nullable) |
| custom_player_id | UUID | Coach game player (nullable) |
| bunny_clip_url | TEXT | CDN URL for streaming |
| video_timestamp_start | DECIMAL | Clip start in video (seconds) |
| video_timestamp_end | DECIMAL | Clip end in video (seconds) |
| stat_type | TEXT | field_goal, rebound, assist, etc. |
| status | TEXT | pending, processing, ready, failed |

### `clip_purchases`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Purchasing user |
| game_id | UUID | Game being purchased |
| player_id | UUID | Which player's clips |
| amount_cents | INT | Price (500 = $5.00) |
| status | TEXT | pending, completed, failed, refunded |

---

## 🔌 API Endpoints

### Frontend → Supabase

```typescript
// Submit stats for QC review
POST /rest/v1/clip_generation_jobs
{ game_id, video_id, total_clips }

// Approve job (triggers webhook to Railway)
PATCH /rest/v1/clip_generation_jobs?id=eq.{jobId}
{ status: 'approved', approved_at: now(), approved_by: userId }

// Get job progress
GET /rest/v1/clip_generation_jobs?game_id=eq.{gameId}

// Get clips for a game
GET /rest/v1/generated_clips?game_id=eq.{gameId}&status=eq.ready
```

### Railway Backend

```typescript
// Webhook: Process approved job
POST /api/process-job
{ job_id: 'uuid' }
→ Fetches stats, generates clips, updates DB

// Health check
GET /api/health
→ { status: 'ok', ffmpeg: true }

// Manual retry
POST /api/retry-clip
{ clip_id: 'uuid' }
→ Retries single failed clip
```

---

## ⚙️ Railway Backend Configuration

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (service role key)

# Bunny.net
BUNNY_STORAGE_API_KEY=xxx
BUNNY_STORAGE_ZONE=statjam-videos
BUNNY_CDN_URL=https://statjam.b-cdn.net

# App
NODE_ENV=production
PORT=3000
MAX_PARALLEL_CLIPS=10
CLIP_WINDOW_SECONDS=2
```

### Dockerfile

```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["node", "src/server.js"]
```

---

## 📊 Progress Tracking

### Admin Dashboard View

```
┌─────────────────────────────────────────────────────────────┐
│  Clip Generation Jobs                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🟡 Lakers vs Warriors (Dec 28)                             │
│     Status: Processing                                       │
│     Progress: 67/87 clips (77%)                             │
│     ████████████████░░░░░                                   │
│     Est. completion: 3 minutes                              │
│                                                              │
│  ⏸ Lakers vs Heat (Dec 27)                                  │
│     Status: Awaiting QC Approval                            │
│     Stats: 95 tracked (78 clip-eligible)                    │
│     [Review & Approve]                                      │
│                                                              │
│  ✅ Lakers vs Celtics (Dec 26)                              │
│     Status: Complete                                         │
│     Clips: 102/102 ready                                    │
│     [View Clips] [Notify Players]                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 1 Deliverables

1. ✅ Database schema (migration 030)
2. 🔲 QC Review UI component
3. 🔲 Railway backend worker
4. 🔲 Admin clip job dashboard
5. 🔲 Coach clip viewer
6. 🔲 Player purchase UI (non-functional)

---

## 📈 Phase 2 Enhancements

- [ ] Manual clip time adjustment
- [ ] Stat-type specific clip windows
- [ ] Download clips as ZIP
- [ ] Social media formatting (9:16 vertical)
- [ ] Clip merging (highlight reel)
- [ ] AI-suggested clips

---

## 🔗 Related Documentation

- [Video Stat Tracking](../video-tracking/VIDEO_STAT_TRACKING.md)
- [Database Migrations](../../05-database/migrations/README.md)
- [Bunny.net Integration](../../03-infrastructure/BUNNY_NET.md)

---

**Last Updated**: December 28, 2025  
**Maintained By**: Development Team

