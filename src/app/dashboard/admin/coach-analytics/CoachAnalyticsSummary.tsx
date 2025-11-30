/**
 * CoachAnalyticsSummary - Summary metric cards
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import { Users, Gamepad2, CheckCircle, Clock, Activity, Calendar } from 'lucide-react';
import { CoachUsageMetrics } from '@/lib/services/coachUsageService';

interface CoachAnalyticsSummaryProps {
  metrics: CoachUsageMetrics;
}

export function CoachAnalyticsSummary({ metrics }: CoachAnalyticsSummaryProps) {
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No activity yet';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cards = [
    {
      label: 'Teams Created',
      value: metrics.totalTeams,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: 'Total Games',
      value: metrics.totalGames,
      icon: Gamepad2,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      label: 'Completed',
      value: metrics.completedGames,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      label: 'In Progress',
      value: metrics.inProgressGames,
      icon: Clock,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      label: 'Stats Recorded',
      value: metrics.totalStatsRecorded,
      icon: Activity,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-xl p-4 border border-gray-100`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${card.color} p-1.5 rounded-lg`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600">{card.label}</span>
            </div>
            <p className={`text-2xl font-bold ${card.textColor}`}>
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Last Active Banner */}
      <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Last Activity</span>
        </div>
        <span className="text-sm font-medium text-gray-900">
          {formatDate(metrics.lastActiveDate)}
        </span>
      </div>
    </div>
  );
}

