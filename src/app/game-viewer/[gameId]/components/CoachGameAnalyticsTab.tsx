/**
 * CoachGameAnalyticsTab - Game-Specific Analytics Display
 * 
 * PURPOSE: Display advanced analytics breakdown for a specific game in coach mode
 * - Shooting efficiency (FG%, 3PT%, FT%, eFG%, TS%)
 * - Shot selection metrics
 * - Team stats and top performers
 * 
 * Follows .cursorrules: <200 lines, UI component only
 * 
 * @module CoachGameAnalyticsTab
 */

'use client';

import React, { useEffect, useState } from 'react';
import { CoachAnalyticsService } from '@/lib/services/coachAnalyticsService';
import { GameBreakdown } from '@/lib/types/coachAnalytics';
import { Target, TrendingUp, Award, BarChart3 } from 'lucide-react';

interface CoachGameAnalyticsTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  isDark?: boolean;
  prefetchedData?: GameBreakdown | null;
}

export function CoachGameAnalyticsTab({ 
  gameId, 
  teamId, 
  isDark = true,
  prefetchedData 
}: CoachGameAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<GameBreakdown | null>(prefetchedData || null);
  const [loading, setLoading] = useState(!prefetchedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch if prefetched data is provided
    if (prefetchedData) {
      setAnalytics(prefetchedData);
      setLoading(false);
      return;
    }
    
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await CoachAnalyticsService.getGameBreakdown(gameId, teamId);
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading game analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [gameId, teamId, prefetchedData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={`p-6 text-center ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{error || 'No analytics data available'}</p>
      </div>
    );
  }

  const { teamStats, topPerformers } = analytics;
  const cardClass = `rounded-lg p-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200'} border`;
  const headerClass = `flex items-center gap-2 text-sm font-semibold uppercase mb-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`;
  const labelClass = isDark ? 'text-slate-400' : 'text-gray-500';
  const valueClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-orange-50/30'}`}>
      {/* Shooting Efficiency */}
      <div className={cardClass}>
        <h4 className={headerClass}><Target className="w-4 h-4" /> Shooting Efficiency</h4>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.effectiveFGPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>eFG%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.trueShootingPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>TS%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.fieldGoalPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>FG%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.threePointPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>3PT%</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${valueClass}`}>{teamStats.freeThrowPercentage}%</div>
            <div className={`text-xs ${labelClass}`}>FT%</div>
          </div>
        </div>
      </div>

      {/* Game Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Team Stats */}
        <div className={cardClass}>
          <h4 className={headerClass}><TrendingUp className="w-4 h-4" /> Game Stats</h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className={labelClass}>Points</span><span className={`font-semibold ${valueClass}`}>{teamStats.points}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Rebounds</span><span className={`font-semibold ${valueClass}`}>{teamStats.rebounds}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Assists</span><span className={`font-semibold ${valueClass}`}>{teamStats.assists}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Turnovers</span><span className={`font-semibold ${valueClass}`}>{teamStats.turnovers}</span></div>
            <div className="flex justify-between"><span className={labelClass}>AST/TO</span><span className={`font-semibold ${valueClass}`}>{teamStats.assistToTurnoverRatio}</span></div>
          </div>
        </div>

        {/* Shot Selection */}
        <div className={cardClass}>
          <h4 className={headerClass}><BarChart3 className="w-4 h-4" /> Shot Selection</h4>
          <div className="space-y-2">
            <div className="flex justify-between"><span className={labelClass}>3PT Rate</span><span className={`font-semibold ${valueClass}`}>{teamStats.threePointAttemptRate}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>FT Rate</span><span className={`font-semibold ${valueClass}`}>{teamStats.freeThrowRate}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>AST %</span><span className={`font-semibold ${valueClass}`}>{teamStats.assistPercentage}%</span></div>
            <div className="flex justify-between"><span className={labelClass}>Steals</span><span className={`font-semibold ${valueClass}`}>{teamStats.steals}</span></div>
            <div className="flex justify-between"><span className={labelClass}>Blocks</span><span className={`font-semibold ${valueClass}`}>{teamStats.blocks}</span></div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className={cardClass}>
          <h4 className={headerClass}><Award className="w-4 h-4" /> Top Performers</h4>
          <div className="space-y-3">
            {topPerformers.slice(0, 3).map((player, index) => (
              <div key={player.playerId || index} className={`flex items-center justify-between py-2 border-b last:border-0 ${isDark ? 'border-slate-700' : 'border-orange-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>{index + 1}</span>
                  <span className={`font-medium ${valueClass}`}>{player.playerName}</span>
                </div>
                <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{player.statLine}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
