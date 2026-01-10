'use client';

/**
 * Coach Video Upload Page
 * 
 * Allows coaches to upload game videos for stat tracking.
 * Videos are tracked by assigned stat admins, NOT by coaches.
 * 
 * Flow:
 * 1. Setup game details & player roster
 * 2. Upload video
 * 3. Show processing status
 * 4. Show status card with 24hr countdown until tracking complete
 */

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { VideoUploader } from '@/components/video/VideoUploader';
import { VideoSetupPanel } from '@/components/video/VideoSetupPanel';
import { VideoProcessingStatus } from '@/components/video/VideoProcessingStatus';
import { CoachVideoStatusCard } from '@/components/video/CoachVideoStatusCard';
import { useVideoProcessingStatus } from '@/hooks/useVideoProcessingStatus';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useSubscription } from '@/hooks/useSubscription';
import { VideoStatService } from '@/lib/services/videoStatService';
import { CoachGameService } from '@/lib/services/coachGameService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { isBunnyConfigured } from '@/lib/config/videoConfig';
import { UpgradeModal, VideoCreditsModal } from '@/components/subscription';
import type { GameVideo } from '@/lib/types/video';
import { Loader2, ArrowLeft, Video, AlertCircle, Upload, CreditCard, Calendar } from 'lucide-react';

interface CoachVideoPageProps {
  params: Promise<{ gameId: string }>;
}

export default function CoachVideoPage({ params }: CoachVideoPageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  const { tier: subscriptionTier, limits, videoCredits, refetch: refetchSubscription, loading: subLoading } = useSubscription('coach');
  
  // State
  const [gameVideo, setGameVideo] = useState<GameVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showVideoCreditsModal, setShowVideoCreditsModal] = useState(false);
  const [hasHandledReady, setHasHandledReady] = useState(false);
  
  // Daily upload limit state
  const [dailyUploads, setDailyUploads] = useState({ uploadsToday: 0, limit: 2, remaining: 2, isExempt: false });
  const [limitLoading, setLimitLoading] = useState(true);
  
  // User has video access if subscribed OR has video credits
  const hasVideoAccess = limits.hasVideoAccess || videoCredits > 0;
  
  // Check video access (subscription OR credits)
  useEffect(() => {
    if (!authLoading && !subLoading && !hasVideoAccess) {
      setShowUpgradeModal(true);
    }
  }, [authLoading, subLoading, hasVideoAccess]);
  
  // Check daily upload limit
  useEffect(() => {
    async function checkLimit() {
      if (!user?.id) return;
      setLimitLoading(true);
      try {
        const status = await VideoStatService.getDailyUploadStatus(user.id, 'coach');
        setDailyUploads(status);
      } catch (error) {
        console.error('Error checking daily limit:', error);
      } finally {
        setLimitLoading(false);
      }
    }
    if (user?.id) checkLimit();
  }, [user?.id]);
  
  // Poll for video processing status
  const { status: processingStatus } = useVideoProcessingStatus({
    videoId: uploadedVideoId,
    enabled: !!uploadedVideoId && gameVideo?.status === 'processing' && !hasHandledReady,
    pollIntervalMs: 15000,
    onReady: async (status) => {
      if (hasHandledReady) return;
      setHasHandledReady(true);
      
      const video = await VideoStatService.getGameVideo(gameId);
      if (video) {
        await VideoStatService.updateVideoStatus(video.id, 'ready', undefined, status.duration);
        setGameVideo({ ...video, status: 'ready', durationSeconds: status.duration });
        setUploadedVideoId(null);
      }
    },
    onError: () => {
      setUploadedVideoId(null);
      setHasHandledReady(false);
    },
  });
  
  // Load game and video data
  useEffect(() => {
    async function loadData() {
      if (!gameId || !user) return;
      
      try {
        setVideoLoading(true);
        const game = await CoachGameService.getGame(gameId);
        setGameData(game);
        
        if (game?.coach_team_id) {
          const players = await CoachPlayerService.getCoachTeamPlayers(game.coach_team_id);
          setTeamPlayers(players.map((p: any) => ({
            id: p.id,
            name: p.name || 'Unknown',
            jerseyNumber: p.jersey_number,
            is_custom_player: p.is_custom_player || p.id?.startsWith('custom-'),
          })));
        }
        
        const video = await VideoStatService.getGameVideo(gameId);
        setGameVideo(video);
        
        if (video?.status === 'processing' && video.bunnyVideoId) {
          setUploadedVideoId(video.bunnyVideoId);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setVideoLoading(false);
      }
    }
    
    if (user) loadData();
  }, [gameId, user]);
  
  // Handle upload complete
  const handleUploadComplete = async (bunnyVideoId: string) => {
    console.log('🎬 handleUploadComplete called with bunnyVideoId:', bunnyVideoId);
    setHasHandledReady(false);
    setUploadedVideoId(bunnyVideoId);
    
    // Check if this is a new upload or re-upload
    const existingVideo = await VideoStatService.getGameVideo(gameId);
    const isNewUpload = !existingVideo || existingVideo.bunnyVideoId !== bunnyVideoId;
    console.log('📊 Upload type:', isNewUpload ? 'NEW' : 'RE-UPLOAD', 'existingVideoId:', existingVideo?.bunnyVideoId);
    
    try {
      console.log('📝 Creating/updating game video record...');
      await VideoStatService.createGameVideo(
        gameId,
        process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
        bunnyVideoId,
        user?.id || ''
      );
      console.log('✅ Game video record created/updated');
      
      // Consume video credit only for NEW uploads (not re-uploads to same game)
      if (isNewUpload && user?.id) {
        console.log('💳 NEW upload - consuming video credit for user:', user.id);
        const consumed = await SubscriptionService.consumeVideoCredit(user.id, 'coach');
        console.log('💳 Credit consumed result:', consumed);
        if (consumed) {
          // Small delay to ensure DB commit is fully propagated
          console.log('🔄 Waiting for DB propagation...');
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('🔄 Refetching subscription to update UI...');
          await refetchSubscription();
          console.log('✅ Subscription refetched');
        }
      } else if (!isNewUpload) {
        console.log('♻️ Re-upload detected - NOT consuming credit (already paid)');
      } else {
        console.log('⚠️ No user.id - cannot consume credit');
      }
    } catch (err) {
      console.error('❌ Error in handleUploadComplete:', err);
    }
    
    const video = await VideoStatService.getGameVideo(gameId);
    setGameVideo(video);
  };
  
  // Loading state
  if (authLoading || subLoading || videoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                      flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                    flex flex-col">
      <NavigationHeader />
      
      <main className="flex-1 pt-24 px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/coach')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Video className="w-5 h-5 text-orange-500" />
                  Upload Game Video
                </h1>
                {gameData && (
                  <p className="text-sm text-muted-foreground">
                    vs {gameData.opponent_name || 'Opponent'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          {!gameVideo && !setupComplete ? (
            /* Setup Phase */
            <div className="flex items-center justify-center py-8">
              <VideoSetupPanel
                gameData={gameData || { id: gameId }}
                teamPlayers={teamPlayers}
                onPlayersUpdate={setTeamPlayers}
                onSetupComplete={() => setSetupComplete(true)}
                onGameDataUpdate={(updates) => setGameData((prev: any) => ({ ...prev, ...updates }))}
                onSaveScore={async (gId, home, away) => {
                  await CoachGameService.updateGame(gId, { home_score: home, away_score: away });
                }}
              />
            </div>
          ) : !gameVideo ? (
            /* Upload Section */
            <div className="flex items-center justify-center py-8">
              {isBunnyConfigured() ? (
                <div className="bg-white rounded-xl p-8 max-w-md w-full border border-orange-200 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Upload Game Video</h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      Upload your game video. Our stat trackers will complete tracking by midnight tomorrow (EST).
                    </p>
                  </div>
                  
                  {/* Credits Status / Buy Credits */}
                  <button
                    onClick={() => setShowVideoCreditsModal(true)}
                    className={`w-full mb-4 p-3 rounded-lg flex items-center justify-between hover:shadow-md transition-all
                      ${videoCredits > 0 
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-5 h-5 ${videoCredits > 0 ? 'text-orange-600' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${videoCredits > 0 ? 'text-orange-800' : 'text-gray-700'}`}>
                        {videoCredits > 0 ? `${videoCredits} Credits Available` : 'Buy Video Credits'}
                      </span>
                    </div>
                    <span className={`text-xs ${videoCredits > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {videoCredits > 0 ? 'Uses 1 credit' : 'Save up to 31%'}
                    </span>
                  </button>
                  
                  {videoCredits === 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                      <p className="text-sm text-red-700">
                        No video credits available. Purchase credits to upload.
                      </p>
                    </div>
                  )}
                  
                  {/* Daily Upload Limit Indicator */}
                  {!limitLoading && !dailyUploads.isExempt && (
                    <div className={`mb-4 p-3 rounded-lg flex items-center justify-between
                      ${dailyUploads.remaining > 0 
                        ? 'bg-orange-50 border border-orange-200' 
                        : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${dailyUploads.remaining > 0 ? 'text-orange-600' : 'text-red-600'}`} />
                        <span className={`text-sm font-medium ${dailyUploads.remaining > 0 ? 'text-orange-700' : 'text-red-700'}`}>
                          Daily Limit: {dailyUploads.uploadsToday}/{dailyUploads.limit} today
                        </span>
                      </div>
                      <span className={`text-xs ${dailyUploads.remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {dailyUploads.remaining > 0 
                          ? `${dailyUploads.remaining} remaining` 
                          : 'Resets at midnight EST'
                        }
                      </span>
                    </div>
                  )}
                  
                  {/* Block upload if daily limit reached */}
                  {!dailyUploads.isExempt && dailyUploads.remaining === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-foreground font-medium">Daily Upload Limit Reached</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        You can upload a maximum of {dailyUploads.limit} games per day.
                        Your limit resets at midnight EST.
                      </p>
                    </div>
                  ) : (
                    <VideoUploader gameId={gameId} userId={user?.id} onUploadComplete={handleUploadComplete} />
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-foreground">Video hosting not configured</p>
                </div>
              )}
            </div>
          ) : gameVideo.status === 'processing' ? (
            /* Processing Status */
            <VideoProcessingStatus processingStatus={processingStatus} backUrl="/dashboard/coach" />
          ) : (
            /* Video Uploaded - Show Status Card */
            <div className="flex items-center justify-center py-8">
              <div className="max-w-lg w-full">
                <CoachVideoStatusCard
                  video={gameVideo}
                  teamName={gameData?.team_a_name || 'My Team'}
                  opponentName={gameData?.opponent_name || 'Opponent'}
                />
                
                <div className="mt-6 text-center text-muted-foreground text-sm">
                  <p>
                    Your video has been uploaded and is in the tracking queue.
                    A StatJam stat tracker will complete tracking by midnight tomorrow (EST).
                  </p>
                  <p className="mt-2">
                    You&apos;ll receive a notification when tracking is complete.
                  </p>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/coach')}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard/coach');
        }}
        role="coach"
        currentTier={subscriptionTier}
        triggerReason="Video Tracking is a premium feature. Upgrade to have your games tracked using video playback."
      />

      {/* Video Credits Modal */}
      <VideoCreditsModal
        isOpen={showVideoCreditsModal}
        onClose={() => setShowVideoCreditsModal(false)}
        role="coach"
        currentCredits={videoCredits}
        onPurchaseComplete={refetchSubscription}
      />
    </div>
  );
}
