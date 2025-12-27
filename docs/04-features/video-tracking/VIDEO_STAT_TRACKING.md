# 🎥 Video Stat Tracking - Feature Documentation

**Date**: December 27, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 Overview

The Video Stat Tracking system enables stat admins to record basketball statistics by reviewing game video footage. The system synchronizes video playback with the game clock, allowing precise timestamp-based stat recording that matches the live game tracking workflow.

### Key Features

- **Video Upload & Processing**: Upload game videos up to 40GB (MP4/MOV) via Bunny.net Stream
- **Clock Synchronization**: Sync video playback with game clock using jumpball timestamp
- **Keyboard-Driven Workflow**: Full keyboard shortcuts for video controls and stat entry
- **Real-Time Stat Recording**: Record stats with precise video timestamps
- **Auto-Sequences**: Automated prompts for assists, rebounds, turnovers, and fouls
- **Stats Timeline**: Visual timeline of recorded stats with edit/delete functionality
- **Coach Game Support**: Full support for coach-made games with custom players and opponent stats

---

## 🎯 User Workflows

### Stat Admin Workflow

1. **Access Video Tracking Studio**
   - Navigate to Stat Admin Dashboard
   - Click "Assigned Videos" section
   - Select a video from the assigned list
   - Opens Video Tracking Studio (`/dashboard/stat-admin/video/[gameId]`)

2. **Upload Video** (if not already uploaded)
   - Click "Upload Game Video"
   - Select MP4 or MOV file (up to 40GB)
   - Wait for Bunny.net processing (1-5 minutes)
   - Video status updates automatically

3. **Sync Game Clock**
   - Click "Sync Clock" button
   - Jumpball Sync Modal opens
   - Enter jumpball time (MM:SS) from video
   - Enter quarter length (default: 10 minutes)
   - Click "Save Sync"
   - System calculates game clock for any video position

4. **Track Stats**
   - Select player using number keys (1-5 for Team A, 6-0 for Team B)
   - Press stat shortcut keys (P for made shot, M for missed, etc.)
   - System records stat with current video timestamp
   - Auto-sequences trigger (assist prompts, rebound prompts, etc.)
   - Stats appear in timeline below video

5. **Review & Edit Stats**
   - Click "Edit Stats" button to open full edit modal
   - Click "Edit" on any stat in timeline for quick edit
   - Click "Delete" on any stat to remove it
   - Use "Sync Stats" button to backfill timestamps for existing stats

### Coach Workflow (Video Upload Only)

1. **Access Video Tracking**
   - Navigate to Coach Dashboard
   - Click "Video Track" button on team card (premium feature)
   - Select team from dropdown
   - View game list or create new game

2. **Create New Game**
   - Click "Create a new game"
   - Enter opponent name
   - Game is created and redirects to video setup

3. **Setup Game Details**
   - Enter final scores (home/away)
   - Review/edit player jersey numbers
   - Click "Save & Continue"

4. **Upload Video**
   - Click "Upload Video"
   - Select MP4 or MOV file (up to 40GB)
   - Video uploads to Bunny.net
   - Status shows "Processing" then "Uploaded"
   - 24-hour countdown timer for stat admin delivery

5. **Track Assignment Status**
   - View video status card in game list
   - Status badges: "In Queue", "Assigned", "In Progress", "Completed"
   - See assigned stat admin name (when assigned)
   - See time remaining until delivery

---

## 🏗️ Architecture

### Component Structure

```
src/
├── app/
│   └── dashboard/
│       ├── stat-admin/
│       │   └── video/
│       │       └── [gameId]/
│       │           └── page.tsx          # Main video tracker page
│       └── coach/
│           └── video/
│               ├── video-select/
│               │   └── page.tsx          # Coach video game selection
│               └── [gameId]/
│                   └── page.tsx          # Coach video upload page
│
├── components/
│   └── video/
│       ├── VideoPlayer.tsx               # HTML5 video player component
│       ├── VideoUploader.tsx             # Bunny.net upload component
│       ├── JumpballSyncModal.tsx         # Clock sync modal
│       ├── DualClockDisplay.tsx          # Video + game clock display
│       ├── VideoStatEntryPanel.tsx      # Stat entry UI (roster + buttons)
│       ├── VideoStatButtons.tsx         # Stat entry buttons
│       ├── VideoPlayerRoster.tsx        # Player selection roster
│       ├── VideoStatsTimeline.tsx        # Stats timeline with edit/delete
│       ├── VideoInlinePrompt.tsx        # Non-blocking assist/rebound prompts
│       ├── VideoTurnoverTypePrompt.tsx   # Turnover type selection
│       ├── VideoFoulTypePrompt.tsx       # Foul type selection
│       ├── VideoSetupPanel.tsx           # Coach game setup (scores, jerseys)
│       ├── VideoProcessingStatus.tsx    # Video processing UI
│       └── CoachVideoStatusCard.tsx      # Coach video status display
│
├── hooks/
│   ├── useVideoPlayer.ts                 # Video playback state/controls
│   ├── useVideoClockSync.ts              # Clock sync calculations
│   ├── useKeyboardShortcuts.ts           # Keyboard shortcut handlers
│   ├── useVideoProcessingStatus.ts       # Bunny.net status polling
│   ├── useVideoStatTracker.ts            # Video tracking state management
│   └── useVideoStatPrompts.ts            # Auto-sequence prompt logic
│
└── lib/
    ├── services/
    │   ├── videoStatService.ts           # Video stat database operations
    │   ├── videoAssignmentService.ts     # Video assignment workflow
    │   └── bunnyUploadService.ts         # Bunny.net API integration
    └── types/
        └── video.ts                      # Video-related TypeScript types
```

### Data Flow

```
1. Video Upload
   Coach/Stat Admin → VideoUploader → Bunny.net Stream API
   → game_videos table (status: 'processing')

2. Video Processing
   Bunny.net transcodes video → Status polling (15s interval)
   → game_videos.status = 'ready'

3. Clock Synchronization
   Stat Admin enters jumpball time → JumpballSyncModal
   → video_clock_sync table (jumpball_timestamp_ms, quarter_length_minutes)
   → Clock sync config stored

4. Stat Recording
   Stat Admin selects player + presses shortcut
   → VideoStatEntryPanel.handleStatRecord()
   → videoStatService.recordVideoStat()
   → game_stats table (with video_timestamp_ms)
   → Timeline refreshes

5. Auto-Sequences
   Made shot → Assist prompt
   Missed shot → Rebound prompt
   Steal → Turnover prompt
   Block → Rebound prompt
   Turnover key → Type selection prompt
   Foul key → Foul type selection prompt
```

---

## 🎮 Coach Game Support

### Overview

Video tracking fully supports coach-made games, which have different data structures than organizer games:

- **Team B**: Virtual "Opponent (System)" team with no actual players
- **Custom Players**: Coach games heavily rely on `custom_players` table
- **Opponent Stats**: Tracked using `is_opponent_stat = true` flag

### Implementation Details

#### Player Loading

**Regular Games**:
```typescript
// Uses TeamService.getTeamPlayers() for both teams
const [playersA, playersB] = await Promise.all([
  TeamService.getTeamPlayers(game.team_a_id),
  TeamService.getTeamPlayers(game.team_b_id),
]);
```

**Coach Games**:
```typescript
// Uses CoachPlayerService.getCoachTeamPlayers() for Team A
// Team B is empty (virtual opponent team)
const customPlayers = await CoachPlayerService.getCoachTeamPlayers(game.team_a_id);
setTeamAPlayers(customPlayers.map(p => ({
  id: p.id,
  name: p.name,
  jerseyNumber: p.jersey_number,
  is_custom_player: true,
})));
setTeamBPlayers([]); // No Team B players
```

#### Stat Recording

**Regular Games**:
```typescript
await VideoStatService.recordVideoStat({
  gameId,
  playerId: selectedPlayer, // UUID from users table
  teamId: gameData.team_a_id,
  statType: 'field_goal',
  modifier: 'made',
  // ...
});
```

**Coach Games - Custom Player**:
```typescript
await VideoStatService.recordVideoStat({
  gameId,
  customPlayerId: selectedPlayer, // UUID from custom_players table
  teamId: gameData.team_a_id,
  statType: 'field_goal',
  modifier: 'made',
  // ...
});
```

**Coach Games - Opponent Stat**:
```typescript
await VideoStatService.recordVideoStat({
  gameId,
  playerId: userId, // Coach's user ID as proxy
  isOpponentStat: true, // Flag for opponent stat
  teamId: gameData.team_a_id, // Coach's team UUID (required for DB)
  statType: 'field_goal',
  modifier: 'made',
  // ...
});
```

#### UI Adaptation

**VideoPlayerRoster**:
- **Regular Mode**: Shows Team A and Team B player rosters
- **Coach Mode**: Shows Team A players + "Opponent Team" button (key `0`)

**VideoStatEntryPanel**:
- Detects coach mode via `isCoachMode` prop
- Handles `OPPONENT_TEAM_ID = 'opponent-team'` selection
- Passes `customPlayerId` and `isOpponentStat` to service layer

**VideoStatsTimeline**:
- Displays opponent stats correctly using `is_opponent_stat` flag
- Shows opponent name instead of Team B name in coach mode

### Detection Logic

```typescript
// In stat-admin video page
const gameAny = game as any;
const isCoach = gameAny.is_coach_game === true || !!gameAny.opponent_name;

// Pass to components
<VideoStatEntryPanel
  isCoachMode={isCoach}
  userId={user?.id}
  opponentName={opponentName}
  preloadedTeamAPlayers={teamAPlayers}
  preloadedGameData={gameData}
/>
```

---

## ⌨️ Keyboard Shortcuts

### Video Controls

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Rewind/Forward 10 seconds |
| `Shift + ←` / `Shift + →` | Rewind/Forward 1 second |
| `,` / `.` | Previous/Next frame |
| `[` / `]` | 0.5x / 1x / 2x playback speed |

### Player Selection

| Key | Action |
|-----|--------|
| `1-5` | Select Team A players (1-5) |
| `6-0` | Select Team B players (6-0) |
| `0` (Coach Mode) | Select Opponent Team |

### Stat Entry

| Key | Action |
|-----|--------|
| `P` | 2PT Made |
| `Shift + P` | 3PT Made |
| `M` | 2PT Missed |
| `Shift + M` | 3PT Missed |
| `G` | Free Throw Made |
| `Shift + G` | Free Throw Missed |
| `R` | Rebound |
| `A` | Assist |
| `S` | Steal |
| `B` | Block |
| `T` | Turnover (shows type prompt) |
| `F` | Foul (shows type prompt) |
| `Ctrl + Z` | Undo last stat |

### Prompt Navigation

| Key | Action |
|-----|--------|
| `1-9` | Select player from prompt list |
| `Esc` | Cancel/Skip prompt |

---

## 🔄 Auto-Sequences

### Made Shot → Assist Prompt

**Trigger**: 2PT or 3PT made shot recorded  
**Prompt**: Inline prompt showing same-team players (excluding scorer)  
**Action**: Select player to record assist, or press `Esc` to skip

### Missed Shot → Rebound Prompt

**Trigger**: 2PT or 3PT missed shot recorded  
**Prompt**: Inline prompt showing all players from both teams  
**Action**: Select player to record rebound (auto-determines offensive/defensive)

### Steal → Turnover Prompt

**Trigger**: Steal recorded  
**Prompt**: Inline prompt showing opposing team players  
**Action**: Select player who lost the ball (records turnover for that player)

### Block → Rebound Prompt

**Trigger**: Block recorded  
**Prompt**: Inline prompt showing all players  
**Action**: Select player who got the rebound (auto-determines offensive/defensive based on blocker's team)

### Turnover Type Selection

**Trigger**: `T` key pressed  
**Prompt**: Turnover type selection (Bad Pass, Lost Ball, Travel, Out of Bounds, etc.)  
**Action**: Select type using number keys, or press `Esc` to cancel

### Foul Type Selection

**Trigger**: `F` key pressed  
**Prompt**: Foul type selection (Personal, Shooting, Offensive, Technical, etc.)  
**Action**: Select type using number keys, or press `Esc` to cancel

---

## 📊 Database Schema

### `game_videos` Table

```sql
CREATE TABLE game_videos (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  bunny_video_id VARCHAR(255),
  status TEXT CHECK (status IN ('processing', 'ready', 'error')),
  is_calibrated BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  -- Assignment workflow columns
  assignment_status TEXT DEFAULT 'pending',
  assigned_stat_admin_id UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### `video_clock_sync` Table

```sql
CREATE TABLE video_clock_sync (
  id UUID PRIMARY KEY,
  video_id UUID REFERENCES game_videos(id),
  jumpball_timestamp_ms INTEGER NOT NULL,
  quarter_length_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `game_stats` Table (Video Tracking Fields)

```sql
-- Existing columns
game_id UUID,
player_id UUID,              -- NULL for custom players or opponent stats
custom_player_id UUID,       -- For custom players (coach games)
is_opponent_stat BOOLEAN,    -- TRUE for opponent stats (coach games)
team_id UUID,
stat_type TEXT,
modifier TEXT,
quarter INTEGER,
game_time_minutes INTEGER,
game_time_seconds INTEGER,
-- Video tracking column
video_timestamp_ms INTEGER   -- Video position in milliseconds
```

---

## 🔐 Security & Access Control

### Role-Based Access

**Stat Admin**:
- Can access Video Tracking Studio for assigned videos
- Can upload videos for organizer games
- Can sync clock and track stats
- Can edit/delete stats in timeline

**Coach** (Premium):
- Can upload videos for their own games
- Can view video status and assignment
- Cannot track stats (assigned to stat admins)
- Can delete game cards

**Admin**:
- Can view all videos in queue
- Can assign videos to stat admins
- Can unassign videos
- Can view assignment status

### RLS Policies

**Video Access**:
```sql
-- Stat Admins can view assigned videos
CREATE POLICY "Stat Admins can view their assigned videos" ON game_videos
  FOR SELECT TO authenticated
  USING (
    auth.role() = 'stat_admin' AND auth.uid() = assigned_stat_admin_id
  );

-- Coaches can view their uploaded videos
CREATE POLICY "Coaches can view their uploaded videos" ON game_videos
  FOR SELECT TO authenticated
  USING (
    auth.role() = 'coach' AND auth.uid() = uploaded_by
  );
```

**Stat Recording**:
- Uses raw HTTP requests with access token from `localStorage`
- Bypasses Supabase client authentication issues
- Mirrors pattern from `GameServiceV3`

---

## 🐛 Troubleshooting

### Video Not Loading

**Issue**: Video shows "Format error" or fails to load  
**Solution**: 
- Check Bunny.net video status (should be "ready")
- Verify video URL format: `https://[CDN]/[video-id]/play_720p.mp4`
- Check CORS settings on Bunny.net CDN

### Clock Sync Not Working

**Issue**: Game clock shows "00:00" for all stats  
**Solution**:
- Verify clock sync is saved (check `video_clock_sync` table)
- Check `isCalibrated` flag in `game_videos` table
- Re-sync clock using "Re-sync Clock" button
- Check console logs for `jumpballMs` and `currentTimeMs` values

### Stats Not Recording

**Issue**: Stats fail to save with 401/403 errors  
**Solution**:
- Check `localStorage` for `sb-access-token`
- Verify user is authenticated (check `useAuthV2` hook)
- Check browser console for detailed error messages
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Coach Game Players Not Loading

**Issue**: Empty roster for coach games  
**Solution**:
- Verify game has `is_coach_game = true` or `opponent_name` set
- Check `CoachPlayerService.getCoachTeamPlayers()` is being called
- Verify custom players exist in `custom_players` table
- Check RLS policies allow stat admin access to custom players

### Opponent Stats Not Recording

**Issue**: Opponent stats fail to save  
**Solution**:
- Verify `isOpponentStat: true` is passed to `recordVideoStat()`
- Check `userId` (coach's user ID) is used as proxy `playerId`
- Verify `teamId` is set to coach's `team_a_id` (required for DB constraint)
- Check database constraint allows `is_opponent_stat = true` with `player_id` set

---

## 📈 Performance Considerations

### Video Processing

- **Polling Interval**: 15 seconds (reduced from 5 seconds to prevent rate limiting)
- **Exponential Backoff**: Automatically increases interval on 429 errors
- **Background Processing**: Users can continue working while video processes

### Stat Recording

- **Real-Time Saving**: Stats saved immediately (no batching)
- **Timeline Refresh**: Triggered on stat record (increments `refreshTrigger`)
- **Backfill Optimization**: Batch updates for existing stats after clock sync

### Database Queries

- **Indexes**: `game_videos.assignment_status`, `game_videos.assigned_stat_admin_id`
- **RLS Policies**: Efficient filtering at database level
- **Raw HTTP**: Bypasses Supabase client overhead for stat recording

---

## 🚀 Future Enhancements

### Planned Features

1. **Shot Location Tracking**
   - Click on court diagram to record shot location
   - Store `shot_location_x`, `shot_location_y`, `shot_zone` in `game_stats`
   - Generate shot charts from video tracking data

2. **Multi-Video Support**
   - Support multiple camera angles
   - Switch between videos during tracking
   - Sync multiple videos to same game clock

3. **AI-Assisted Tracking**
   - Auto-detect made/missed shots
   - Auto-identify players
   - Suggest stat corrections

4. **Export & Reporting**
   - Export video tracking data to CSV/Excel
   - Generate tracking reports
   - Compare video stats vs. live stats

---

## 📚 Related Documentation

- [Video Assignment Workflow](./VIDEO_ASSIGNMENT_WORKFLOW.md) - Admin-to-stat-admin assignment system
- [Stat Tracker V3](../stat-tracker/STAT_TRACKER_V3.md) - Live game tracking system
- [Coach Team Card](../coach-team-card/COACH_TEAM_CARD_IMPLEMENTATION.md) - Coach game system
- [Database Migrations](../../05-database/migrations/README.md) - Video tracking schema

---

**Last Updated**: December 27, 2025  
**Maintained By**: Development Team

