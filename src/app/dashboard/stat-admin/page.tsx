'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { GameService } from '@/lib/services/gameService';
import { TeamService } from '@/lib/services/tournamentService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Database, BarChart3, Settings, Users, Activity, Play, Clock, Trophy, Zap, Target, Calendar } from 'lucide-react';

const StatAdminDashboard = () => {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  
  // Real assigned games data
  const [assignedGames, setAssignedGames] = useState<any[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'stat_admin')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  // Load assigned games when user is available
  useEffect(() => {
    const loadAssignedGames = async () => {
      if (!user || userRole !== 'stat_admin') {
        console.log('🚫 Skipping game load - no user or not stat_admin:', { user: !!user, userRole });
        return;
      }
      
      try {
        setGamesLoading(true);
        setGamesError(null);
        
        console.log('🔍 Loading assigned games for stat admin:', user.id);
        console.log('🔍 User object:', user);
        
        const games = await GameService.getAssignedGames(user.id);
        
        console.log('✅ Loaded assigned games:', games.length);
        console.log('✅ Games data:', games);
        
        setAssignedGames(games);
      } catch (error) {
        console.error('❌ Error loading assigned games:', error);
        console.error('❌ Error type:', typeof error);
        console.error('❌ Error instanceof Error:', error instanceof Error);
        
        const errorMessage = error instanceof Error ? error.message : 'Failed to load assigned games';
        console.error('❌ Setting error message:', errorMessage);
        
        setGamesError(errorMessage);
      } finally {
        console.log('🏁 Finished loading games, setting loading to false');
        setGamesLoading(false);
      }
    };

    if (user && userRole === 'stat_admin') {
      console.log('🚀 Starting to load assigned games...');
      loadAssignedGames();
    } else {
      console.log('⏸️ Not loading games - conditions not met:', { user: !!user, userRole });
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
      <main className="pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6 mt-6">
            {/* Modern Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Stat Admin Dashboard
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Track your assigned games and manage statistical data with precision and efficiency.
              </p>
            </div>

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
                      <div className="text-3xl font-bold">{assignedGames.length}</div>
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
                      <div className="text-3xl font-bold">{assignedGames.filter(g => g.status === 'completed').length}</div>
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
                      <div className="text-3xl font-bold">{assignedGames.filter(g => g.status !== 'completed').length}</div>
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
                        {assignedGames.length > 0 ? Math.round((assignedGames.filter(g => g.status === 'completed').length / assignedGames.length) * 100) : 0}%
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
                      GameService.getAssignedGames(user.id)
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
              {assignedGames.map((game) => (
              <div key={game.id} style={styles.toolCard}>
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
                    onClick={() => router.push(`/stat-tracker-v3?gameId=${game.id}&teamAId=${game.teamAId}&teamBId=${game.teamBId}`)}
                    style={{
                      background: 'var(--dashboard-gradient)',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                      transition: 'all 0.3s ease'
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
                    Launch Tracker
                  </button>
                  <div style={{ 
                    ...styles.toolStatus, 
                    ...styles.statusPending,
                    alignSelf: 'center'
                  }}>
                    {game.status}
                  </div>
                </div>
              </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatAdminDashboard; 