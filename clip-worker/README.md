# StatJam Clip Worker

Railway backend worker for the StatJam multi-clipping system. Handles FFmpeg-based video clip extraction and Bunny.net uploads.

## Features

- 🎬 Extract clips from source videos using FFmpeg
- 📤 Upload clips to Bunny.net Storage
- 🔄 Parallel processing (10 clips at a time)
- ♻️ Automatic retry on failure (3 attempts)
- 📊 Real-time progress tracking via Supabase

## Requirements

- Node.js 20+
- FFmpeg (installed in Docker container)
- Supabase project with multi-clipping schema
- Bunny.net Storage account

## Environment Variables

Create a `.env` file or configure in Railway dashboard:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key (full access)

# Bunny.net
BUNNY_STORAGE_API_KEY=your-storage-api-key
BUNNY_STORAGE_ZONE=statjam-videos
BUNNY_CDN_URL=https://statjam.b-cdn.net
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com

# App Configuration
NODE_ENV=production
PORT=3000
MAX_PARALLEL_CLIPS=10
CLIP_WINDOW_SECONDS=2
LOG_LEVEL=info
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Railway Deployment

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select this repository (or the `clip-worker` folder)

### Step 2: Configure Environment Variables

In Railway dashboard → Your Project → Variables:

1. Add all environment variables from `.env.example`
2. Get `SUPABASE_SERVICE_KEY` from Supabase Dashboard → Settings → API
3. Get `BUNNY_STORAGE_API_KEY` from Bunny.net Dashboard → Storage → API Key

### Step 3: Deploy

Railway auto-deploys on push to main branch. To trigger manually:

```bash
# Push to GitHub
git push origin main
```

### Step 4: (Optional) Configure Supabase Webhook

**Note:** The worker now includes automatic polling every 30 seconds for approved jobs.
Webhooks are optional but provide faster response times.

In Supabase Dashboard → Database → Webhooks:

1. Create new webhook
2. **Name:** `clip_generation_approved`
3. **Table:** `clip_generation_jobs`
4. **Events:** `UPDATE`
5. **Filter:** `status = 'approved'`
6. **URL:** `https://your-railway-url.railway.app/api/process-job`
7. **Method:** POST
8. **Body:** `{ "job_id": "{{id}}" }`

## API Endpoints

### Health Check
```
GET /api/health
```
Response:
```json
{
  "status": "ok",
  "ffmpeg": true,
  "timestamp": "2025-12-28T10:00:00.000Z",
  "version": "1.0.0"
}
```

### Process Job (Webhook)
```
POST /api/process-job
Body: { "job_id": "uuid" }
```
Response:
```json
{
  "status": "processing",
  "job_id": "uuid",
  "message": "Clip generation started"
}
```

### Retry Clip
```
POST /api/retry-clip
Body: { "clip_id": "uuid" }
```
Response:
```json
{
  "status": "success",
  "clip_id": "uuid",
  "message": "Clip generated successfully"
}
```

### Job Status
```
GET /api/job-status/:jobId
```
Response:
```json
{
  "status": "processing",
  "total_clips": 87,
  "completed_clips": 45,
  "failed_clips": 0,
  "error_message": null
}
```

## Clip Processing Flow

```
1. Supabase webhook triggers /api/process-job
2. Worker fetches job details from Supabase
3. Worker fetches clip-eligible stats for game
4. Creates pending clip records in generated_clips table
5. Processes clips in parallel batches (10 at a time):
   a. FFmpeg extracts clip from source video (±2s window)
   b. Encodes to 720p MP4
   c. Uploads to Bunny.net Storage
   d. Updates clip status in Supabase
6. Updates job status when complete
```

## Monitoring

### Railway Logs
View logs in Railway dashboard → Your Project → Logs

### Supabase Dashboard
Monitor job progress in:
- `clip_generation_jobs` table
- `generated_clips` table

## Troubleshooting

### FFmpeg Not Available
```
❌ FFmpeg is NOT available - clips will fail!
```
**Solution:** Ensure Dockerfile includes FFmpeg installation:
```dockerfile
RUN apk add --no-cache ffmpeg
```

### Bunny.net Upload Fails
```
❌ Upload failed: 403 Forbidden
```
**Solution:** Check `BUNNY_STORAGE_API_KEY` is correct and has write permissions.

### Clip Extraction Timeout
```
❌ Clip extraction failed: timeout
```
**Solution:** Source video may be too large or slow to download. Check Bunny.net CDN performance.

### Memory Issues
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
```
**Solution:** Increase Railway memory limit or reduce `MAX_PARALLEL_CLIPS`.

## Cost Estimation

| Games/Month | Clips | Processing Time | Railway Cost |
|-------------|-------|-----------------|--------------|
| 50 | ~4,000 | ~2 hours total | ~$5 |
| 200 | ~16,000 | ~8 hours total | ~$10 |
| 500 | ~40,000 | ~20 hours total | ~$20 |

*Based on average 80 clips/game, 30s/clip processing*

## License

Proprietary - StatJam Inc.

