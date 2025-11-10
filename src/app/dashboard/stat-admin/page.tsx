'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { GameService } from '@/lib/services/gameService';
import { GameServiceV3 } from '@/lib/services/gameServiceV3';
import { StatAdminDashboardService } from '@/lib/services/statAdminDashboardService';
import { TeamService } from '@/lib/services/tournamentService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrendingUp, Database, BarChart3, Settings, Users, Activity, Play, Clock, Trophy, Zap, Target, Calendar, Eye, Lightbulb, BookOpen } from 'lucide-react';
import { PreFlightCheckModal } from '@/components/tracker-v3/modals/PreFlightCheckModal';
import { AutomationFlags } from '@/lib/types/automation';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { useStatAdminProfile } from '@/hooks/useStatAdminProfile';
import { ProfileService } from '@/lib/services/profileService';

const StatAdminDashboard = () => {
  const { user, loading } = useAuthContext(); // ✅ NO API CALL - Uses context
  const router = useRouter();
  const userRole = user?.role;
  
  // Real assigned games data
  const [assignedGames, setAssignedGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true); // Start as true to prevent flash
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [launchingTracker, setLaunchingTracker] = useState<string | null>(null);
  
  // ✅ PRE-FLIGHT CHECK: Modal state
  const [showPreFlight, setShowPreFlight] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  
  // ⚡ Profile data
  const { profileData, loading: profileLoading, updateProfile } = useStatAdminProfile(user?.id || '');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Handle profile share
  const handleShare = async () => {
    if (!profileData) return;
    
    const shareData = ProfileService.generateShareData(profileData);
    
    try {
      await navigator.clipboard.writeText(shareData.profileUrl);
      alert('✅ Profile link copied to clipboard!');
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  // Calculate flat games array and stats from grouped data (only when data is loaded)
  const flatGames = gamesLoading ? [] : assignedGames.flatMap(organizerGroup => organizerGroup.games || []);
  const totalGames = gamesLoading ? null : flatGames.length;
  const completedGames = gamesLoading ? null : flatGames.filter(game => game.status === 'completed').length;
  const pendingGames = gamesLoading ? null : flatGames.filter(game => game.status !== 'completed').length;
  const completionRate = gamesLoading ? null : (totalGames && totalGames > 0 ? Math.round(((completedGames || 0) / totalGames) * 100) : 0);

  // Debug logging for stats calculation (development only)
  if (process.env.NODE_ENV !== 'production' && !gamesLoading && assignedGames.length > 0) {
    console.log('📊 StatAdmin Dashboard Stats:', {
      version: 'Optimized (Cached + Parallel)',
      totalGames,
      completedGames,
      pendingGames,
      completionRate
    });
  }

  useEffect(() => {
    // ✅ Clear redirect flag when dashboard loads successfully
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth-redirecting');
    }
    
    if (!loading && (!user || userRole !== 'stat_admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load assigned games when user is available
  useEffect(() => {
    const loadAssignedGames = async () => {
      if (!user || userRole !== 'stat_admin') {
        return;
      }
      
      try {
        setGamesLoading(true);
        setGamesError(null);
        
        // ✅ OPTIMIZED: Use new StatAdminDashboardService with caching + parallel fetching
        const games = await StatAdminDashboardService.getAssignedGamesOptimized(user.id);
        setAssignedGames(games);
      } catch (error) {
        console.error('❌ Error loading assigned games:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load assigned games';
        setGamesError(errorMessage);
      } finally {
        setGamesLoading(false);
      }
    };

    if (user && userRole === 'stat_admin') {
      loadAssignedGames();
    } else {
      // Set loading to false if conditions aren't met to prevent infinite loading
      setGamesLoading(false);
    }
  }, [user, userRole]);

  if (loading || !user || userRole !== 'stat_admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#FFD700',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading Stat Admin Dashboard...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'var(--dashboard-bg)',
      paddingTop: '100px',
      paddingBottom: '60px',
    },
    content: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px',
    },
    header: {
      marginBottom: '48px',
      textAlign: 'center',
    },
    title: {
      fontSize: '48px',
      fontWeight: '700',
      background: 'var(--dashboard-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      marginBottom: '16px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '18px',
      color: 'var(--dashboard-text-secondary)',
      fontWeight: '400',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '48px',
    },
    statCard: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      backdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    statCardHover: {
      transform: 'translateY(-4px)',
      borderColor: 'var(--dashboard-border-hover)',
      boxShadow: '0 20px 40px rgba(249, 115, 22, 0.1)',
    },
    statIcon: {
      width: '56px',
      height: '56px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    statTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--dashboard-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '8px',
      fontFamily: "'Anton', system-ui, sans-serif",
    },
    statChange: {
      fontSize: '14px',
      color: 'var(--dashboard-primary)',
      fontWeight: '500',
    },
    section: {
      marginBottom: '48px',
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '24px',
    },
    adminTools: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '24px',
      marginBottom: '48px',
    },
    toolCard: {
      background: 'var(--dashboard-card)',
      borderRadius: '16px',
      padding: '32px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    toolCardHover: {
      transform: 'translateY(-2px)',
      borderColor: 'var(--dashboard-border-hover)',
      boxShadow: '0 12px 24px rgba(249, 115, 22, 0.1)',
    },
    toolIcon: {
      width: '56px',
      height: '56px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    toolTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '12px',
    },
    toolDescription: {
      fontSize: '14px',
      color: 'var(--dashboard-text-secondary)',
      lineHeight: '1.6',
      marginBottom: '16px',
    },
    toolStatus: {
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 12px',
      borderRadius: '20px',
      display: 'inline-block',
    },
    statusActive: {
      background: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
    },
    statusPending: {
      background: 'rgba(249, 115, 22, 0.2)',
      color: 'var(--dashboard-primary)',
    },
    comingSoon: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '48px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      textAlign: 'center',
    },
    comingSoonIcon: {
      width: '64px',
      height: '64px',
      background: 'var(--dashboard-gradient)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    comingSoonTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '12px',
    },
    comingSoonText: {
      fontSize: '16px',
      color: 'var(--dashboard-text-secondary)',
      lineHeight: '1.6',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ErrorBoundary>
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Profile Card */}
            {!profileLoading && profileData && (
              <ProfileCard
                profileData={profileData}
                shareData={ProfileService.generateShareData(profileData)}
                onEdit={() => setShowEditModal(true)}
                onShare={handleShare}
              />
            )}

            {/* Modern Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                    <CardTitle className="text-sm font-medium text-white/90">Games Assigned</CardTitle>
                    <div className="relative">
                      <Trophy className="h-5 w-5 text-white" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">
                        {gamesLoading ? (
                          <div className="w-12 h-9 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          totalGames
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Active
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mt-1">Total assigned games</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                    <CardTitle className="text-sm font-medium text-white/90">Completed Games</CardTitle>
                    <div className="relative">
                      <Target className="h-5 w-5 text-white" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">
                        {gamesLoading ? (
                          <div className="w-12 h-9 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          completedGames
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Done
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mt-1">Successfully tracked</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                    <CardTitle className="text-sm font-medium text-white/90">Pending Games</CardTitle>
                    <div className="relative">
                      <Calendar className="h-5 w-5 text-white" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">
                        {gamesLoading ? (
                          <div className="w-12 h-9 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          pendingGames
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        Waiting
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mt-1">Upcoming assignments</p>
                  </CardContent>
                </div>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-red-500 to-red-600 relative">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                    <CardTitle className="text-sm font-medium text-white/90">Completion Rate</CardTitle>
                    <div className="relative">
                      <TrendingUp className="h-5 w-5 text-white" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-white">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold">
                        {gamesLoading ? (
                          <div className="w-16 h-9 bg-white/20 rounded animate-pulse"></div>
                        ) : (
                          `${completionRate}%`
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" />
                        Rate
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mt-1">Games completed</p>
                  </CardContent>
                </div>
              </Card>
            </div>

            {/* Quick Access - Automation Guide */}
            <div className="mb-8">
              <Card 
                className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-orange-200 dark:border-orange-800 cursor-pointer overflow-hidden"
                onClick={() => router.push('/dashboard/stat-admin/automation-guide')}
              >
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Tracker Automation Guide
                        </h3>
                        <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full font-medium flex-shrink-0">NEW</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Learn the differences between Minimal, Balanced, and Full automation modes
                      </p>
                    </div>
                    <div className="text-orange-600 dark:text-orange-400 flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assigned Games Section */}
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <CardTitle>My Assigned Games</CardTitle>
                </div>
                <CardDescription>Track and manage your game assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {gamesLoading ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#FFD700', fontSize: '16px', marginBottom: '8px' }}>
                  Loading assigned games...
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  Fetching your game assignments
                </div>
              </div>
            </div>
          ) : gamesError ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ color: '#ff4444', fontSize: '16px', marginBottom: '8px' }}>
                  Error loading games
                </div>
                <div style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
                  {gamesError}
                </div>
                <button
                  onClick={() => {
                    if (user) {
                      setGamesLoading(true);
                      setGamesError(null);
                      // ✅ OPTIMIZED: Use StatAdminDashboardService with caching
                      StatAdminDashboardService.getAssignedGamesOptimized(user.id)
                        .then(setAssignedGames)
                        .catch((error) => setGamesError(error.message))
                        .finally(() => setGamesLoading(false));
                    }
                  }}
                  style={{
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : assignedGames.length === 0 ? (
            <div style={styles.toolCard}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={styles.toolIcon}>
                  <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                </div>
                <div style={{ color: '#888', fontSize: '16px', marginBottom: '8px' }}>
                  No games assigned yet
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>
                  Tournament organizers will assign games to you. Check back later or contact your organizer.
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.adminTools}>
              {(Array.isArray(assignedGames) ? assignedGames : []).map((organizerGroup: any) => (
                <div key={organizerGroup.organizerId} style={{ marginBottom: '32px' }}>
                  {/* Organizer Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '16px',
                    color: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Users style={{ width: '20px', height: '20px' }} />
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600' }}>
                          {organizerGroup.organizerName}
                        </div>
                        <div style={{ fontSize: '14px', opacity: '0.9' }}>
                          {organizerGroup.games?.length || 0} game{(organizerGroup.games?.length || 0) !== 1 ? 's' : ''} assigned
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Games for this organizer */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                    {(organizerGroup.games || []).map((game: any) => (
                      <div 
                        key={game.id} 
                        style={{
                          ...styles.toolCard,
                          ...(game.is_demo ? {
                            border: '2px solid #f59e0b',
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            position: 'relative' as const
                          } : {})
                        }}
                      >
                        {/* Demo Badge */}
                        {game.is_demo && (
                          <div style={{
                            position: 'absolute' as const,
                            top: '12px',
                            right: '12px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#fff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.5px'
                          }}>
                            <Lightbulb style={{ width: '12px', height: '12px' }} />
                            Demo
                          </div>
                        )}
                        
                        <div style={styles.toolIcon}>
                          <Trophy style={{ width: '24px', height: '24px', color: '#1a1a1a' }} />
                        </div>
                        <div style={styles.toolTitle}>{game.tournamentName}</div>
                        <div style={styles.toolDescription}>
                          <strong>{game.teamA}</strong> vs <strong>{game.teamB}</strong><br />
                          {new Date(game.scheduledDate).toLocaleDateString()} at {new Date(game.scheduledDate).toLocaleTimeString()}<br />
                          Venue: {game.venue}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                          <button
                            onClick={async () => {
                              // ✅ PRE-FLIGHT CHECK: Show modal instead of direct launch
                              setSelectedGame(game);
                              setShowPreFlight(true);
                            }}
                            disabled={launchingTracker === game.id}
                            style={{
                              background: launchingTracker === game.id ? 'rgba(249, 115, 22, 0.7)' : 'var(--dashboard-gradient)',
                              color: '#1a1a1a',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px 16px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: launchingTracker === game.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                              transition: 'all 0.3s ease',
                              opacity: launchingTracker === game.id ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)';
                            }}
                          >
                            <Zap size={16} />
                            {launchingTracker === game.id ? 'Launching...' : 'Launch Tracker'}
                          </button>
                          
                          {/* Eye Viewer Button - Only for Demo Games */}
                          {game.is_demo && (
                            <button
                              onClick={() => {
                                router.push(`/game-viewer/${game.id}`);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                              }}
                            >
                              <Eye size={16} />
                              View Demo
                            </button>
                          )}
                          
                          <div style={{ 
                            ...styles.toolStatus, 
                            ...(game.is_demo ? {
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: '#fff',
                              fontWeight: '700',
                              textTransform: 'uppercase' as const,
                              letterSpacing: '0.5px'
                            } : styles.statusPending),
                            alignSelf: 'center'
                          }}>
                            {game.is_demo ? 'DEMO' : game.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </ErrorBoundary>
      
      {/* ✅ PRE-FLIGHT CHECK MODAL */}
      {showPreFlight && selectedGame && (
        <PreFlightCheckModal
          isOpen={showPreFlight}
          onClose={() => {
            setShowPreFlight(false);
            setSelectedGame(null);
          }}
          onStartTracking={async (settings: AutomationFlags) => {
            setLaunchingTracker(selectedGame.id);
            
            // ✅ CRITICAL: Save settings to database BEFORE launching tracker
            try {
              console.log('💾 Saving automation settings to database:', settings);
              const success = await GameServiceV3.updateGameAutomation(selectedGame.id, settings);
              if (success) {
                console.log('✅ Game automation settings saved successfully');
              } else {
                console.error('❌ Failed to save automation settings - updateGameAutomation returned false');
              }
            } catch (error) {
              console.error('❌ Failed to save automation settings:', error);
              // Don't block tracker launch, but warn user
              alert('Warning: Failed to save automation settings. Using tournament defaults.');
            }
            
            // Close modal
            setShowPreFlight(false);
            
            // ✅ IMPORTANT: Add small delay to ensure database write completes
            setTimeout(() => {
              router.push(
                `/stat-tracker-v3?gameId=${selectedGame.id}&teamAId=${selectedGame.teamAId}&teamBId=${selectedGame.teamBId}`
              );
            }, 300); // Increased from 100ms to 300ms
          }}
          gameId={selectedGame.id}
          gameName={`${selectedGame.teamA} vs ${selectedGame.teamB}`}
          tournamentName={selectedGame.tournamentName}
          tournamentDefaults={selectedGame.tournament?.automation_flags || {
            clock: { enabled: true, autoPause: true, autoReset: true, ftMode: true, madeBasketStop: false },
            possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: false },
            sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: true, linkEvents: true, freeThrowSequence: true },
            fouls: { enabled: false, bonusFreeThrows: false, foulOutEnforcement: false, technicalEjection: false },
            undo: { enabled: false, maxHistorySize: 50 }
          }}
          userRole="stat_admin"
        />
      )}

      {/* Profile Edit Modal */}
      {profileData && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profileData={profileData}
          onSave={updateProfile}
        />
      )}
    </div>
  );
};

export default StatAdminDashboard; 