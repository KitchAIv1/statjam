'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { ActivityItem, ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/lib/types/activityMonitor';

interface ActivityFeedItemProps {
  item: ActivityItem;
}

/**
 * Format relative time (e.g., "2 min ago", "3 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Format absolute time (e.g., "Feb 1, 2026 3:42 PM")
 */
function formatAbsoluteTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Single activity item in the feed
 * Max 200 lines per component rule
 */
export function ActivityFeedItem({ item }: ActivityFeedItemProps) {
  const icon = ACTIVITY_ICONS[item.type];
  const label = ACTIVITY_LABELS[item.type];
  const relativeTime = formatRelativeTime(item.createdAt);
  const absoluteTime = formatAbsoluteTime(item.createdAt);

  // Build entity link based on type
  const getEntityLink = (): string | null => {
    switch (item.type) {
      case 'tournament_created':
      case 'tournament_status_changed':
        return `/tournament/${item.entityId}`;
      case 'game_scheduled':
        return item.parentEntityId ? `/tournament/${item.parentEntityId}` : null;
      case 'team_created':
        return item.parentEntityId ? `/tournament/${item.parentEntityId}` : null;
      case 'user_signup':
        return null; // No public user profile page
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div className="text-2xl shrink-0 mt-0.5">{icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Activity Type Label */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground" title={absoluteTime}>
            {relativeTime}
          </span>
        </div>

        {/* Entity Name */}
        <p className="text-sm text-foreground mb-1">
          <span className="font-medium">&quot;{item.entityName}&quot;</span>
          {item.parentEntityName && (
            <span className="text-muted-foreground">
              {' '}in &quot;{item.parentEntityName}&quot;
            </span>
          )}
        </p>

        {/* User Info */}
        <p className="text-xs text-muted-foreground">
          by <span className="font-medium">{item.userEmail}</span>
          <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px] uppercase">
            {item.userRole.replace('_', ' ')}
          </span>
        </p>

        {/* Absolute Time (secondary) */}
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {absoluteTime}
        </p>
      </div>

      {/* Action Link */}
      {entityLink && (
        <Link
          href={entityLink}
          className="shrink-0 p-2 text-muted-foreground hover:text-primary transition-colors"
          title="View"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
