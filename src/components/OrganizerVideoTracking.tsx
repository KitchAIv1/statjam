'use client';

/**
 * OrganizerVideoTracking Component
 * 
 * Displays completed games for video tracking as a dashboard section.
 * Matches the pattern of OrganizerGameScheduler for seamless transitions.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/Button';
import { useTournaments } from '@/lib/hooks/useTournaments';
import { useSubscription } from '@/hooks/useSubscription';
import { GameService } from '@/lib/services/gameService';
import { cache, CacheTTL } from '@/lib/utils/cache';
import { CoachVideoStatusCard } from '@/components/video/CoachVideoStatusCard';
import { VideoCreditsDisplay } from '@/components/shared/VideoCreditsDisplay';
import { VideoCreditsModal } from '@/components/subscription/VideoCreditsModal';
import { 
  Video, Trophy, Calendar, CheckCircle, Upload, Loader2
} from 'lucide-react';
import type { GameVideo } from '@/lib/types/video';
import type { Game } from '@/lib/types/game';

interface GameWithVideo extends Game {
  tournament_name?: string;
  team_a_name?: string;
  team_b_name?: string;
  video?: GameVideo | null;
}

interface OrganizerVideoTrackingProps {
  user: { id: string } | null;
}

export function OrganizerVideoTracking({ user }: OrganizerVideoTrackingProps) {
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading } = useTournaments(user);
  const { videoCredits, refetch: refetchSubscription } = useSubscription('organizer');
  
  const [games, setGames] = useState<GameWithVideo[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  // Load completed games with video status
  useEffect(() => {
    if (tournaments.length > 0) {
      loadGames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments.length]);

  const loadGames = async (skipCache: boolean = false) => {
    if (!user?.id) return;

    const cacheKey = `organizer_video_games_${user.id}`;

    // ⚡ Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cachedGames = cache.get<GameWithVideo[]>(cacheKey);
      if (cachedGames) {
        console.log('⚡ OrganizerVideoTracking: Using cached games data');
        setGames(cachedGames);
        return;
      }
    }

    try {
      setLoadingGames(true);
      
      // Build tournament ID to name map
      const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));
      const tournamentIds = tournaments.map(t => t.id);
      
      // Single optimized query: games + video status
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
      
      // ⚡ Store in cache
      cache.set(cacheKey, mappedGames, CacheTTL.organizerGames || 3);
      console.log('⚡ OrganizerVideoTracking: Games cached');
      
      setGames(mappedGames);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const handleSelectGame = (gameId: string) => {
    router.push(`/dashboard/organizer-video/${gameId}`);
  };

  // Separate games with and without videos
  const gamesWithoutVideo = games.filter(g => !g.video);
  const gamesWithVideo = games.filter(g => g.video);
  
  const loading = tournamentsLoading || loadingGames;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-6 h-6 text-orange-500" />
            Video Tracking
          </h2>
          <p className="text-muted-foreground mt-1">
            Upload videos for AI-powered stat tracking
          </p>
        </div>
        
        {/* Video Credits Display */}
        <VideoCreditsDisplay
          credits={videoCredits}
          onBuyCredits={() => setShowCreditsModal(true)}
          size="md"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Games Ready for Upload */}
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5 text-orange-500" />
                  Ready for Upload ({gamesWithoutVideo.length})
                </h3>
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
            </CardContent>
          </Card>

          {/* Games Already Uploaded */}
          {gamesWithVideo.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Already Uploaded ({gamesWithVideo.length})
                  </h3>
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
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Video Credits Modal */}
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

