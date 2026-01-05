# StatJam Clip Worker Operations Guide

## Overview

The StatJam Clip Worker automatically generates highlight clips from tracked game videos. This guide covers setup, operations, troubleshooting, and monitoring.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Clip Generation Flow](#clip-generation-flow)
3. [Local Development Setup](#local-development-setup)
4. [Railway Deployment](#railway-deployment)
5. [Operations & Monitoring](#operations--monitoring)
6. [Troubleshooting](#troubleshooting)
7. [SQL Reference](#sql-reference)

---

## System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin QC Page  │────▶│  Supabase DB     │────▶│  Clip Worker    │
│  (Approve Job)  │     │  (Jobs Table)    │     │  (Railway/Local)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  FFmpeg         │
                                                 │  (Extract Clips)│
                                                 └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Bunny.net      │
                                                 │  (Store Clips)  │
                                                 └─────────────────┘
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Clip Worker** | `/statjam/clip-worker/` | Node.js server that processes clips |
| **Job Table** | `clip_generation_jobs` | Tracks job status and progress |
| **Clips Table** | `generated_clips` | Individual clip records with Bunny URLs |
| **Admin QC Page** | `/admin/qc-review/[gameId]` | Review stats and approve clipping |

---

## Clip Generation Flow

### Step 1: Video Tracking Complete
- Stat Admin finishes tracking stats with video timestamps
- Clicks "Submit for QC" → Creates job with status `pending`

### Step 2: Admin QC Review
- Admin reviews tracked stats at `/admin/qc-review/[gameId]`
- Clicks "Approve & Generate Clips" → Job status becomes `approved`

### Step 3: Clip Worker Processing
- Worker polls for `approved` jobs every 30 seconds (or webhook triggers)
- Creates `pending` clip records in `generated_clips` table
- Processes clips in parallel (10 at a time):
  1. FFmpeg extracts clip from source video (±2s window)
  2. Encodes to 720p MP4
  3. Uploads to Bunny.net Storage
  4. Updates clip status to `ready`

### Step 4: Completion
- When all clips are processed, job status → `completed`
- Clips are available in player dashboards and coach command center

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- FFmpeg installed (`brew install ffmpeg` on macOS)
- Supabase project with multi-clipping schema
- Bunny.net Storage account

### Setup Steps

```bash
# 1. Navigate to clip worker
cd /Users/willis/SJAM.v1/statjam/clip-worker

# 2. Install dependencies
npm install

# 3. Create .env file (copy from main statjam .env.local)
cat > .env << 'EOF'
# Supabase
SUPABASE_URL=https://xhunnsczjwfrwgjetff.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Bunny.net
BUNNY_STORAGE_API_KEY=your-bunny-storage-api-key
BUNNY_STORAGE_ZONE=statjam-videos
BUNNY_CDN_URL=https://statjam.b-cdn.net
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com

# App Configuration
NODE_ENV=development
PORT=3001
MAX_PARALLEL_CLIPS=10
CLIP_WINDOW_SECONDS=2
LOG_LEVEL=info
EOF

# 4. Build the worker
npm run build

# 5. Start the worker
npm start
```

### Verify Worker is Running

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","ffmpeg":true,"timestamp":"...","version":"1.0.0"}
```

### Manually Trigger a Job

```bash
# Trigger processing for a specific job
curl -X POST "http://localhost:3001/api/process-job" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "YOUR-JOB-UUID"}'
```

---

## Railway Deployment

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" → Sign up with GitHub
3. Verify your email

### Step 2: Create New Project

1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not already connected
4. Select the `statjam` repository
5. **Important:** Set the root directory to `clip-worker`

### Step 3: Configure Environment Variables

In Railway dashboard → Your Project → Variables, add:

```
SUPABASE_URL=https://xhunnsczjwfrwgjetff.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (get from Supabase Dashboard → Settings → API → service_role key)

BUNNY_STORAGE_API_KEY=your-bunny-storage-api-key
BUNNY_STORAGE_ZONE=statjam-videos
BUNNY_CDN_URL=https://statjam.b-cdn.net
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com

NODE_ENV=production
PORT=3000
MAX_PARALLEL_CLIPS=10
CLIP_WINDOW_SECONDS=2
LOG_LEVEL=info
```

### Step 4: Deploy

Railway auto-deploys on push to main. For manual deploy:
- Click "Deploy" in Railway dashboard, or
- Push to GitHub: `git push origin main`

### Step 5: Get Railway URL

After deployment:
1. Go to Railway dashboard → Your Project → Settings → Domains
2. Click "Generate Domain" to get a URL like `statjam-clip-worker.up.railway.app`

### Step 6: Configure StatJam

Add to your `.env.local` (or Vercel environment variables):

```
NEXT_PUBLIC_CLIP_WORKER_URL=https://your-railway-app.up.railway.app
```

Restart the dev server or redeploy to Vercel.

---

## Operations & Monitoring

### Check Job Status

```bash
# Via API (if worker is running)
curl "http://localhost:3001/api/job-status/JOB-UUID"

# Response:
# {"status":"processing","total_clips":115,"completed_clips":87,"failed_clips":0}
```

### Monitor in Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Open `clip_generation_jobs` table
3. Filter by `status` to see pending/processing/completed jobs

### Common Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Awaiting admin QC approval |
| `approved` | Approved, waiting for worker to pick up |
| `processing` | Clips are being generated |
| `completed` | All clips generated successfully |
| `failed` | Job failed (check `error_message`) |
| `cancelled` | Job was cancelled by admin |

---

## Troubleshooting

### Problem: Job Stuck at "processing"

**Symptom:** Job shows `processing` but `completed_clips` stopped increasing.

**Diagnosis:**
```sql
-- Check if all clips are actually ready
SELECT status, COUNT(*) as count
FROM generated_clips
WHERE job_id = 'YOUR-JOB-UUID'
GROUP BY status;
```

**If all clips show `ready`:** The job completion didn't trigger. Fix manually:
```sql
UPDATE clip_generation_jobs
SET 
  status = 'completed',
  completed_clips = (SELECT COUNT(*) FROM generated_clips WHERE job_id = 'YOUR-JOB-UUID' AND status = 'ready'),
  completed_at = NOW()
WHERE id = 'YOUR-JOB-UUID';
```

### Problem: Some Clips Failed

**Diagnosis:**
```sql
-- Find failed clips
SELECT id, stat_type, video_timestamp_start, error_message
FROM generated_clips
WHERE job_id = 'YOUR-JOB-UUID'
AND status = 'failed';
```

**Retry failed clips:**
```bash
curl -X POST "http://localhost:3001/api/retry-clip" \
  -H "Content-Type: application/json" \
  -d '{"clip_id": "CLIP-UUID"}'
```

### Problem: Worker Not Picking Up Jobs

**Check if worker is running:**
```bash
curl http://localhost:3001/api/health
```

**If not running, start it:**
```bash
cd /Users/willis/SJAM.v1/statjam/clip-worker
npm start
```

**Manually trigger the job:**
```bash
curl -X POST "http://localhost:3001/api/process-job" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "YOUR-JOB-UUID"}'
```

### Problem: FFmpeg Not Available

**Error:** `❌ FFmpeg is NOT available`

**Solution (macOS):**
```bash
brew install ffmpeg
```

**Solution (Linux/Docker):**
```dockerfile
RUN apk add --no-cache ffmpeg
```

---

## SQL Reference

### Find All Jobs for a Game

```sql
SELECT * FROM clip_generation_jobs
WHERE game_id = 'GAME-UUID'
ORDER BY created_at DESC;
```

### Get Job with Video Info

```sql
SELECT 
  cj.*,
  gv.bunny_video_id,
  g.opponent_name
FROM clip_generation_jobs cj
JOIN game_videos gv ON cj.video_id = gv.id
JOIN games g ON cj.game_id = g.id
WHERE cj.id = 'JOB-UUID';
```

### Count Clips by Status

```sql
SELECT status, COUNT(*) as count
FROM generated_clips
WHERE job_id = 'JOB-UUID'
GROUP BY status;
```

### Find Pending/Stuck Clips

```sql
SELECT id, stat_type, video_timestamp_start, status, error_message
FROM generated_clips
WHERE job_id = 'JOB-UUID'
AND status IN ('pending', 'processing')
ORDER BY video_timestamp_start;
```

### Manually Complete a Job

```sql
UPDATE clip_generation_jobs
SET 
  status = 'completed',
  completed_clips = (SELECT COUNT(*) FROM generated_clips WHERE job_id = 'JOB-UUID' AND status = 'ready'),
  failed_clips = (SELECT COUNT(*) FROM generated_clips WHERE job_id = 'JOB-UUID' AND status = 'failed'),
  completed_at = NOW()
WHERE id = 'JOB-UUID';
```

### Reset a Job for Retry

```sql
-- Reset job
UPDATE clip_generation_jobs
SET 
  status = 'approved',
  completed_clips = 0,
  failed_clips = 0,
  started_at = NULL,
  completed_at = NULL,
  error_message = NULL
WHERE id = 'JOB-UUID';

-- Reset clips
UPDATE generated_clips
SET status = 'pending', error_message = NULL
WHERE job_id = 'JOB-UUID';
```

### Delete All Clips and Job (Start Fresh)

```sql
-- Delete clips first (foreign key constraint)
DELETE FROM generated_clips WHERE job_id = 'JOB-UUID';

-- Delete job
DELETE FROM clip_generation_jobs WHERE id = 'JOB-UUID';
```

---

## Quick Reference Commands

### Start Local Worker
```bash
cd /Users/willis/SJAM.v1/statjam/clip-worker && npm start
```

### Check Job Status
```bash
curl "http://localhost:3001/api/job-status/JOB-UUID"
```

### Trigger Job Processing
```bash
curl -X POST "http://localhost:3001/api/process-job" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "JOB-UUID"}'
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

---

## Cost Estimation (Railway)

| Games/Month | Clips | Processing Time | Railway Cost |
|-------------|-------|-----------------|--------------|
| 50 | ~4,000 | ~2 hours total | ~$5 |
| 200 | ~16,000 | ~8 hours total | ~$10 |
| 500 | ~40,000 | ~20 hours total | ~$20 |

*Based on average 80 clips/game, 30s/clip processing*

---

## Support

For issues not covered here:
1. Check Railway logs: Dashboard → Your Project → Logs
2. Check Supabase logs: Dashboard → Logs
3. Review clip worker source: `/statjam/clip-worker/src/`

---

*Last Updated: January 5, 2026*

