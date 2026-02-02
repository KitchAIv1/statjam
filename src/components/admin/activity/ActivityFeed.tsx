'use client';

import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { ActivityItem } from '@/lib/types/activityMonitor';
import { ActivityFeedItem } from './ActivityFeedItem';

interface ActivityFeedProps {
  items: ActivityItem[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

/**
 * Activity feed list component
 * Max 200 lines per component rule
 */
export function ActivityFeed({
  items,
  total,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
}: ActivityFeedProps) {
  // Loading state
  if (loading && items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading activity feed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Inbox className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No activity found</p>
            <p className="text-sm">Try adjusting your filters or time range</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>
              Showing {items.length} of {total} activities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Feed Items */}
        <div className="divide-y">
          {items.map((item) => (
            <ActivityFeedItem key={item.id} item={item} />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
