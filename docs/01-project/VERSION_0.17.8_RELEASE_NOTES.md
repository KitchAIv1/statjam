# StatJam v0.17.8 Release Notes

**Release Date**: January 4, 2025  
**Version**: 0.17.8  
**Status**: ✅ **PRODUCTION READY**  
**Focus**: Video Upload Reliability + Status Synchronization Fixes

---

## 🎯 Executive Summary

Version 0.17.8 addresses critical video upload reliability issues and fixes video status synchronization between Bunny.net and the database. This release introduces a server-side webhook fallback system to ensure large file uploads are properly recorded, and fixes a bug where videos remained stuck in `processing` status even after Bunny.net completed encoding.

### Key Highlights

- ✅ **Bunny.net Webhook Fallback** - Server-side backup for video upload completion
- ✅ **Automatic Status Updates** - Database syncs when Bunny reports video ready
- ✅ **Large File Support** - Handles 13GB+ uploads that may fail client-side
- ✅ **Pipeline Visibility** - Videos now appear in Admin queue immediately after processing

---

## 🎬 Video Upload Reliability Improvements

### Problem Statement

**Issue 1: Large File Upload Failures**
- Videos uploaded successfully to Bunny.net (13GB+)
- Client-side callback (`handleUploadComplete`) failed due to:
  - Browser closure during long upload
  - Session expiration
  - Network interruptions
- Result: Video exists in Bunny.net but no database record created
- Impact: Video never appears in Admin pipeline, credits deducted but no tracking possible

**Issue 2: Stuck Processing Status**
- Videos uploaded and encoded by Bunny.net
- Client polls `/api/video/check-status` repeatedly
- Database status remains `processing` even when Bunny reports `ready`
- Result: Videos don't appear in Admin queue (filters for `status = 'ready'`)
- Impact: Videos invisible to admins, cannot be assigned for tracking

### Solution: Webhook Fallback + Automatic Status Updates

#### 1. Bunny.net Webhook Endpoint

**New Endpoint**: `/api/webhook/bunny`

**Features**:
- Receives POST requests from Bunny.net when video processing completes
- Extracts `gameId` and `userId` from video metadata
- Creates/updates `game_videos` record if missing
- Only processes when status = READY (4) or FAILED (5)
- Uses upsert logic to prevent duplicates

**Flow**:
```
Bunny.net completes encoding
  ↓
Webhook POST to /api/webhook/bunny
  ↓
Fetch video metadata (gameId, userId)
  ↓
Upsert game_videos record
  ↓
Status: ready, due_at set
```

**Configuration**:
- Webhook URL: `https://www.statjam.net/api/webhook/bunny`
- Configure in Bunny.net Dashboard → Stream → Library Settings → Webhooks
- Enable for: Video processing completed events

#### 2. Video Metadata Storage

**Enhancement**: Video creation now stores metadata in Bunny.net

**Metadata Stored**:
- `gameId` - Links video to game
- `userId` - Identifies uploader
- `libraryId` - Bunny library reference

**Usage**:
- Webhook extracts metadata to identify game/user
- Fallback parsing from video title if metadata missing
- Enables server-side record creation without client

#### 3. Automatic Status Updates

**Fix**: `/api/video/check-status` now updates database

**Previous Behavior**:
- Only polled Bunny.net
- Returned status to client
- Database never updated automatically

**New Behavior**:
- Polls Bunny.net for status
- **Automatically updates database** when status = READY
- Sets `due_at` timestamp (midnight EST next day)
- Updates `duration_seconds` from Bunny metadata
- Returns status to client

**Impact**:
- Videos appear in Admin pipeline immediately
- No manual intervention required
- Consistent status across all dashboards

---

## 🔧 Technical Implementation

### Files Created

**`src/app/api/webhook/bunny/route.ts`** (217 lines)
- Webhook endpoint handler
- Metadata extraction from Bunny video
- Database upsert logic
- Error handling and logging

### Files Modified

**`src/app/api/video/create-upload/route.ts`**
- Added `metaTags` to Bunny video creation
- Stores `gameId`, `userId`, `libraryId` in metadata

**`src/app/api/video/check-status/route.ts`**
- Added automatic database updates
- Updates `game_videos.status` when Bunny reports ready
- Sets `due_at` and `duration_seconds`
- Uses service role key to bypass RLS

---

## 📊 Impact & Verification

### Test Results

**Large File Upload (13GB)**:
- ✅ Uploaded successfully to Bunny.net
- ✅ Webhook created database record (fallback)
- ✅ Video appeared in Admin pipeline
- ✅ Credits correctly deducted

**Status Synchronization**:
- ✅ Videos stuck in `processing` now update to `ready`
- ✅ Admin pipeline shows videos immediately after Bunny encoding
- ✅ Status consistent across Coach, Admin, and Stat Admin dashboards

**Webhook Reliability**:
- ✅ Handles missing metadata gracefully
- ✅ Prevents duplicate records with upsert
- ✅ Logs all operations for debugging

---

## 🐛 Known Issues

### Game Completion Flow Bug (Identified, Not Fixed)

**Issue**: Games marked `completed` before clips are generated

**Current Flow**:
1. Stat Admin completes tracking → `game.status = 'completed'`
2. Awards modal saves Player of the Game
3. Coach/Organizer sees "Completed" game
4. **Problem**: Clips not yet generated
5. Admin approves clips → Clip worker generates
6. Clips ready → But game already marked completed

**Impact**: Users see "Completed" game with no clips available

**Fix Required**:
- Delay `game.status = 'completed'` until clip worker finishes
- Add intermediate status: `'clips_pending'`
- Only mark completed after all clips generated

**Status**: Investigation complete, fix pending implementation

---

## 📝 Migration & Setup

### Bunny.net Webhook Configuration

1. **Navigate to Bunny.net Dashboard**
   - Go to Stream → Your Library → Settings

2. **Add Webhook**
   - URL: `https://www.statjam.net/api/webhook/bunny`
   - Events: Video processing completed
   - Method: POST

3. **Verify Webhook**
   - Test with a small video upload
   - Check server logs for webhook receipt
   - Verify database record created

### No Database Migrations Required

All changes are code-only:
- New API endpoint (webhook)
- Enhanced existing endpoints (create-upload, check-status)
- No schema changes

---

## 🚀 Deployment Checklist

- [x] Code changes implemented
- [x] Webhook endpoint tested locally
- [x] Status update logic verified
- [x] Documentation updated
- [ ] Bunny.net webhook configured in production
- [ ] Production webhook URL verified
- [ ] Monitor webhook logs after deployment

---

## 📚 Related Documentation

- **Video Upload Flow**: `docs/04-features/video-tracking/VIDEO_UPLOAD_FLOW.md`
- **Bunny.net Integration**: `docs/05-database/BUNNY_NET_SETUP.md`
- **API Endpoints**: `docs/03-architecture/API_ROUTES.md`

---

## 🔄 Version History

- **v0.17.8** (2025-01-04) - Video upload reliability + status fixes
- **v0.17.7** (2025-01-01) - Stat Admin dashboard redesign
- **v0.17.6** (2024-12-31) - Critical stats accuracy fixes

---

**Next Release**: v0.17.9 (Planned)
- Game completion flow fix (delay until clips ready)
- Additional video upload reliability improvements


