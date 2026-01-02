# Stat Admin Dashboard

**Last Updated**: January 1, 2025  
**Version**: 0.17.7  
**Status**: ✅ Production Ready

---

## 📊 Overview

The Stat Admin Dashboard provides a comprehensive overview of assigned games, video tracking assignments, and performance metrics. The dashboard features a modern 3-card layout with real-time data updates and intuitive navigation.

---

## 🎨 Dashboard Layout

### Core Cards Section

The dashboard features **3 standalone cards** in a responsive grid layout:

#### 1. Profile Card
- **Location**: Left card
- **Features**:
  - Avatar with initials fallback
  - Name and role badge (Stat Admin)
  - Location with country flag
  - Bio preview (2-line truncation)
  - Edit and Share action buttons
- **Styling**: Orange gradient theme with hover effects

#### 2. Game Stats Card
- **Location**: Middle card
- **Features**:
  - Total games assigned
  - Completed games count
  - Pending games count
  - Completion rate percentage
- **Styling**: Blue gradient theme with 2x2 metric grid

#### 3. Video Tracking Card
- **Location**: Right card
- **Features**:
  - Total videos assigned
  - Status breakdown:
    - Assigned (blue)
    - In Progress (orange)
    - Completed (green)
    - Overdue (red, if applicable)
- **Styling**: Orange/red gradient theme with status indicators

---

## 📁 Component Architecture

### DashboardCoreCards Component

**File**: `src/components/stat-admin/DashboardCoreCards.tsx`

**Purpose**: Renders the 3-card core stats layout

**Props**:
```typescript
interface DashboardCoreCardsProps {
  profileData: StatAdminProfile | null;
  profileLoading: boolean;
  gameStats: GameStats;
  gamesLoading: boolean;
  videoStats: VideoStats;
  videosLoading: boolean;
  onEditProfile: () => void;
  onShareProfile: () => void;
}
```

**Features**:
- Responsive grid layout (`grid-cols-1 md:grid-cols-3`)
- Skeleton loading states for each card
- Light theme only (no dark mode variants)
- Gradient top bars for visual hierarchy
- Hover effects with shadow and border highlights

**Data Sources**:
- Profile: `useStatAdminProfile` hook
- Game Stats: `StatAdminDashboardService.getAssignedGamesOptimized()`
- Video Stats: `getAssignedVideos()` from `videoAssignmentService`

---

### AssignedVideosSection Component

**File**: `src/components/stat-admin/AssignedVideosSection.tsx`

**Purpose**: Displays videos assigned to the stat admin for tracking

**Features**:
- Pagination (5 videos per page, "Show All" button)
- Status badges (Completed, In Progress, Assigned)
- Time remaining indicators (Overdue, Hours left)
- Assigned date display
- Team vs Opponent display
- Coach information
- Country/location display
- Duration display
- Action buttons (Start Tracking, Continue, View Stats)

**Status Badges**:
- **Completed**: Green background, white text
- **In Progress**: Orange background, white text
- **Assigned**: Blue background, white text

**Time Remaining**:
- **Overdue** (≤0 hours): Red badge with alert icon
- **Urgent** (<6 hours): Amber badge with clock icon
- **Normal** (≥6 hours): Green badge with clock icon

---

## 🔄 Data Flow

### Profile Data
```
useStatAdminProfile(userId)
  ↓
ProfileService.getStatAdminProfile()
  ↓
DashboardCoreCards (Profile Card)
```

### Game Stats
```
StatAdminDashboardService.getAssignedGamesOptimized(userId)
  ↓
Calculate: total, completed, pending, completionRate
  ↓
DashboardCoreCards (Game Stats Card)
```

### Video Stats
```
getAssignedVideos(userId)
  ↓
Calculate: total, assigned, inProgress, completed, overdue
  ↓
DashboardCoreCards (Video Tracking Card)
```

---

## 🎯 Key Features

### Real-Time Updates
- Video stats refresh on component mount
- Game stats cached for 5 minutes (optimized performance)
- Profile data cached with automatic refresh

### Status Consistency
- Game completion triggers cache invalidation
- Video assignment status updates immediately
- Cross-dashboard status synchronization

### Performance Optimizations
- Parallel data fetching for core cards
- Skeleton loading states for better perceived performance
- Client-side caching with TTL
- Pagination for video lists

---

## 🎨 UI/UX Design

### Color Scheme
- **Profile Card**: Orange gradient (`from-orange-500 via-amber-500 to-orange-600`)
- **Game Stats Card**: Blue gradient (`from-blue-500 via-blue-400 to-blue-600`)
- **Video Tracking Card**: Orange/red gradient (`from-orange-500 via-red-500 to-orange-600`)

### Typography
- **Card Titles**: Bold, `text-gray-900`
- **Metrics**: Large, bold numbers with color-coded backgrounds
- **Labels**: Small, `text-gray-600`

### Responsive Design
- **Mobile**: Single column layout
- **Tablet+**: 3-column grid layout
- **Hover Effects**: Shadow and border color changes

### Light Theme Only
- All dark mode variants removed for consistency
- Consistent appearance across all browsers/devices

---

## 🔧 Technical Implementation

### Caching Strategy

**Game Stats**:
- Service: `StatAdminDashboardService`
- Cache TTL: 5 minutes
- Cache Key: `stat-admin-dashboard:${userId}`
- Invalidation: On game completion

**Video Stats**:
- No caching (always fresh)
- Fetched on component mount
- Refresh button available

**Profile Data**:
- Hook: `useStatAdminProfile`
- Automatic refresh on changes
- Cached in React state

### State Management

```typescript
// Dashboard page state
const [assignedGames, setAssignedGames] = useState<any[]>([]);
const [gamesLoading, setGamesLoading] = useState(true);
const [videoStats, setVideoStats] = useState({...});
const [videosLoading, setVideosLoading] = useState(true);
```

### Error Handling

- Loading states for all async operations
- Error messages displayed in video section
- Graceful fallbacks for missing data
- Retry mechanisms for failed requests

---

## 📊 Metrics Displayed

### Game Stats
- **Total Assigned**: All games assigned to stat admin
- **Completed**: Games with status = 'completed'
- **Pending**: Games with status ≠ 'completed'
- **Completion Rate**: `(completed / total) * 100`

### Video Stats
- **Total**: All videos assigned to stat admin
- **Assigned**: Videos with `assignmentStatus = 'assigned'`
- **In Progress**: Videos with `assignmentStatus = 'in_progress'`
- **Completed**: Videos with `assignmentStatus = 'completed'`
- **Overdue**: Videos with `hoursRemaining ≤ 0` and status ≠ 'completed'

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Real-time WebSocket updates for video status
- [ ] Advanced filtering for assigned videos
- [ ] Performance analytics dashboard
- [ ] Export functionality for game stats
- [ ] Notification system for overdue videos

### Potential Improvements
- [ ] Dark mode support (if requested)
- [ ] Customizable card layout
- [ ] Drag-and-drop card reordering
- [ ] Widget system for additional metrics

---

## 📝 Related Documentation

- `docs/01-project/STAT_ADMIN_TRACKER_COMPLETE_MAP.md` - Stat Admin tracker system
- `docs/04-features/video-tracking/VIDEO_STAT_TRACKING.md` - Video tracking system
- `docs/04-features/dashboards/PLAYER_DASHBOARD.md` - Player dashboard reference

---

## 🔍 Troubleshooting

### Cards Not Loading
1. Check browser console for errors
2. Verify user authentication
3. Check network requests in DevTools
4. Verify cache is not corrupted (clear if needed)

### Video Stats Not Updating
1. Click refresh button in Assigned Videos section
2. Check `getAssignedVideos` service response
3. Verify video assignment status in database

### Game Stats Stale
1. Wait for cache TTL (5 minutes)
2. Complete a game to trigger cache invalidation
3. Manually refresh page

---

**Stat Admin Dashboard** - Professional overview for stat tracking professionals 🎯

