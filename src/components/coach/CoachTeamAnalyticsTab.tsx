/**
 * Coach Team Analytics Tab Component
 * 
 * Displays comprehensive team analytics including:
 * - Team performance metrics
 * - Radar chart visualization
 * - Efficiency ratings
 * - Shooting stats
 * 
 * Follows .cursorrules: <200 lines, UI component only
 * 
 * @module CoachTeamAnalyticsTab
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamRadarChart } from './charts/TeamRadarChart';
import { CoachAnalyticsService } from '@/lib/services/coachAnalyticsService';
import { TeamAnalytics } from '@/lib/types/coachAnalytics';
import { TrendingUp, TrendingDown, Activity, Target, Zap } from 'lucide-react';

interface CoachTeamAnalyticsTabProps {
  teamId: string;
  teamName: string;
}

/**
 * CoachTeamAnalyticsTab - Team analytics display
 * 
 * Features:
 * - Radar chart for key metrics
 * - Efficiency ratings
 * - Shooting percentages
 * - Advanced stats (eFG%, TS%, etc.)
 */
export function CoachTeamAnalyticsTab({ teamId, teamName }: CoachTeamAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await CoachAnalyticsService.getTeamAnalytics(teamId);
        setAnalytics(data);
      } catch (err) {
        console.error('Error loading team analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-2">
            {error || 'No analytics data available'}
          </p>
          <p className="text-sm text-gray-500">
            Complete some games to see team analytics
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data (scale to 0-100)
  const radarData = [
    { label: 'Offense', value: Math.min((analytics.offensiveRating / 120) * 100, 100) },
    { label: 'Defense', value: Math.min(100 - (analytics.defensiveRating / 120) * 100, 100) },
    { label: 'Pace', value: Math.min((analytics.pace / 100) * 100, 100) },
    { label: 'eFG%', value: analytics.effectiveFGPercentage },
    { label: 'AST/TO', value: Math.min((analytics.assistToTurnoverRatio / 3) * 100, 100) }
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Offensive Rating</p>
                <p className="text-2xl font-bold">{analytics.offensiveRating}</p>
                <p className="text-xs opacity-75">Points per 100 poss.</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Defensive Rating</p>
                <p className="text-2xl font-bold">{analytics.defensiveRating}</p>
                <p className="text-xs opacity-75">Opp. pts per 100 poss.</p>
              </div>
              <TrendingDown className="w-8 h-8 opacity-75" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Pace</p>
                <p className="text-2xl font-bold">{analytics.pace}</p>
                <p className="text-xs opacity-75">Possessions per game</p>
              </div>
              <Zap className="w-8 h-8 opacity-75" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            Team Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TeamRadarChart data={radarData} size={300} />
        </CardContent>
      </Card>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shooting Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Shooting Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">eFG%</span>
              <span className="font-semibold">{analytics.effectiveFGPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">TS%</span>
              <span className="font-semibold">{analytics.trueShootingPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FG%</span>
              <span className="font-semibold">{analytics.fieldGoalPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">3PT%</span>
              <span className="font-semibold">{analytics.threePointPercentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">FT%</span>
              <span className="font-semibold">{analytics.freeThrowPercentage}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Per-Game Averages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Per-Game Averages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Points</span>
              <span className="font-semibold">{analytics.pointsPerGame}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rebounds</span>
              <span className="font-semibold">{analytics.reboundsPerGame}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Assists</span>
              <span className="font-semibold">{analytics.assistsPerGame}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Turnovers</span>
              <span className="font-semibold">{analytics.turnoversPerGame}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">AST/TO Ratio</span>
              <span className="font-semibold">{analytics.assistToTurnoverRatio}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shot Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shot Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{analytics.threePointAttemptRate}%</p>
              <p className="text-sm text-gray-600 mt-1">3PT Attempt Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-500">{analytics.freeThrowRate}%</p>
              <p className="text-sm text-gray-600 mt-1">FT Rate</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-500">{analytics.assistPercentage}%</p>
              <p className="text-sm text-gray-600 mt-1">Assist %</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games Played Footer */}
      <p className="text-center text-sm text-gray-500">
        Based on {analytics.gamesPlayed} completed {analytics.gamesPlayed === 1 ? 'game' : 'games'}
      </p>
    </div>
  );
}

