# Media Tab Feature Documentation

**Date**: February 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 Overview

The Media Tab is a feature within the Tournament Dedicated Page that displays game replays, highlights, and media content. It provides immediate access to game replays as soon as live streams end, without requiring games to be marked as completed.

---

## 🎯 Key Features

### Game Replays Section
- **YouTube Integration**: Displays game replays from YouTube videos
- **Immediate Availability**: Replays appear as soon as stream ends (via `stream_ended` flag)
- **Score Calculation**: Scores calculated from `game_stats` table (source of truth)
- **Responsive Grid**: 2-3 column layout based on screen size
- **Single Video Playback**: YouTube-like behavior - only one video plays at a time
- **Team Information**: Displays team names, logos, scores, and game date

### Highlights Section
- **Placeholder**: Coming soon section for game clips and condensed games
- **Future Enhancement**: Auto-generated highlights and clips

---

## 🔄 Data Flow

### Replay Query Logic

The Media Tab uses the `useGameReplays` hook to fetch games with available replays:

```typescript
// Query filters:
// 1. Games with stream_video_id (has YouTube video)
// 2. Games where status = 'completed' OR stream_ended = true
// 3. Ordered by start_time DESC
// 4. Limited to 6 replays
```

### Score Calculation

Scores are calculated from `game_stats` table, not from `games.home_score`/`away_score` columns:

```typescript
// Scoring logic:
// - three_pointer made = 3 points
// - field_goal/two_pointer made = 2 points
// - free_throw made = 1 point
// - Sums points per team from game_stats
```

---

## 🗄️ Database Schema

### Games Table Fields Used

- `id`: Game identifier
- `stream_video_id`: YouTube video ID for replay
- `stream_ended`: Boolean flag indicating stream has ended
- `status`: Game status ('scheduled', 'in_progress', 'completed', 'cancelled')
- `start_time`: Game start timestamp
- `team_a_id`, `team_b_id`: Team references
- `team_a`, `team_b`: Team names and logos (via JOIN)

### Query Performance

- **Partial Index**: `idx_games_stream_ended` optimizes queries filtering by `stream_ended = true`
- **Efficient Filtering**: OR condition `status = 'completed' OR stream_ended = true` is optimized by PostgreSQL
- **Batch Loading**: Team logos fetched in batch to prevent N+1 queries

---

## 🎨 User Interface

### Layout Structure

```
Media Tab
├── Game Replays Section
│   ├── Header (Video icon + "Game Replays" title)
│   ├── Loading State (Skeleton cards)
│   ├── Replays Grid (2-3 columns)
│   │   └── GameReplayCard (per replay)
│   │       ├── YouTube Thumbnail
│   │       ├── Team Names
│   │       ├── Score
│   │       └── Play Button
│   └── Empty State (if no replays)
└── Highlights Section
    ├── Header (Film icon + "Highlights" title)
    └── Placeholder Cards (Coming Soon)
```

### Responsive Design

- **Mobile (< 640px)**: Single column layout
- **Tablet (640px - 1280px)**: 2 column layout
- **Desktop (> 1280px)**: 3 column layout

### GameReplayCard Component

**Features**:
- YouTube embed with thumbnail
- Team names and logos
- Calculated scores
- Play button overlay
- Single video playback (pauses others when one plays)

---

## 🔧 Implementation Details

### useGameReplays Hook

**File**: `statjam/src/hooks/useGameReplays.ts`

**Purpose**: Fetches games with available replays for a tournament

**Query Logic**:
```typescript
const { data: gamesData } = await supabase
  .from('games')
  .select(`
    id,
    stream_video_id,
    start_time,
    status,
    stream_ended,
    team_a_id,
    team_b_id,
    team_a:teams!games_team_a_id_fkey(name, logo_url),
    team_b:teams!games_team_b_id_fkey(name, logo_url)
  `)
  .eq('tournament_id', tournamentId)
  .not('stream_video_id', 'is', null)
  .or('status.eq.completed,stream_ended.eq.true')
  .order('start_time', { ascending: false })
  .limit(limit);
```

**Score Calculation**:
- Fetches all `game_stats` for games in batch
- Filters for `modifier = 'made'` (only successful shots)
- Calculates points per stat type (3PT, 2PT, FT)
- Sums points per team

### MediaTab Component

**File**: `statjam/src/components/tournament/tabs/MediaTab.tsx`

**Features**:
- Uses `useGameReplays` hook
- Manages active replay state (single video playback)
- Renders GameReplayCard components
- Handles loading and empty states

---

## 🚀 Stream End Detection

### Automatic Detection

When a live stream ends (detected by YouTube player), the system:

1. **Extracts Video ID** from YouTube URL
2. **Calls `tournamentStreamingService.markStreamEnded(videoId)`**
3. **Updates `games.stream_ended = true`** for matching game
4. **Media Tab query includes** games with `stream_ended = true`
5. **Replay appears immediately** in Media Tab

### Components Involved

- `TournamentRightRail.tsx`: Detects stream end in right rail
- `LiveTabContent.tsx`: Detects stream end in live tab
- `tournamentStreamingService.ts`: Service that updates database

---

## 📊 Performance Considerations

### Query Optimization
- ✅ Partial index on `stream_ended = true` improves query performance
- ✅ Batch fetching of team logos prevents N+1 queries
- ✅ Limit of 6 replays prevents excessive data loading
- ✅ Score calculation done in-memory (no additional queries)

### Loading States
- Skeleton loading during initial fetch
- Empty state when no replays available
- Error handling with user-friendly messages

---

## 🔮 Future Enhancements

### Planned Features
- **Highlights Section**: Auto-generated game clips and highlights
- **Photo Gallery**: Tournament photos and images
- **Video Filters**: Filter replays by date, team, or game type
- **Share Functionality**: Share replays on social media
- **Download Option**: Download replays for offline viewing

### Technical Improvements
- **Caching**: Cache replay data to reduce database queries
- **Pagination**: Load more replays on scroll
- **Search**: Search replays by team name or date
- **Sorting**: Sort replays by date, score, or popularity

---

## 📚 Related Documentation

- **Feature Audit**: `statjam/docs/02-development/STREAM_ENDED_FEATURE_AUDIT.md`
- **Migration**: `statjam/docs/05-database/migrations/035_STREAM_ENDED_MIGRATION.md`
- **Service**: `statjam/src/lib/services/tournamentStreamingService.ts`
- **Hook**: `statjam/src/hooks/useGameReplays.ts`
- **Component**: `statjam/src/components/tournament/tabs/MediaTab.tsx`

---

## ✅ Testing Checklist

### Functional Testing
- [x] Media Tab displays replays when `stream_ended = true`
- [x] Media Tab displays replays when `status = 'completed'`
- [x] Scores calculated correctly from game_stats
- [x] Single video playback works (pauses others)
- [x] Team logos display correctly
- [x] Empty state shows when no replays
- [x] Loading state shows during fetch

### Edge Cases
- [x] Games with no stream_video_id are excluded
- [x] Games with stream_ended = false and status != 'completed' are excluded
- [x] Games with no stats show 0-0 score
- [x] Invalid YouTube video IDs are handled gracefully

### Performance
- [x] Query completes in < 500ms
- [x] No N+1 queries for team logos
- [x] Score calculation is efficient
- [x] Grid layout is responsive

---

## 🎉 Summary

The Media Tab provides immediate access to game replays as soon as live streams end, improving user experience by eliminating the wait for game completion. The `stream_ended` flag enables this functionality while maintaining backward compatibility with completed games.

**Last Updated**: February 2026  
**Status**: ✅ Production Ready
