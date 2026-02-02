'use client';

import React from 'react';
import { Trophy, Radio, Video, UserPlus } from 'lucide-react';
import { ActivityAlerts } from '@/lib/types/activityMonitor';

interface ActivityAlertBannerProps {
  alerts: ActivityAlerts;
  loading?: boolean;
}

/**
 * Alert banner showing today's key activity counts
 * Max 200 lines per component rule
 */
export function ActivityAlertBanner({ alerts, loading }: ActivityAlertBannerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  const alertItems = [
    {
      label: 'New Tournaments',
      count: alerts.newTournaments,
      icon: Trophy,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      label: 'Live Streams',
      count: alerts.liveStreams,
      icon: Radio,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      pulse: alerts.liveStreams > 0,
    },
    {
      label: 'Videos Pending',
      count: alerts.videosPending,
      icon: Video,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
    },
    {
      label: 'New Users',
      count: alerts.newUsers,
      icon: UserPlus,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {alertItems.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 p-3 rounded-lg border ${item.bg} ${item.border} ${
            item.pulse ? 'animate-pulse' : ''
          }`}
        >
          <div className={`p-2 rounded-md bg-white/80 ${item.color}`}>
            <item.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{item.count}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
