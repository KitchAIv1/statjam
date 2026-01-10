'use client';

/**
 * VideoTrackingWidget - Compact video pipeline status display
 * 
 * Shows 4-state video tracking pipeline:
 * - Queue (pending)
 * - Assigned
 * - Tracking (in progress)
 * - Complete
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React from 'react';
import { Video, Clock, UserCheck, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { VideoQueueSummary } from '@/hooks/useCoachDashboardData';
import { VideoCreditsInline } from '@/components/shared/VideoCreditsInline';

interface VideoTrackingWidgetProps {
  videoQueue: VideoQueueSummary;
  videoCredits?: number;
  onViewAll?: () => void;
  onBuyCredits?: () => void;
}

export function VideoTrackingWidget({ 
  videoQueue, 
  videoCredits,
  onViewAll, 
  onBuyCredits,
}: VideoTrackingWidgetProps) {
  const statusItems = [
    { 
      label: 'Queue', 
      count: videoQueue.pending, 
      icon: Clock, 
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200'
    },
    { 
      label: 'Assigned', 
      count: videoQueue.assigned, 
      icon: UserCheck, 
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200'
    },
    { 
      label: 'Tracking', 
      count: videoQueue.inProgress, 
      icon: Loader2, 
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    { 
      label: 'Complete', 
      count: videoQueue.completed, 
      icon: CheckCircle, 
      bgColor: 'bg-orange-50/50',
      textColor: 'text-orange-500',
      borderColor: 'border-orange-100'
    },
  ];

  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Video className="w-4 h-4 text-orange-500" />
            Video Tracking
          </h3>
          {/* Video Credits - inline under header */}
          {videoCredits !== undefined && onBuyCredits && (
            <VideoCreditsInline
              credits={videoCredits}
              onBuyCredits={onBuyCredits}
              className="mt-0.5"
            />
          )}
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-6 text-xs text-gray-500">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label}
              className={`flex items-center justify-between p-2 rounded-lg ${item.bgColor} border ${item.borderColor}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${item.textColor} ${item.label === 'Tracking' ? 'animate-spin' : ''}`} />
                <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
              </div>
              <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

