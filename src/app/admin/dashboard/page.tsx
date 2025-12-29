'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { AdminService, UserStats } from '@/lib/services/adminService';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ExternalLink, Users, ArrowRight, Video } from 'lucide-react';
import Link from 'next/link';

/**
 * Admin Dashboard Page
 * Main admin interface with user management and analytics
 * Max 200 lines per component rule
 */
const AdminDashboardPage = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const userRole = user?.role;

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Auth check and redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }

    if (!loading && (!user || userRole !== 'admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load user statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user || userRole !== 'admin') return;

      try {
        setStatsLoading(true);
        setStatsError(null);
        const stats = await AdminService.getUserStats(user.id, userRole);
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load user stats:', error);
        setStatsError(error instanceof Error ? error.message : 'Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    if (user && userRole === 'admin') {
      loadStats();
    }
  }, [user, userRole]);

  // Loading state
  if (loading || !user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading Admin Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor users and site activity
          </p>
        </div>

        {/* Error Display */}
        {statsError && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{statsError}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {userStats && (
          <div className="mb-8">
            <AdminStatsCards stats={userStats} loading={statsLoading} />
          </div>
        )}

        {/* Quick Links Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/dashboard/admin/video-queue">
              <Card className="hover:border-purple-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Video className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Video Tracking Pipeline</h3>
                        <p className="text-sm text-muted-foreground">
                          Assignments, QC review, and clip generation
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/admin/coach-analytics">
              <Card className="hover:border-orange-500 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Coach Analytics</h3>
                        <p className="text-sm text-muted-foreground">
                          View your coach mode usage metrics
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Site Analytics Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Site Analytics
                  </CardTitle>
                  <CardDescription>
                    Real-time visitor analytics powered by Plausible
                  </CardDescription>
                </div>
                <a
                  href="https://plausible.io/statjam.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open in Plausible
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  data-plausible-embed="true"
                  src="https://plausible.io/share/statjam.net?auth=lQaTuDReWelORHMUP23-L&embed=true&theme=light"
                  scrolling="no"
                  frameBorder="0"
                  loading="lazy"
                  style={{ width: '100%', height: '100%' }}
                  title="Plausible Analytics"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <div className="mb-8">
          <AdminUserList userId={user?.id} userRole={userRole} />
        </div>

        {/* Role Breakdown */}
        {userStats && (
          <Card>
            <CardHeader>
              <CardTitle>User Distribution</CardTitle>
              <CardDescription>Breakdown by role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(userStats.usersByRole)
                  .sort(([, a], [, b]) => b - a)
                  .map(([role, count]) => {
                    const percentage = userStats.totalUsers > 0 
                      ? (count / userStats.totalUsers * 100).toFixed(1) 
                      : 0;
                    return (
                      <div key={role} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium capitalize">
                          {role.replace('_', ' ')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-20 text-right">
                              {count} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

