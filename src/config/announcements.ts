import { AnnouncementConfig } from '@/components/announcements';

/**
 * Announcement Configurations
 * 
 * Define all announcements here for easy management.
 * Each announcement has a unique ID for localStorage tracking.
 * 
 * Usage:
 * - Import the config you need
 * - Pass to <AnnouncementModal config={...} />
 * - Optionally add ctaAction for navigation
 */

// ============================================================================
// PLAYER CLAIM ANNOUNCEMENT - For Coach Dashboard
// ============================================================================
export const PLAYER_CLAIM_ANNOUNCEMENT: AnnouncementConfig = {
  id: 'player-claim-v1',
  imageUrl: '/announcements/player-claim-announcement.png',
  dismissText: 'Got it!',
  ctaText: 'Try It Now',
  showOnce: false, // ⚠️ TESTING: Set to true for production
};

// ============================================================================
// FUTURE ANNOUNCEMENTS (Templates)
// ============================================================================

// Example: New Feature Announcement
// export const NEW_FEATURE_ANNOUNCEMENT: AnnouncementConfig = {
//   id: 'new-feature-v1',
//   imageUrl: '/announcements/new-feature.png',
//   title: 'New Feature Available!',
//   dismissText: 'Later',
//   ctaText: 'Check it out',
//   showOnce: true,
// };

// Example: Maintenance Notice
// export const MAINTENANCE_NOTICE: AnnouncementConfig = {
//   id: 'maintenance-dec-2024',
//   imageUrl: '/announcements/maintenance.png',
//   title: 'Scheduled Maintenance',
//   dismissText: 'Understood',
//   showOnce: false, // Show every time
// };

