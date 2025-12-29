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
import { isBunnyConfigured } from '@/lib/config/videoConfig';
import { UpgradeModal, VideoCreditsModal } from '@/components/subscription';
import type { GameVideo } from '@/lib/types/video';
import { Loader2, ArrowLeft, Video, AlertCircle, Upload, CreditCard } from 'lucide-react';

interface CoachVideoPageProps {
  params: Promise<{ gameId: string }>;
}

export default function CoachVideoPage({ params }: CoachVideoPageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthV2();
  const { tier: subscriptionTier, limits, loading: subLoading } = useSubscription('coach');
  
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
  
  // Check premium access
  useEffect(() => {
    if (!authLoading && !subLoading && !limits.hasVideoAccess) {
      setShowUpgradeModal(true);
    }
  }, [authLoading, subLoading, limits.hasVideoAccess]);
  
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
    setHasHandledReady(false);
    setUploadedVideoId(bunnyVideoId);
    
    try {
      await VideoStatService.createGameVideo(
        gameId,
        process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || '',
        bunnyVideoId,
        user?.id || ''
      );
    } catch (err) {
      console.error('Error creating video record:', err);
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
                      Upload your game video. Our stat trackers will track your game within 24 hours.
                    </p>
                  </div>
                  
                  {/* Buy Credits Upsell */}
                  <button
                    onClick={() => setShowVideoCreditsModal(true)}
                    className="w-full mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 
                               rounded-lg flex items-center justify-between hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Buy Video Credits</span>
                    </div>
                    <span className="text-xs text-amber-600">Save up to 31%</span>
                  </button>
                  
                  <VideoUploader gameId={gameId} userId={user?.id} onUploadComplete={handleUploadComplete} />
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
                    A StatJam stat tracker will track your game within 24 hours.
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
        currentCredits={0}
      />
    </div>
  );
}
