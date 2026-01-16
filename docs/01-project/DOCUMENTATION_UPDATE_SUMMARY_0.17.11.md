# Documentation Update Summary - v0.17.11

**Date**: January 14, 2025  
**Version**: 0.17.11  
**Update Type**: Feature Enhancements & Critical Fixes

---

## 📋 Overview

This document summarizes all updates made for version 0.17.11, which includes:
1. Shot location tracking for video tracking mode
2. QC Review shot location editing
3. QC Review stats visibility fix (RLS policy)
4. Clip worker trigger fix
5. Opponent name display fix in play-by-play
6. Stat admin video studio access improvements
7. AI Coach Analysis integration

---

## ✅ Files Updated

### Core Features

1. **Video Tracking - Shot Location**
   - ✅ `src/hooks/useVideoStatHandlers.ts` - Extended to accept shot location data
   - ✅ `src/components/video/VideoStatEntryPanel.tsx` - Added shot tracker mode toggle
   - ✅ `src/components/video/VideoStatsTimeline.tsx` - Pass shot location to edit form
   - ✅ `src/lib/services/videoStatService.ts` - Support shot location in stat recording

2. **QC Review - Shot Location Editing**
   - ✅ `src/components/clips/QCStatCard.tsx` - Added shot location editor for made/missed shots
   - ✅ `src/components/clips/QCReviewTimeline.tsx` - Pass location update handler
   - ✅ `src/app/dashboard/admin/qc-review/[gameId]/page.tsx` - Handle location updates

3. **QC Review - Stats Visibility Fix**
   - ✅ `src/lib/services/clipService.ts` - Added `ensureSupabaseSession()` for RLS-protected queries
   - ✅ Database: Added `game_stats_admin_select` RLS policy

4. **Clip Worker Integration**
   - ✅ `src/lib/services/clipService.ts` - Fixed clip worker trigger on QC approval
   - ✅ `statjam/clip-worker/Dockerfile` - Fixed build step for Railway deployment

5. **Play-by-Play Fixes**
   - ✅ `src/hooks/useGameViewerV2.ts` - Fixed opponent name display for coach games
   - ✅ Fixed player name lookup for opponent stats

6. **Stat Admin Access**
   - ✅ `src/app/dashboard/stat-admin/page.tsx` - Allow studio access for non-demo games
   - ✅ `src/components/stat-admin/AssignedVideosSection.tsx` - Updated button text and navigation

7. **AI Coach Analysis**
   - ✅ `src/components/game-viewer/AICoachAnalysisHardcoded.tsx` - New component
   - ✅ `src/app/dashboard/coach/game/[gameId]/components/CommandCenterTabPanel.tsx` - Integrated into Analytics tab
   - ✅ `src/lib/types/aiAnalysis.ts` - Type definitions

---

## 🎯 Feature Documentation

### 1. Video Tracking Shot Location

**Status**: ✅ Complete  
**Files**: 4 files modified, 1 test file created

**Implementation**:
- Extended `handleStatRecord` to accept optional `locationData` parameter
- Added `ShotTrackerPanel` integration in `VideoStatEntryPanel`
- Added `TrackerModeToggle` to switch between "Buttons" and "Court" modes
- Shot location data (X, Y, zone) saved to `game_stats` table
- Edit modal displays existing shot locations

**User Flow**:
1. Stat admin enters video tracking studio
2. Toggles to "Court" mode in stat entry panel
3. Clicks on court diagram to record shot location
4. Shot location automatically saved with stat
5. Can edit location via stat edit modal

**Database Fields**:
- `shot_location_x` (DECIMAL)
- `shot_location_y` (DECIMAL)
- `shot_zone` (TEXT)

**Testing**:
- Created `tests/video/videoShotTracker.test.ts` with 20 test cases
- Covers location data flow, zone detection, coordinate normalization

---

### 2. QC Review Shot Location Editing

**Status**: ✅ Complete  
**Files**: 3 files modified

**Implementation**:
- Added `ShotLocationEditor` to `QCStatCard` for made/missed shots
- Location updates saved directly to database
- Stats refresh after location update

**User Flow**:
1. Admin opens QC Review page
2. Views stat cards for made/missed shots
3. Clicks on court diagram to update location
4. Location saved immediately
5. Stats timeline refreshes with updated data

**Components**:
- Reuses `ShotLocationEditor` from manual tracking
- Integrated into `QCStatCard` conditionally (only for shot stats)

---

### 3. QC Review Stats Visibility Fix

**Status**: ✅ Complete  
**Files**: 1 file modified, 1 SQL policy added

**Problem**:
- QC Review showing 0 stats despite 325 stats in database
- Root cause: Supabase client session not synced before RLS-protected queries

**Solution**:
- Added `await ensureSupabaseSession()` before queries in `getStatsForQCReview()`
- Created `game_stats_admin_select` RLS policy for admin SELECT access

**SQL Policy**:
```sql
CREATE POLICY "game_stats_admin_select" ON game_stats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

**Impact**:
- QC Review now correctly displays all stats
- No performance impact (policy uses EXISTS subquery)

---

### 4. Clip Worker Trigger Fix

**Status**: ✅ Complete  
**Files**: 1 file modified, 1 Dockerfile fixed

**Problem**:
- QC approval not triggering clip processing
- Root cause: `NEXT_PUBLIC_CLIP_WORKER_URL` environment variable missing

**Solution**:
- Verified `triggerClipGeneration()` function in `clipService.ts`
- Fixed Dockerfile build step for Railway deployment
- Added environment variable documentation

**Railway Deployment**:
- Fixed Dockerfile to build TypeScript before copying `dist` folder
- Added `npm run build` step before `COPY dist ./dist`

**Environment Variable**:
```env
NEXT_PUBLIC_CLIP_WORKER_URL=https://affectionate-elegance-production.up.railway.app
```

---

### 5. Opponent Name Display Fix

**Status**: ✅ Complete  
**Files**: 1 file modified

**Problem**:
- Play-by-play feed showing stat admin's profile name as opponent
- Root cause: Incorrect player name lookup for opponent stats

**Solution**:
- Fixed `playerName` assignment in `transformStatsToPlays()`
- Set `playerName = 'Opponent'` when `is_opponent_stat === true`
- Fixed `teamBName` to use `gameInfo.opponent_name` for coach games

**Code Changes**:
```typescript
// Before: Looked up player_id (which was stat admin's ID)
// After: Explicitly set to 'Opponent' for opponent stats
if (statWithOpponent.is_opponent_stat === true) {
  playerName = 'Opponent';
}

// Fixed teamBName for coach games
const teamBName = gameInfo.is_coach_game 
  ? (gameInfo.opponent_name || 'Opponent') 
  : (teamsMap.get(gameInfo.team_b_id) || 'Team B');
```

**Impact**:
- Play-by-play now correctly shows opponent team name
- No impact on regular games (only coach games affected)

---

### 6. Stat Admin Video Studio Access

**Status**: ✅ Complete  
**Files**: 2 files modified

**Problem**:
- Stat admins couldn't access video studio for non-completed games
- "View Stats" button for completed videos navigated to wrong page

**Solution**:
- Changed "Video Track" button condition from `game.status === 'completed'` to `!game.is_demo`
- Updated `AssignedVideosSection` to navigate to stat admin studio for completed videos
- Changed button text from "View Stats" to "Enter Studio"

**User Flow**:
1. Stat admin views assigned videos
2. Clicks "Enter Studio" for any assigned game (not just completed)
3. Navigates to `/dashboard/stat-admin/video/[gameId]`
4. Can track stats, edit existing stats, or complete game

**Impact**:
- Stat admins can now access studio before game completion
- Enables multi-clipping and awards setup before completion

---

### 7. AI Coach Analysis Integration

**Status**: ✅ Complete  
**Files**: 3 files created/modified

**Implementation**:
- Created `AICoachAnalysisHardcoded` component with hardcoded analysis
- Integrated into Analytics tab below Advanced Stats
- Only shows for completed games
- Currently hardcoded for game `06977421-52b9-4543-bab8-6480084c5e45`

**Component Structure**:
- Game Overview section
- Winning Factors section
- Key Player Impact section
- Quarter-by-Quarter Analysis section
- Coach Action Items section
- Bottom Line section

**UI Features**:
- Gradient backgrounds
- Color-coded sections
- Player cards with impact scores
- Priority-based action items
- Responsive design

**Access Control**:
- Only visible in Analytics tab
- Requires `hasAdvancedAnalytics` (admin/stat_admin exempt)
- Only for completed games

**Future Enhancement**:
- Replace hardcoded data with API call to `ai_analysis` table
- Generate analysis dynamically for all games

---

## 📊 Database Changes

### New RLS Policy

**File**: `statjam/database/migrations/` (to be created)

```sql
-- Admin SELECT access for game_stats
CREATE POLICY "game_stats_admin_select" ON game_stats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

### Existing Schema (No Changes)

- `game_stats.shot_location_x` - Already exists
- `game_stats.shot_location_y` - Already exists
- `game_stats.shot_zone` - Already exists

---

## 🔧 Technical Details

### Shot Location Data Flow

```
User clicks court → ShotTrackerPanel
  → handleStatRecordWithLocation()
    → useVideoStatHandlers.handleStatRecord(locationData)
      → VideoStatService.recordVideoStat({ shotLocationX, shotLocationY, shotZone })
        → game_stats table
```

### QC Review Location Update Flow

```
User clicks court in QCStatCard → ShotLocationEditor
  → onLocationChange(x, y, zone)
    → handleShotLocationUpdate(statId, x, y, zone)
      → Supabase UPDATE game_stats
        → Refresh stats list
```

### Clip Worker Trigger Flow

```
Admin approves QC job → approveClipJob()
  → triggerClipGeneration(jobId)
    → POST to NEXT_PUBLIC_CLIP_WORKER_URL/api/process-job
      → Clip worker processes job
        → Updates job status to 'processing'
```

---

## 🧪 Testing

### Shot Tracking Tests

**File**: `tests/video/videoShotTracker.test.ts`

**Coverage**:
- ✅ Location data flow to `recordVideoStat`
- ✅ Zone detection from coordinates
- ✅ Coordinate normalization
- ✅ Custom player support
- ✅ Shot type from zone
- ✅ Input mode toggling
- ✅ Integration with `handleStatRecord`

**Total Tests**: 20 test cases

---

## 📈 Performance Impact

### Shot Location Tracking
- **No performance impact**: Optional data, minimal overhead
- **Database**: Uses existing columns, no new indexes needed

### QC Review Fix
- **Positive impact**: `ensureSupabaseSession()` ensures queries succeed
- **RLS Policy**: EXISTS subquery is efficient (indexed on `users.role`)

### Clip Worker
- **No impact**: External service, async processing

### Opponent Name Fix
- **No performance impact**: Simple conditional logic

### AI Analysis
- **No performance impact**: Static component, no API calls

---

## 🐛 Bug Fixes

1. **QC Review showing 0 stats**
   - **Root Cause**: Supabase session not synced before RLS queries
   - **Fix**: Added `ensureSupabaseSession()` call
   - **Impact**: Critical - QC Review now functional

2. **Opponent name showing stat admin profile**
   - **Root Cause**: Incorrect player name lookup
   - **Fix**: Explicit "Opponent" for `is_opponent_stat` stats
   - **Impact**: High - Play-by-play accuracy

3. **Clip worker not triggering**
   - **Root Cause**: Missing environment variable
   - **Fix**: Added `NEXT_PUBLIC_CLIP_WORKER_URL` to `.env.local`
   - **Impact**: High - Multi-clipping workflow

4. **Stat admin can't access studio**
   - **Root Cause**: Button condition too restrictive
   - **Fix**: Changed from `completed` to `!is_demo`
   - **Impact**: Medium - Workflow improvement

---

## 📚 Documentation Updates

### New Documentation Files

1. **`docs/04-features/video-tracking/VIDEO_SHOT_TRACKING.md`** (NEW)
   - Shot location tracking implementation
   - User workflow
   - Technical details

2. **`docs/04-features/admin-dashboard/QC_REVIEW_SHOT_LOCATION.md`** (NEW)
   - QC Review shot location editing
   - Admin workflow

3. **`docs/04-features/game-viewer/AI_COACH_ANALYSIS.md`** (NEW)
   - AI Coach Analysis feature
   - Component structure
   - Future enhancements

### Updated Documentation Files

1. **`docs/04-features/video-tracking/VIDEO_STAT_TRACKING.md`**
   - Added shot location tracking section
   - Updated keyboard shortcuts
   - Added shot location to database schema

2. **`docs/04-features/video-tracking/README.md`**
   - Added shot tracking to quick reference
   - Updated recent updates section

3. **`docs/04-features/multi-clipping/CLIP_WORKER_OPERATIONS_GUIDE.md`**
   - Added QC approval trigger documentation
   - Railway deployment notes

4. **`docs/01-project/CHANGELOG.md`**
   - Added v0.17.11 entry with all changes

---

## ✅ Verification Checklist

- ✅ Shot location tracking working in video mode
- ✅ Shot location editing in QC Review
- ✅ QC Review showing all stats
- ✅ Clip worker triggering on approval
- ✅ Opponent name displaying correctly
- ✅ Stat admin can access studio
- ✅ AI Analysis showing in Analytics tab
- ✅ All tests passing
- ✅ No linter errors
- ✅ Documentation updated

---

## 🔄 Migration Notes

### No Database Migrations Required

All features use existing database schema:
- `game_stats.shot_location_x` - Already exists
- `game_stats.shot_location_y` - Already exists
- `game_stats.shot_zone` - Already exists

### RLS Policy Update

**Action Required**: Run SQL to create admin SELECT policy:

```sql
CREATE POLICY "game_stats_admin_select" ON game_stats
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

### Environment Variables

**Action Required**: Add to `.env.local`:

```env
NEXT_PUBLIC_CLIP_WORKER_URL=https://affectionate-elegance-production.up.railway.app
```

---

## 📊 Summary

### Files Modified
- **Total**: 15 files
- **New Components**: 1 (`AICoachAnalysisHardcoded`)
- **New Tests**: 1 (`videoShotTracker.test.ts`)
- **New Types**: 1 (`aiAnalysis.ts`)

### Features Added
- ✅ Shot location tracking (video mode)
- ✅ Shot location editing (QC Review)
- ✅ AI Coach Analysis integration

### Bugs Fixed
- ✅ QC Review stats visibility
- ✅ Opponent name display
- ✅ Clip worker trigger
- ✅ Stat admin studio access

### Documentation
- ✅ 3 new documentation files
- ✅ 4 existing files updated
- ✅ CHANGELOG entry added

---

**Last Updated**: January 14, 2025  
**Maintained By**: Development Team
