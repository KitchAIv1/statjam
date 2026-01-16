# 🎯 QC Review Shot Location Editing - Feature Documentation

**Date**: January 14, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0

---

## 📋 Overview

QC Review shot location editing enables admins to add or update shot location data for made/missed shots during quality control review. This feature ensures complete shot location data for all tracked games, even when locations were not recorded during initial video tracking.

### Key Features

- **Visual Location Input**: Half-court diagram for precise location selection
- **Made/Missed Shot Support**: Edit locations for both made and missed shots
- **Immediate Save**: Location updates saved directly to database
- **Stats Refresh**: Timeline automatically refreshes after location update
- **Reusable Component**: Uses `ShotLocationEditor` from manual tracking

---

## 🎯 User Workflow

### Admin - Editing Shot Location

1. **Access QC Review**
   - Navigate to Admin Dashboard
   - Click "QC Review" for a game
   - View stat cards in timeline

2. **Identify Shot Stats**
   - Look for stat cards with "Made Shot" or "Missed Shot"
   - Shot location editor appears below stat details

3. **Update Location**
   - Click on court diagram where shot was taken
   - Location automatically saved
   - Stats timeline refreshes with updated data

4. **Verify Update**
   - Check stat card shows updated location
   - Verify zone is correctly detected
   - Continue with other stats

---

## 🏗️ Architecture

### Component Structure

```
src/
├── app/
│   └── dashboard/
│       └── admin/
│           └── qc-review/
│               └── [gameId]/
│                   └── page.tsx              # QC Review page
│
├── components/
│   ├── clips/
│   │   ├── QCStatCard.tsx                    # Stat card with location editor
│   │   └── QCReviewTimeline.tsx              # Timeline component
│   └── tracker-v3/
│       └── modals/
│           └── ShotLocationEditor.tsx        # Reusable location editor
│
└── lib/
    └── services/
        └── clipService.ts                    # Stats fetching service
```

### Data Flow

```
1. Admin opens QC Review
   page.tsx → getStatsForQCReview(gameId)
   
2. Stats loaded with location data
   clipService.ts → SELECT shot_location_x, shot_location_y, shot_zone
   
3. Stat cards rendered
   QCReviewTimeline → QCStatCard (for each stat)
   
4. Shot stats show location editor
   QCStatCard → ShotLocationEditor (if isShotStat)
   
5. Admin clicks location
   ShotLocationEditor → onLocationChange(x, y, zone)
   
6. Location updated
   handleShotLocationUpdate(statId, x, y, zone)
   → Supabase UPDATE game_stats
   
7. Stats refreshed
   getStatsForQCReview(gameId) → setStats(updatedStats)
```

---

## 🔧 Implementation Details

### QCStatCard Integration

**File**: `src/components/clips/QCStatCard.tsx`

```typescript
interface QCStatCardProps {
  stat: ClipEligibleStat;
  onUpdateStatLocation?: (statId: string, x: number, y: number, zone: string) => void;
}

export function QCStatCard({ stat, onUpdateStatLocation }: QCStatCardProps) {
  const isShotStat = stat.stat_type === 'field_goal' || stat.stat_type === 'three_pointer';

  return (
    <div className="...">
      {/* Stat details */}
      
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
    </div>
  );
}
```

### Location Update Handler

**File**: `src/app/dashboard/admin/qc-review/[gameId]/page.tsx`

```typescript
const handleShotLocationUpdate = useCallback(async (
  statId: string,
  x: number,
  y: number,
  zone: string
) => {
  try {
    const { error } = await supabase
      .from('game_stats')
      .update({
        shot_location_x: x,
        shot_location_y: y,
        shot_zone: zone,
      })
      .eq('id', statId);

    if (error) throw error;

    console.log(`✅ Updated shot location for stat ${statId}: X=${x}, Y=${y}, Zone=${zone}`);
    
    // Refresh stats to reflect the change
    const updatedStats = await getStatsForQCReview(gameId);
    setStats(updatedStats);
  } catch (err) {
    console.error('❌ Error updating shot location:', err);
    alert('Failed to update shot location');
  }
}, [gameId]);
```

### Stats Fetching with Location

**File**: `src/lib/services/clipService.ts`

```typescript
export interface ClipEligibleStat {
  // ... existing fields ...
  shot_location_x: number | null;
  shot_location_y: number | null;
  shot_zone: string | null;
}

export async function getStatsForQCReview(gameId: string): Promise<ClipEligibleStat[]> {
  await ensureSupabaseSession(); // CRITICAL: Sync session before RLS queries
  
  const { data, error } = await supabase
    .from('game_stats')
    .select(`
      id,
      stat_type,
      modifier,
      // ... other fields ...
      shot_location_x,
      shot_location_y,
      shot_zone,
      users:player_id (name),
      custom_players:custom_player_id (name)
    `)
    .eq('game_id', gameId)
    .not('video_timestamp_ms', 'is', null)
    .order('video_timestamp_ms', { ascending: true });

  // ... mapping logic ...
}
```

---

## 📊 Database Schema

### `game_stats` Table (Existing Columns)

```sql
shot_location_x DECIMAL(10, 2),  -- X coordinate (0-100)
shot_location_y DECIMAL(10, 2),  -- Y coordinate (0-50)
shot_zone TEXT                   -- Zone name (paint, mid_range, three_point, etc.)
```

### Update Query

```sql
UPDATE game_stats
SET 
  shot_location_x = $1,
  shot_location_y = $2,
  shot_zone = $3
WHERE id = $4;
```

---

## 🔐 Security & Access Control

### Role-Based Access

**Admin Only**:
- Can edit shot locations in QC Review
- Uses admin RLS policy for UPDATE access
- No restrictions on location updates

### RLS Policies

**Admin UPDATE Policy**:
```sql
CREATE POLICY "game_stats_admin_update" ON game_stats
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
```

---

## 🐛 Troubleshooting

### Location Not Saving

**Issue**: Clicked location but not saved  
**Solution**:
- Check browser console for errors
- Verify admin role in `users` table
- Check RLS policy allows UPDATE
- Verify `handleShotLocationUpdate` is called

### Stats Not Refreshing

**Issue**: Location updated but timeline doesn't refresh  
**Solution**:
- Verify `getStatsForQCReview()` is called after update
- Check `setStats()` is called with new data
- Verify stats state is reactive

### Location Editor Not Showing

**Issue**: Shot stat card doesn't show location editor  
**Solution**:
- Verify `stat.stat_type === 'field_goal' || stat.stat_type === 'three_pointer'`
- Check `onUpdateStatLocation` prop is passed
- Verify `ShotLocationEditor` is imported

---

## 📈 Performance Considerations

### Location Updates

- **Immediate Save**: Each location update is saved immediately
- **No Batching**: Individual updates (acceptable for QC workflow)
- **Stats Refresh**: Single query to refresh all stats after update

### Database Queries

- **Efficient**: UPDATE query uses indexed `id` column
- **Minimal Overhead**: Only updates 3 columns
- **No Impact**: Location updates don't affect other stats

---

## 🚀 Future Enhancements

### Planned Features

1. **Bulk Location Updates**
   - Select multiple stats
   - Apply same location to all
   - Batch update query

2. **Location Validation**
   - Validate coordinates before save
   - Warn if location seems incorrect
   - Suggest corrections

3. **Location Analytics**
   - Show shot chart for game
   - Zone efficiency metrics
   - Compare with video tracking locations

---

## 📚 Related Documentation

- [Video Shot Tracking](../video-tracking/VIDEO_SHOT_TRACKING.md) - Video tracking shot location
- [QC Review Workflow](./QC_REVIEW_WORKFLOW.md) - Complete QC review guide
- [Shot Tracker V3](../shot-tracker/README.md) - Manual tracking shot location

---

**Last Updated**: January 14, 2025  
**Maintained By**: Development Team
