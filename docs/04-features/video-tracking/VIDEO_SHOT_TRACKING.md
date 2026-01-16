# 🎯 Video Tracking Shot Location - Feature Documentation

**Date**: January 14, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 Overview

Shot location tracking enables stat admins to record the precise location (X, Y coordinates and zone) of shots taken during video review. This feature extends the existing shot tracking functionality from manual tracking to video tracking mode, providing consistent data collection across both tracking methods.

### Key Features

- **Court Diagram Input**: Visual half-court diagram for shot location selection
- **Zone Detection**: Automatic zone detection from coordinates (paint, mid-range, three-point, etc.)
- **Edit Existing Locations**: Update shot locations for stats missing location data
- **QC Review Integration**: Edit shot locations during quality control review
- **Data Consistency**: Same data structure as manual tracking (`shot_location_x`, `shot_location_y`, `shot_zone`)

---

## 🎯 User Workflows

### Stat Admin - Recording Shot Location

1. **Enter Video Tracking Studio**
   - Navigate to Stat Admin Dashboard
   - Click "Assigned Videos" section
   - Select a video from the list

2. **Enable Shot Tracker Mode**
   - In the stat entry panel, toggle from "Buttons" to "Court" mode
   - Court diagram appears below player roster

3. **Record Shot with Location**
   - Select player using number keys (1-5 for Team A, 6-0 for Team B)
   - Click on court diagram where shot was taken
   - Shot location automatically saved with stat
   - Stat appears in timeline with location data

4. **Edit Shot Location**
   - Click "Edit" on any stat in timeline
   - Edit modal opens with court diagram
   - Click new location to update
   - Location saved immediately

### Stat Admin - QC Review Location Editing

1. **Access QC Review**
   - Navigate to Admin Dashboard
   - Click "QC Review" for a game
   - View stat cards for made/missed shots

2. **Update Shot Location**
   - Click on court diagram in stat card
   - Select new location
   - Location saved automatically
   - Stats refresh with updated data

---

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   ├── video/
│   │   ├── VideoStatEntryPanel.tsx      # Main stat entry UI
│   │   └── VideoStatsTimeline.tsx        # Stats timeline with edit
│   ├── clips/
│   │   ├── QCStatCard.tsx                # QC stat card with location editor
│   │   └── QCReviewTimeline.tsx          # QC timeline
│   └── tracker-v3/
│       ├── shot-tracker/
│       │   ├── ShotTrackerPanel.tsx      # Court diagram component
│       │   └── TrackerModeToggle.tsx    # Mode toggle button
│       └── modals/
│           └── ShotLocationEditor.tsx    # Reusable location editor
│
├── hooks/
│   └── useVideoStatHandlers.ts           # Stat recording logic
│
└── lib/
    ├── services/
    │   └── videoStatService.ts           # Video stat database operations
    └── types/
        └── shotTracker.ts                # Shot location types
```

### Data Flow

```
1. User clicks court diagram
   ShotTrackerPanel → onLocationChange(x, y, zone)
   
2. Location passed to stat handler
   handleStatRecordWithLocation(statType, modifier, locationData)
   
3. Stat recorded with location
   useVideoStatHandlers.handleStatRecord(statType, modifier, locationData)
   → VideoStatService.recordVideoStat({
       shotLocationX, shotLocationY, shotZone
     })
   
4. Saved to database
   game_stats table (shot_location_x, shot_location_y, shot_zone)
   
5. Timeline refreshes
   VideoStatsTimeline displays stat with location
```

### Edit Flow

```
1. User clicks "Edit" on stat
   VideoStatsTimeline → handleEditClick(stat)
   
2. Edit modal opens
   StatEditForm receives stat with location data
   
3. User updates location
   ShotLocationEditor → onLocationChange(x, y, zone)
   
4. Stat updated
   StatEditService.updateStat({ shot_location_x, shot_location_y, shot_zone })
   
5. Timeline refreshes
   Updated location displayed
```

---

## 📊 Database Schema

### `game_stats` Table (Existing Columns)

```sql
shot_location_x DECIMAL(10, 2),  -- X coordinate (0-100)
shot_location_y DECIMAL(10, 2),  -- Y coordinate (0-50)
shot_zone TEXT                   -- Zone name (paint, mid_range, three_point, etc.)
```

### Zone Detection

Zones are automatically detected from coordinates:

- **Paint**: `y < 20` (close to basket)
- **Mid-Range**: `20 <= y < 35` (between paint and three-point line)
- **Three-Point**: `y >= 35` (beyond three-point line)
- **Left Corner**: `x < 20` (left side of court)
- **Right Corner**: `x > 80` (right side of court)
- **Top of Key**: `40 <= x <= 60` (center of court)

---

## 🔧 Implementation Details

### ShotTrackerPanel Integration

**File**: `src/components/video/VideoStatEntryPanel.tsx`

```typescript
const [inputMode, setInputMode] = useState<TrackerInputMode>('classic');

{inputMode === 'shot_tracker' ? (
  <ShotTrackerPanel
    selectedPlayer={entry.selectedPlayer}
    selectedPlayerData={entry.getSelectedPlayerData()}
    selectedCustomPlayerId={entry.selectedCustomPlayerId}
    selectedTeamId={entry.selectedTeam === 'A' ? entry.gameData.team_a_id : entry.gameData.team_b_id}
    teamAId={entry.gameData.team_a_id}
    isClockRunning={false}
    onStatRecord={entry.handleStatRecord}
    onStatRecordWithLocation={handleStatRecordWithLocation}
    onFoulRecord={() => entry.handleInitiateFoul()}
    onTimeOut={() => {}}
    onSubstitution={() => entry.setShowSubModal(true)}
    onGameEnd={() => {}}
    onGameCancel={() => {}}
  />
) : (
  <VideoStatButtons
    onStatRecord={(statType, modifier) => {
      entry.handleStatRecord(statType, modifier);
    }}
    disabled={!entry.selectedPlayer || entry.isRecording}
  />
)}
```

### Location Data Extension

**File**: `src/hooks/useVideoStatHandlers.ts`

```typescript
const handleStatRecord = useCallback((
  statType: string,
  modifier?: string,
  locationData?: { 
    shotLocationX?: number; 
    shotLocationY?: number; 
    shotZone?: string 
  }
) => {
  // ... existing logic ...
  VideoStatService.recordVideoStat({
    gameId, videoId, playerId, customPlayerId, isOpponentStat, teamId, 
    statType, modifier,
    videoTimestampMs: currentVideoTimeMs, 
    quarter: gameClock.quarter,
    game_time_minutes: gameClock.minutesRemaining, 
    game_time_seconds: gameClock.secondsRemaining,
    shotLocationX: locationData?.shotLocationX,
    shotLocationY: locationData?.shotLocationY,
    shotZone: locationData?.shotZone,
    skipPostUpdates: true,
  })
}, [...]);
```

### QC Review Integration

**File**: `src/components/clips/QCStatCard.tsx`

```typescript
const isShotStat = stat.stat_type === 'field_goal' || stat.stat_type === 'three_pointer';

{isShotStat && (
  <div className="mt-3 pt-3 border-t border-gray-100">
    <ShotLocationEditor
      locationX={stat.shot_location_x ?? null}
      locationY={stat.shot_location_y ?? null}
      zone={stat.shot_zone ?? null}
      onLocationChange={(x, y, zone) => {
        if (onUpdateStatLocation) {
          onUpdateStatLocation(stat.id, x, y, zone);
        }
      }}
    />
  </div>
)}
```

---

## ⌨️ Keyboard Shortcuts

### Shot Tracker Mode

| Key | Action |
|-----|--------|
| `P` | 2PT Made (with location) |
| `Shift + P` | 3PT Made (with location) |
| `M` | 2PT Missed (with location) |
| `Shift + M` | 3PT Missed (with location) |

**Note**: In "Court" mode, clicking the court diagram automatically records the shot with location. Keyboard shortcuts still work but location must be set via mouse click.

---

## 🧪 Testing

### Test Coverage

**File**: `tests/video/videoShotTracker.test.ts`

**Test Cases** (20 total):
- ✅ Location data flow to `recordVideoStat`
- ✅ Zone detection from coordinates
- ✅ Coordinate normalization (0-100, 0-50)
- ✅ Custom player support
- ✅ Shot type from zone (2PT vs 3PT)
- ✅ Input mode toggling
- ✅ Integration with `handleStatRecord`
- ✅ Location data in edit modal
- ✅ QC Review location updates

---

## 🐛 Troubleshooting

### Shot Location Not Saving

**Issue**: Location clicked but not saved with stat  
**Solution**:
- Verify `inputMode === 'shot_tracker'`
- Check browser console for errors
- Verify `handleStatRecordWithLocation` is called
- Check database for `shot_location_x`, `shot_location_y`, `shot_zone` values

### Zone Not Detected

**Issue**: Zone shows as `null` after recording  
**Solution**:
- Verify coordinates are within valid range (0-100 for X, 0-50 for Y)
- Check zone detection logic in `ShotTrackerPanel`
- Verify `shotZone` is passed to `recordVideoStat`

### Edit Modal Not Showing Location

**Issue**: Edit modal doesn't display existing location  
**Solution**:
- Verify `shot_location_x`, `shot_location_y`, `shot_zone` are passed to `StatEditForm`
- Check `VideoStatsTimeline.handleEditClick` includes location data
- Verify `ShotLocationEditor` receives location props

---

## 📈 Performance Considerations

### Shot Location Recording

- **No Performance Impact**: Optional data, minimal overhead
- **Database**: Uses existing columns, no new indexes needed
- **UI**: Court diagram renders efficiently (SVG-based)

### QC Review Location Updates

- **Immediate Save**: Location updates saved directly to database
- **Stats Refresh**: Single query to refresh stats after update
- **No Batching**: Each location update is individual (acceptable for QC workflow)

---

## 🚀 Future Enhancements

### Planned Features

1. **Shot Charts Generation**
   - Visual shot chart from location data
   - Heat maps by zone
   - Player-specific shot charts

2. **Location Analytics**
   - Shooting percentage by zone
   - Shot selection analysis
   - Zone efficiency metrics

3. **Auto-Detection**
   - AI-assisted shot location detection
   - Video frame analysis
   - Automatic zone assignment

---

## 📚 Related Documentation

- [Video Stat Tracking](./VIDEO_STAT_TRACKING.md) - Complete video tracking guide
- [Shot Tracker V3](../shot-tracker/README.md) - Manual tracking shot location
- [QC Review Shot Location](../admin-dashboard/QC_REVIEW_SHOT_LOCATION.md) - QC editing guide

---

**Last Updated**: January 14, 2025  
**Maintained By**: Development Team
