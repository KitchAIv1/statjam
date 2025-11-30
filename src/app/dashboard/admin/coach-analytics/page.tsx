/**
 * Coach Analytics Page - Admin view of coach usage metrics
 * 
 * PURPOSE: Display coach mode adoption and usage statistics
 * - Summary metrics (teams, games, stats)
 * - Recent activity
 * - Team breakdown
 * 
 * Follows .cursorrules: <200 lines, uses child components
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Gamepad2, BarChart3, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthContext } from '@/contexts/AuthContext';
import { CoachUsageMetrics, CoachGame, CoachTeam } from '@/lib/services/coachUsageService';
import { CoachAnalyticsSummary } from './CoachAnalyticsSummary';
import { CoachRecentGames } from './CoachRecentGames';
import { CoachTeamsList } from './CoachTeamsList';

export default function CoachAnalyticsPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<CoachUsageMetrics | null>(null);
  const [recentGames, setRecentGames] = useState<CoachGame[]>([]);
  const [teams, setTeams] = useState<CoachTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth');
      return;
    }

    // Only admins can view this page
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadAnalytics();
  }, [user, authLoading, router]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Use API route to bypass RLS (service role)
      const accessToken = localStorage.getItem('sb-access-token');
      const response = await fetch('/api/admin/coach-analytics', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      setMetrics(data.metrics);
      setRecentGames(data.recentGames);
      setTeams(data.teams);
    } catch (err: any) {
      console.error('❌ Failed to load coach analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-gray-600">Loading coach analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalytics}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/dashboard/admin')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Coach Mode Analytics
                </h1>
                <p className="text-sm text-gray-500">Platform-wide coach mode usage metrics</p>
              </div>
            </div>
            <Button onClick={loadAnalytics} variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        {metrics && <CoachAnalyticsSummary metrics={metrics} />}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Games */}
          <CoachRecentGames games={recentGames} />

          {/* Teams List */}
          <CoachTeamsList teams={teams} />
        </div>
      </div>
    </div>
  );
}

