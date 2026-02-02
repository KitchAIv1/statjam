/**
 * Activity Monitor Types
 * Type definitions for admin activity monitoring
 */

export type ActivityType =
  | 'tournament_created'
  | 'tournament_deleted'
  | 'tournament_status_changed'
  | 'game_scheduled'
  | 'game_deleted'
  | 'video_uploaded'
  | 'live_stream_started'
  | 'live_stream_ended'
  | 'team_created'
  | 'player_added'
  | 'manual_tracking_started'
  | 'user_signup';

export type UserTypeFilter = 'all' | 'organizer' | 'coach' | 'player' | 'stat_admin';

export type ActivityTypeFilter = 
  | 'all' 
  | 'tournaments' 
  | 'games' 
  | 'teams' 
  | 'videos' 
  | 'streaming' 
  | 'tracking'
  | 'users';

export type TimeRangeFilter = '1h' | '24h' | '7d' | '30d';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  userEmail: string;
  userId: string;
  userRole: string;
  entityName: string;
  entityId: string;
  parentEntityName?: string; // e.g., tournament name for a team
  parentEntityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityFiltersState {
  userType: UserTypeFilter;
  activityType: ActivityTypeFilter;
  timeRange: TimeRangeFilter;
  search: string;
}

export interface ActivityAlerts {
  newTournaments: number;
  liveStreams: number;
  videosPending: number;
  newUsers: number;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  total: number;
  hasMore: boolean;
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  tournament_created: '🏆',
  tournament_deleted: '🗑️',
  tournament_status_changed: '🔄',
  game_scheduled: '📅',
  game_deleted: '🗑️',
  video_uploaded: '📹',
  live_stream_started: '🔴',
  live_stream_ended: '⚫',
  team_created: '👥',
  player_added: '👤',
  manual_tracking_started: '🎮',
  user_signup: '✨',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  tournament_created: 'Tournament Created',
  tournament_deleted: 'Tournament Deleted',
  tournament_status_changed: 'Tournament Status Changed',
  game_scheduled: 'Game Scheduled',
  game_deleted: 'Game Deleted',
  video_uploaded: 'Video Uploaded',
  live_stream_started: 'Live Stream Started',
  live_stream_ended: 'Live Stream Ended',
  team_created: 'Team Created',
  player_added: 'Player Added',
  manual_tracking_started: 'Manual Tracking Started',
  user_signup: 'User Signup',
};
