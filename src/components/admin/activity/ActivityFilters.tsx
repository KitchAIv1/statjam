'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/Button';
import {
  ActivityFiltersState,
  UserTypeFilter,
  ActivityTypeFilter,
  TimeRangeFilter,
} from '@/lib/types/activityMonitor';

interface ActivityFiltersProps {
  filters: ActivityFiltersState;
  onFiltersChange: (filters: ActivityFiltersState) => void;
  onRefresh: () => void;
  loading?: boolean;
}

/**
 * Filter bar for activity feed
 * Max 200 lines per component rule
 */
export function ActivityFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading,
}: ActivityFiltersProps) {
  const updateFilter = <K extends keyof ActivityFiltersState>(
    key: K,
    value: ActivityFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-muted/30 rounded-lg border">
      {/* User Type Filter */}
      <Select
        value={filters.userType}
        onValueChange={(v) => updateFilter('userType', v as UserTypeFilter)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="User Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="organizer">Organizers</SelectItem>
          <SelectItem value="coach">Coaches</SelectItem>
          <SelectItem value="player">Players</SelectItem>
          <SelectItem value="stat_admin">Stat Admins</SelectItem>
        </SelectContent>
      </Select>

      {/* Activity Type Filter */}
      <Select
        value={filters.activityType}
        onValueChange={(v) => updateFilter('activityType', v as ActivityTypeFilter)}
      >
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Activity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Activities</SelectItem>
          <SelectItem value="tournaments">Tournaments</SelectItem>
          <SelectItem value="games">Games</SelectItem>
          <SelectItem value="teams">Teams</SelectItem>
          <SelectItem value="streaming">Live Streaming</SelectItem>
          <SelectItem value="tracking">Manual Tracking</SelectItem>
          <SelectItem value="users">User Signups</SelectItem>
        </SelectContent>
      </Select>

      {/* Time Range Filter */}
      <Select
        value={filters.timeRange}
        onValueChange={(v) => updateFilter('timeRange', v as TimeRangeFilter)}
      >
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder="Time Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1h">Last 1 hour</SelectItem>
          <SelectItem value="24h">Last 24 hours</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="shrink-0"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
