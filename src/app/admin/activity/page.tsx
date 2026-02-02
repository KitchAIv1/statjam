'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { ActivityMonitorService } from '@/lib/services/activityMonitorService';
import {
  ActivityAlertBanner,
  ActivityFilters,
  ActivityFeed,
} from '@/components/admin/activity';
import {
  ActivityFiltersState,
  ActivityAlerts,
  ActivityItem,
} from '@/lib/types/activityMonitor';

const DEFAULT_FILTERS: ActivityFiltersState = {
  userType: 'all',
  activityType: 'all',
  timeRange: '24h',
  search: '',
};

/**
 * Admin Activity Monitor Page
 * Global activity feed for monitoring user actions
 * Max 200 lines per component rule
 */
const ActivityMonitorPage = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const userRole = user?.role;

  // State
  const [filters, setFilters] = useState<ActivityFiltersState>(DEFAULT_FILTERS);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [alerts, setAlerts] = useState<ActivityAlerts>({
    newTournaments: 0,
    liveStreams: 0,
    videosPending: 0,
    newUsers: 0,
  });
  const [alertsLoading, setAlertsLoading] = useState(true);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'admin')) {
      router.push('/auth');
    }
  }, [user, userRole, authLoading, router]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const data = await ActivityMonitorService.getAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Fetch activity feed
  const fetchActivities = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await ActivityMonitorService.getActivityFeed(filters, pageNum);

      if (append) {
        setItems((prev) => [...prev, ...response.items]);
      } else {
        setItems(response.items);
      }

      setTotal(response.total);
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchAlerts();
      fetchActivities(0);
    }
  }, [user, userRole, fetchAlerts, fetchActivities]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setPage(0);
    fetchAlerts();
    fetchActivities(0);
  }, [fetchAlerts, fetchActivities]);

  // Filter change handler
  const handleFiltersChange = useCallback((newFilters: ActivityFiltersState) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchActivities(0);
    }
  }, [filters, user, userRole, fetchActivities]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    fetchActivities(page + 1, true);
  }, [page, fetchActivities]);

  // Loading state
  if (authLoading || !user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Activity Monitor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Activity Monitor</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time platform activity feed - track organizer, coach, and player actions
          </p>
        </div>

        {/* Alert Banner */}
        <ActivityAlertBanner alerts={alerts} loading={alertsLoading} />

        {/* Filters */}
        <ActivityFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Activity Feed */}
        <ActivityFeed
          items={items}
          total={total}
          hasMore={hasMore}
          loading={loading}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
};

export default ActivityMonitorPage;
