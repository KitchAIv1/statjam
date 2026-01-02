# DashboardCoreCards Component

**File**: `src/components/stat-admin/DashboardCoreCards.tsx`  
**Last Updated**: January 1, 2025  
**Version**: 0.17.7  
**Status**: ✅ Production Ready

---

## 📋 Overview

The `DashboardCoreCards` component renders a modern 3-card layout for the Stat Admin dashboard, displaying profile information, game statistics, and video tracking metrics in a responsive grid.

---

## 🎯 Purpose

Provides a comprehensive overview of:
1. **Profile Card**: Stat admin's profile information with quick actions
2. **Game Stats Card**: Game assignment metrics (assigned, completed, pending, rate)
3. **Video Tracking Card**: Video assignment status breakdown

---

## 📐 Component Structure

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

---

## 🎨 Card Layouts

### 1. Profile Card

**Position**: Left card  
**Theme**: Orange gradient

**Content**:
- Avatar (16x16) with initials fallback
- Name (bold, large)
- Role badge (Stat Admin, purple)
- Location with country flag
- Bio preview (2-line truncation, italic)
- Edit and Share buttons

**Styling**:
- Border: `border-2 border-orange-200/50`
- Background: `bg-gradient-to-br from-white to-orange-50/30`
- Top bar: `bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600`
- Hover: Shadow and border color change

### 2. Game Stats Card

**Position**: Middle card  
**Theme**: Blue gradient

**Content**:
- Trophy icon
- Title: "Game Stats"
- 2x2 metric grid:
  - Assigned (blue background)
  - Completed (green background)
  - Pending (amber background)
  - Rate (purple background)

**Styling**:
- Border: `border-2 border-blue-200/50`
- Background: `bg-gradient-to-br from-white to-blue-50/30`
- Top bar: `bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600`
- Metrics: Large bold numbers with color-coded backgrounds

### 3. Video Tracking Card

**Position**: Right card  
**Theme**: Orange/red gradient

**Content**:
- Video icon
- Title: "Video Tracking"
- Subtitle: "{total} total videos"
- Status breakdown list:
  - Assigned (blue)
  - In Progress (orange)
  - Completed (green)
  - Overdue (red, conditional)

**Styling**:
- Border: `border-2 border-orange-200/50`
- Background: `bg-gradient-to-br from-white to-orange-50/30`
- Top bar: `bg-gradient-to-r from-orange-500 via-red-500 to-orange-600`
- Status items: Rounded backgrounds with icons

---

## 🔄 Loading States

### Skeleton Components

Each card has a dedicated skeleton loader:

```typescript
function CardSkeleton({ icon: Icon, title }: { icon: React.ElementType; title: string })
```

**Features**:
- Animated pulse effect
- Gradient top bar
- Icon placeholder
- Title placeholder
- Content placeholders (2 lines)

**Usage**:
- Displayed when `profileLoading`, `gamesLoading`, or `videosLoading` is `true`
- Maintains card dimensions during loading
- Provides smooth transition to loaded state

---

## 📊 Data Flow

### Profile Data
```
useStatAdminProfile(userId)
  ↓
profileData: StatAdminProfile
  ↓
DashboardCoreCards (Profile Card)
```

### Game Stats
```
StatAdminDashboardService.getAssignedGamesOptimized(userId)
  ↓
Calculate: { total, completed, pending, completionRate }
  ↓
DashboardCoreCards (Game Stats Card)
```

### Video Stats
```
getAssignedVideos(userId)
  ↓
Calculate: { total, assigned, inProgress, completed, overdue }
  ↓
DashboardCoreCards (Video Tracking Card)
```

---

## 🎨 Design Principles

### Responsive Layout
- **Mobile**: Single column (`grid-cols-1`)
- **Tablet+**: Three columns (`md:grid-cols-3`)
- **Gap**: `gap-6` between cards

### Visual Hierarchy
- Gradient top bars (1.5px height) for brand consistency
- Icon badges with shadows
- Color-coded metrics for quick scanning
- Hover effects for interactivity

### Accessibility
- Semantic HTML structure
- Clear text contrast
- Icon + text labels
- Keyboard navigation support

### Performance
- Skeleton loading for perceived performance
- Conditional rendering (null if no profile data)
- Memoization-ready props structure

---

## 🔧 Technical Details

### Dependencies
- `@/components/ui/card` - Card components
- `@/components/ui/avatar` - Avatar component
- `@/components/ui/badge` - Badge component
- `@/components/ui/Button` - Button component
- `lucide-react` - Icons
- `@/lib/types/profile` - TypeScript types
- `@/data/countries` - Country name mapping

### Helper Functions

#### `getInitials(name: string)`
Extracts initials from name for avatar fallback:
- Splits by space
- Takes first letter of each word
- Uppercases and limits to 2 characters

### Props Validation

**Required Props**:
- All props are required (no optional props)

**Null Handling**:
- `profileData` can be `null` (renders nothing)
- Loading states handled via boolean flags

---

## 🚀 Usage Example

```typescript
import { DashboardCoreCards } from '@/components/stat-admin/DashboardCoreCards';
import { useStatAdminProfile } from '@/hooks/useStatAdminProfile';
import { StatAdminDashboardService } from '@/lib/services/statAdminDashboardService';
import { getAssignedVideos } from '@/lib/services/videoAssignmentService';

function StatAdminDashboard() {
  const { user } = useAuthContext();
  const { profileData, loading: profileLoading } = useStatAdminProfile(user?.id || '');
  
  const [gameStats, setGameStats] = useState({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [gamesLoading, setGamesLoading] = useState(true);
  const [videoStats, setVideoStats] = useState({ total: 0, assigned: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [videosLoading, setVideosLoading] = useState(true);
  
  // Load data...
  
  return (
    <DashboardCoreCards
      profileData={profileData}
      profileLoading={profileLoading}
      gameStats={gameStats}
      gamesLoading={gamesLoading}
      videoStats={videoStats}
      videosLoading={videosLoading}
      onEditProfile={() => setShowEditModal(true)}
      onShareProfile={handleShare}
    />
  );
}
```

---

## 🎯 Best Practices

### Data Loading
- Always provide loading states
- Handle null/undefined data gracefully
- Use skeleton loaders for better UX

### Styling
- Use Tailwind utility classes consistently
- Maintain brand color scheme
- Ensure responsive design

### Performance
- Avoid unnecessary re-renders
- Use React.memo if needed
- Keep component focused (single responsibility)

---

## 🐛 Known Issues

None at this time.

---

## 🔮 Future Enhancements

### Potential Improvements
- [ ] Dark mode support (if requested)
- [ ] Customizable card order
- [ ] Additional metrics/widgets
- [ ] Real-time WebSocket updates
- [ ] Export functionality

---

## 📝 Related Documentation

- `docs/04-features/dashboards/STAT_ADMIN_DASHBOARD.md` - Dashboard overview
- `docs/01-project/CHANGELOG.md` - Version history
- `src/components/stat-admin/AssignedVideosSection.tsx` - Related component

---

**DashboardCoreCards** - Professional 3-card layout for stat admin overview 🎯

