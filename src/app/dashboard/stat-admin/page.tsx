'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { GameServiceV3 } from '@/lib/services/gameServiceV3';
import { StatAdminDashboardService } from '@/lib/services/statAdminDashboardService';
import { TeamService } from '@/lib/services/tournamentService';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrendingUp, Database, BarChart3, Settings, Activity, Play, Clock, Target, Calendar, BookOpen } from 'lucide-react';
import { PreFlightCheckModal, PreFlightSettings } from '@/components/tracker-v3/modals/PreFlightCheckModal';
import { AutomationFlags } from '@/lib/types/automation';
import { ProfileCard, ProfileCardSkeleton } from '@/components/profile/ProfileCard';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';
import { useStatAdminProfile } from '@/hooks/useStatAdminProfile';
import { ProfileService } from '@/lib/services/profileService';
import { AssignedVideosSection } from '@/components/stat-admin/AssignedVideosSection';
import { AssignedGamesList } from '@/components/stat-admin/AssignedGamesList';
import { DashboardCoreCards } from '@/components/stat-admin/DashboardCoreCards';
import { getAssignedVideos, VideoQueueItem } from '@/lib/services/videoAssignmentService';

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
  
  // 🎬 Video tracking stats
  const [videoStats, setVideoStats] = useState({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });
  const [videosLoading, setVideosLoading] = useState(true);
  
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

  // Load video tracking stats
  useEffect(() => {
    const loadVideoStats = async () => {
      if (!user || userRole !== 'stat_admin') {
        setVideosLoading(false);
        return;
      }
      
      try {
        setVideosLoading(true);
        const videos = await getAssignedVideos(user.id);
        
        // Calculate stats from videos
        const now = Date.now();
        const stats = {
          total: videos.length,
          assigned: videos.filter((v: VideoQueueItem) => v.video.assignmentStatus === 'assigned').length,
          inProgress: videos.filter((v: VideoQueueItem) => v.video.assignmentStatus === 'in_progress').length,
          completed: videos.filter((v: VideoQueueItem) => v.video.assignmentStatus === 'completed').length,
          overdue: videos.filter((v: VideoQueueItem) => {
            if (!v.hoursRemaining) return false;
            return v.hoursRemaining <= 0 && v.video.assignmentStatus !== 'completed';
          }).length
        };
        setVideoStats(stats);
      } catch (error) {
        console.error('❌ Error loading video stats:', error);
      } finally {
        setVideosLoading(false);
      }
    };

    if (user && userRole === 'stat_admin') {
      loadVideoStats();
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

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      <ErrorBoundary>
        <main className="pt-24 px-6 pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 3-Card Core Stats - Profile | Games | Videos */}
            <DashboardCoreCards
              profileData={profileData}
              profileLoading={profileLoading}
              gameStats={{
                total: totalGames ?? 0,
                completed: completedGames ?? 0,
                pending: pendingGames ?? 0,
                completionRate: completionRate ?? 0
              }}
              gamesLoading={gamesLoading}
              videoStats={videoStats}
              videosLoading={videosLoading}
              onEditProfile={() => setShowEditModal(true)}
              onShareProfile={handleShare}
            />

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

            {/* Assigned Videos Section - Videos from coaches pending tracking */}
            {user?.id && (
              <div className="mb-8">
                <AssignedVideosSection userId={user.id} />
              </div>
            )}

            {/* Assigned Games Section - List view, 1st→last, paginated */}
            <AssignedGamesList
              organizerGroups={assignedGames}
              loading={gamesLoading}
              error={gamesError}
              onRetry={() => {
                if (user) {
                  setGamesLoading(true);
                  setGamesError(null);
                  StatAdminDashboardService.getAssignedGamesOptimized(user.id)
                    .then(setAssignedGames)
                    .catch((err) => setGamesError(err.message))
                    .finally(() => setGamesLoading(false));
                }
              }}
              launchingTracker={launchingTracker}
              onLaunchTracker={(game) => {
                if (game.status === 'completed') {
                  setLaunchingTracker(game.id);
                  router.push(
                    `/stat-tracker-v3?gameId=${game.id}&teamAId=${game.teamAId}&teamBId=${game.teamBId}`
                  );
                  return;
                }
                setSelectedGame(game);
                setShowPreFlight(true);
              }}
              onViewDemo={(game) => router.push(`/game-viewer/${game.id}`)}
            />
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
          onStartTracking={async (settings: PreFlightSettings) => {
            setLaunchingTracker(selectedGame.id);
            
            // ✅ CRITICAL: Save settings to database BEFORE launching tracker
            try {
              console.log('💾 Saving automation settings to database:', settings.automation);
              console.log('💾 Saving quarter length:', settings.quarterLengthMinutes, 'minutes');
              
              // Save automation settings
              const automationSuccess = await GameServiceV3.updateGameAutomation(selectedGame.id, settings.automation);
              if (automationSuccess) {
                console.log('✅ Game automation settings saved successfully');
              } else {
                console.error('❌ Failed to save automation settings');
              }
              
              // Save quarter length to game_clock_minutes (sets initial clock)
              // ✅ ONLY save for scheduled games - don't overwrite in-progress games!
              if (selectedGame.status === 'scheduled' || !selectedGame.status) {
                // ✅ Use GameServiceV3 for authenticated raw HTTP (old GameService had RLS issues)
                const clockSuccess = await GameServiceV3.updateInitialClock(selectedGame.id, {
                  minutes: settings.quarterLengthMinutes,
                  seconds: 0,
                  isRunning: false
                });
                if (clockSuccess) {
                  console.log('✅ Quarter length saved successfully:', settings.quarterLengthMinutes, 'min');
                  
                  // ✅ Clear stale caches and update localStorage with new quarter length
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem(`clock_backup_${selectedGame.id}`);
                    localStorage.setItem(`quarterLength_${selectedGame.id}`, String(settings.quarterLengthMinutes));
                    console.log('🧹 Cleared stale clock backup, updated localStorage quarter length');
                  }
                } else {
                  console.error('❌ Failed to save quarter length');
                }
              } else {
                console.log('⏭️ Skipping quarter length save - game already in progress');
                // ✅ Still clear sessionStorage backup for in-progress games
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem(`clock_backup_${selectedGame.id}`);
                }
              }
            } catch (error) {
              console.error('❌ Failed to save pre-flight settings:', error);
              alert('Warning: Failed to save settings. Using defaults.');
            }
            
            // Close modal
            setShowPreFlight(false);
            
            // ✅ IMPORTANT: Add small delay to ensure database write completes
            setTimeout(() => {
              router.push(
                `/stat-tracker-v3?gameId=${selectedGame.id}&teamAId=${selectedGame.teamAId}&teamBId=${selectedGame.teamBId}`
              );
            }, 300);
          }}
          gameId={selectedGame.id}
          gameName={`${selectedGame.teamA} vs ${selectedGame.teamB}`}
          tournamentName={selectedGame.tournamentName}
          gameStatus={selectedGame.status || 'scheduled'}
          tournamentDefaults={selectedGame.tournament?.automation_flags || {
            clock: { enabled: true, autoPause: true, autoReset: true, ftMode: true, madeBasketStop: false },
            possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: false },
            sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: true, linkEvents: true, freeThrowSequence: true },
            fouls: { enabled: false, bonusFreeThrows: false, foulOutEnforcement: false, technicalEjection: false },
            undo: { enabled: false, maxHistorySize: 50 }
          }}
          defaultQuarterLength={[5, 6, 8, 10, 12, 18, 20].includes(Number(selectedGame.quarter_length_minutes)) ? selectedGame.quarter_length_minutes : undefined}
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