'use client';

import React, { useState, useMemo } from 'react';
import { Film, Filter, ChevronDown } from 'lucide-react';
import { QCStatCard } from './QCStatCard';
import { ClipEligibleStat } from '@/lib/services/clipService';

interface QCReviewTimelineProps {
  stats: ClipEligibleStat[];
  onSeekToTime: (timestampMs: number) => void;
  onStatSelect: (statId: string) => void;
  onEditStat?: (statId: string) => void;
  selectedStatId: string | null;
  /** Video duration in ms - used to mark out-of-range clips */
  videoDurationMs?: number;
  /** Current video position in ms - for "Mark at current position" */
  currentVideoTimeMs?: number;
  /** Callback when marking a stat at current position */
  onMarkAtCurrentPosition?: (statId: string) => void;
  /** Callback to update shot location */
  onShotLocationUpdate?: (statId: string, x: number, y: number, zone: string) => void;
}

type FilterType = 'all' | 'clip_eligible' | 'not_eligible';

/**
 * Timeline of stats for QC review
 * Shows all tracked stats with clip eligibility status
 */
export function QCReviewTimeline({
  stats,
  onSeekToTime,
  onStatSelect,
  onEditStat,
  selectedStatId,
  videoDurationMs,
  currentVideoTimeMs,
  onMarkAtCurrentPosition,
  onShotLocationUpdate,
}: QCReviewTimelineProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter stats based on selection
  const filteredStats = useMemo(() => {
    switch (filter) {
      case 'clip_eligible':
        return stats.filter(s => s.is_clip_eligible);
      case 'not_eligible':
        return stats.filter(s => !s.is_clip_eligible);
      default:
        return stats;
    }
  }, [stats, filter]);

  // Group stats by quarter
  const statsByQuarter = useMemo(() => {
    return filteredStats.reduce((acc, stat) => {
      const q = `Q${stat.quarter}`;
      if (!acc[q]) acc[q] = [];
      acc[q].push(stat);
      return acc;
    }, {} as Record<string, ClipEligibleStat[]>);
  }, [filteredStats]);

  // Stats summary
  const clipEligibleCount = stats.filter(s => s.is_clip_eligible).length;
  const totalCount = stats.length;

  const filterLabels: Record<FilterType, string> = {
    all: 'All Stats',
    clip_eligible: 'Clip Eligible',
    not_eligible: 'No Clip',
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Stats Timeline</h3>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span>{filterLabels[filter]}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilter(key);
                      setShowFilterMenu(false);
                    }}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg
                      ${filter === key ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}
                    `}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Film className="w-4 h-4 text-green-500" />
            <span className="font-medium text-gray-900">{clipEligibleCount}</span>
            <span className="text-gray-500">clips</span>
          </div>
          <div className="text-gray-400">•</div>
          <div className="text-gray-500">
            {totalCount} total stats
          </div>
        </div>
      </div>

      {/* Stats List */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(statsByQuarter).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No stats found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(statsByQuarter).map(([quarter, quarterStats]) => (
              <div key={quarter}>
                {/* Quarter Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {quarter}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {quarterStats.filter(s => s.is_clip_eligible).length} clips
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-2">
                  {quarterStats.map((stat) => {
                    const isOutOfRange = videoDurationMs !== undefined && 
                      stat.video_timestamp_ms > videoDurationMs;
                    return (
                      <QCStatCard
                        key={`${stat.id}-${stat.video_timestamp_ms}`}
                        stat={stat}
                        isSelected={selectedStatId === stat.id}
                        onSelect={() => onStatSelect(stat.id)}
                        onSeekToTime={() => onSeekToTime(stat.video_timestamp_ms)}
                        onEdit={onEditStat ? () => onEditStat(stat.id) : undefined}
                        isOutOfRange={isOutOfRange}
                        currentVideoTimeMs={currentVideoTimeMs}
                        onMarkAtCurrentPosition={onMarkAtCurrentPosition ? () => onMarkAtCurrentPosition(stat.id) : undefined}
                        onShotLocationUpdate={onShotLocationUpdate}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

