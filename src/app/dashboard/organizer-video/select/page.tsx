'use client';

/**
 * Organizer Video Select Page
 * 
 * Shows all completed games from organizer's tournaments.
 * Uses same data fetching pattern as OrganizerGameScheduler.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useSubscription } from '@/hooks/useSubscription';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { GameService } from '@/lib/services/gameService';
import { cache, CacheTTL } from '@/lib/utils/cache';
import { UpgradeModal, VideoCreditsModal } from '@/components/subscription';
import { CoachVideoStatusCard } from '@/components/video/CoachVideoStatusCard';
import { VideoCreditsDisplay } from '@/components/shared/VideoCreditsDisplay';
import { 
  Loader2, ArrowLeft, Video, Trophy, Calendar, 
  CheckCircle, Upload
} from 'lucide-react';
import type { GameVideo } from '@/lib/types/video';
import type { Game } from '@/lib/types/game';

interface GameWithVideo extends Game {
  tournament_name?: string;
  team_a_name?: string;
  team_b_name?: string;
  video?: GameVideo | null;
}

function VideoSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { user, loading: authLoading } = useAuthV2();
  const { tier: subscriptionTier, limits, videoCredits, loading: subLoading, refetch: refetchSubscription } = useSubscription('organizer');
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  
  const hasVideoAccess = limits.hasVideoAccess || videoCredits > 0;
  
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<GameWithVideo[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // Check video access
  useEffect(() => {
    if (!authLoading && !subLoading && !hasVideoAccess) {
      setShowUpgradeModal(true);
    }
  }, [authLoading, subLoading, hasVideoAccess]);
  
  // Handle checkout success
  useEffect(() => {
    if (searchParams.get('checkout') === 'video_success') {
      refetchSubscription();
      window.history.replaceState({}, '', '/dashboard/organizer-video/select');
    }
  }, [searchParams, refetchSubscription]);
  
  // Load completed games - OPTIMIZED: Single JOIN query with caching
  useEffect(() => {
    async function loadGames() {
      if (!user?.id || tournaments.length === 0) {
        return;
      }
      
      const cacheKey = `organizer_video_games_${user.id}`;
      
      // ⚡ Check cache first - NO spinner for cached data
      const cachedGames = cache.get<GameWithVideo[]>(cacheKey);
      if (cachedGames) {
        console.log('⚡ VideoSelect: Using cached games data');
        setGames(cachedGames);
        return;
      }
      
      try {
        // Only show loading spinner when actually fetching
        setLoading(true);
        
        // Build tournament ID to name map
        const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));
        const tournamentIds = tournaments.map(t => t.id);
        
        // Single optimized query: games + video status in one call
        const gamesWithVideoStatus = await GameService.getCompletedGamesWithVideoStatus(tournamentIds);
        
        // Map to component format
        const mappedGames: GameWithVideo[] = gamesWithVideoStatus.map((game: any) => ({
          ...game,
          tournament_name: tournamentMap.get(game.tournament_id) || '',
          video: game.video_id ? {
            id: game.video_id,
            status: game.video_status,
            gameId: game.id,
          } as any : null,
        }));
        
        // ⚡ Store in cache (3 minutes like other organizer pages)
        cache.set(cacheKey, mappedGames, CacheTTL.organizerGames || 3);
        console.log('⚡ VideoSelect: Games cached');
        
        setGames(mappedGames);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (tournaments.length > 0) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tournaments.length]);
  
  const handleSelectGame = (gameId: string) => {
    router.push(`/dashboard/organizer-video/${gameId}`);
  };
  
  // Only show full-page spinner on first load (before any data loaded)
  // Once we have games (even empty array after load), don't show spinner
  const isInitialLoad = games.length === 0 && !tournaments.length;
  const showFullSpinner = isInitialLoad && (authLoading || subLoading || tournamentsLoading || loading);
  
  if (showFullSpinner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                      flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Separate games with and without videos
  const gamesWithoutVideo = games.filter(g => !g.video);
  const gamesWithVideo = games.filter(g => g.video);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <NavigationHeader />
      
      <main className="pt-24 px-6 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard?section=games')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Video className="w-6 h-6 text-orange-500" />
                Video Tracking
              </h1>
              <p className="text-muted-foreground mt-1">
                Select a completed game to upload video for tracking
              </p>
            </div>
            
            {/* Video Credits Display */}
            <VideoCreditsDisplay
              credits={videoCredits}
              onBuyCredits={() => setShowCreditsModal(true)}
              size="md"
            />
          </div>
          
          {/* Games Ready for Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                Ready for Upload ({gamesWithoutVideo.length})
              </h2>
            </div>
            
            {gamesWithoutVideo.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">All completed games have videos</p>
                <p className="text-sm mt-1">Complete more tournament games to upload videos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gamesWithoutVideo.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 
                               hover:border-orange-200 hover:bg-orange-50/50 transition-colors cursor-pointer"
                    onClick={() => handleSelectGame(game.id)}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {game.tournament_name && (
                        <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                          <Trophy className="w-3 h-3" />
                          {game.tournament_name}
                        </div>
                      )}
                      <div className="font-medium text-foreground truncate">
                        {game.team_a_name} vs {game.team_b_name}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {game.start_time ? new Date(game.start_time).toLocaleDateString() : 'No date'}
                        </span>
                        {game.home_score !== undefined && (
                          <span className="font-medium">
                            {game.home_score} - {game.away_score}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                      disabled={!hasVideoAccess}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectGame(game.id);
                      }}
                    >
                      <Video className="w-4 h-4" />
                      Upload
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Games Already Uploaded */}
          {gamesWithVideo.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">
                  Already Uploaded ({gamesWithVideo.length})
                </h2>
              </div>
              
              <div className="space-y-3">
                {gamesWithVideo.map((game) => (
                  <div 
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)} 
                    className="cursor-pointer"
                  >
                    <CoachVideoStatusCard
                      video={game.video!}
                      teamName={game.team_a_name || 'Team A'}
                      opponentName={game.team_b_name || 'Team B'}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard');
        }}
        role="organizer"
        currentTier={subscriptionTier}
        triggerReason="Video Tracking is a premium feature. Upgrade to track games using video playback."
      />
      
      <VideoCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        role="organizer"
        currentCredits={videoCredits}
        onPurchaseComplete={refetchSubscription}
      />
    </div>
  );
}

export default function OrganizerVideoSelectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                      flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <VideoSelectContent />
    </Suspense>
  );
}
