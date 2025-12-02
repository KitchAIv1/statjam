# Announcement System

## Overview

The Announcement System provides a reusable, scalable way to display feature announcements and important updates to users. It uses image-based modals with configurable CTAs and "show once" functionality.

## Architecture

### Components

#### `AnnouncementModal`
- **Location**: `src/components/announcements/AnnouncementModal.tsx`
- **Purpose**: Reusable modal component for displaying announcements
- **Features**:
  - Full-screen image display with Next.js Image optimization
  - Configurable CTA buttons with custom actions
  - "Show once" functionality via localStorage
  - Accessible (ARIA labels, screen reader support)
  - Loading states and error handling
  - Responsive design

#### Configuration System
- **Location**: `src/config/announcements.ts`
- **Purpose**: Centralized announcement definitions
- **Benefits**:
  - Easy to add new announcements
  - Type-safe configuration
  - Consistent structure across all announcements

## Usage

### Basic Implementation

```tsx
import { AnnouncementModal } from '@/components/announcements';
import { PLAYER_CLAIM_ANNOUNCEMENT } from '@/config/announcements';

// In your component
<AnnouncementModal
  config={{
    ...PLAYER_CLAIM_ANNOUNCEMENT,
    ctaAction: () => router.push('/dashboard/coach?section=teams'),
  }}
/>
```

### Creating a New Announcement

1. **Add image** to `public/announcements/your-announcement.png`
2. **Define config** in `src/config/announcements.ts`:

```typescript
export const YOUR_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'your-announcement-v1',
  imageUrl: '/announcements/your-announcement.png',
  title: 'Optional Title Overlay',
  dismissText: 'Got it!',
  ctaText: 'Try It Now',
  ctaAction: () => router.push('/your-route'),
  showOnce: true, // Set to false to show every time
};
```

3. **Use in component**:

```tsx
<AnnouncementModal config={YOUR_ANNOUNCEMENT} />
```

## Configuration Options

### `AnnouncementConfig`

```typescript
interface AnnouncementConfig {
  id: string;                    // Unique ID for localStorage tracking
  imageUrl: string;              // Image path (from /public)
  title?: string;                // Optional overlay title
  ctaText?: string;              // CTA button text
  ctaAction?: () => void;        // CTA button action
  dismissText?: string;          // Dismiss button text (default: "Got it")
  showOnce?: boolean;            // Show only once per user (default: true)
}
```

## Features

### Show Once Functionality

- Uses localStorage with key: `statjam_announcement_seen_{id}`
- Automatically tracks if user has seen announcement
- Can be disabled by setting `showOnce: false`

### Helper Functions

```typescript
// Reset announcement seen status (for testing)
resetAnnouncementSeen('player-claim-v1');

// Check if announcement was seen
const hasSeen = hasSeenAnnouncement('player-claim-v1');
```

## Best Practices

1. **Image Optimization**:
   - Use PNG/JPG optimized for web
   - Recommended size: 1200-1600px width
   - Keep file size under 1MB for fast loading

2. **Show Once**:
   - Use `showOnce: true` for feature announcements
   - Use `showOnce: false` for important notices (maintenance, etc.)

3. **CTA Actions**:
   - Use router navigation for internal routes
   - Can trigger modals, highlight UI elements, etc.
   - Example: Navigate with query params for onboarding flows

4. **Testing**:
   - Use `resetAnnouncementSeen()` to test multiple times
   - Or use incognito/private browsing
   - Or set `showOnce: false` temporarily

## Examples

### Player Claim Announcement

```typescript
export const PLAYER_CLAIM_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'player-claim-v1',
  imageUrl: '/announcements/player-claim-announcement.png',
  dismissText: 'Got it!',
  ctaText: 'Try It Now',
  showOnce: true,
};
```

### Maintenance Notice (Shows Every Time)

```typescript
export const MAINTENANCE_NOTICE: AnnouncementConfig = {
  id: 'maintenance-dec-2024',
  imageUrl: '/announcements/maintenance.png',
  title: 'Scheduled Maintenance',
  dismissText: 'Understood',
  showOnce: false, // Show every time
};
```

## Accessibility

- ✅ Hidden `DialogTitle` for screen readers
- ✅ Proper ARIA labels on buttons
- ✅ Keyboard navigation support
- ✅ Focus management

## Performance

- ✅ Next.js Image optimization with `sizes` prop
- ✅ Lazy loading (only loads when modal opens)
- ✅ Minimal localStorage overhead
- ✅ Smooth animations

## Future Enhancements

- Video support (with compression recommendations)
- Multiple announcement queue
- A/B testing support
- Analytics tracking

