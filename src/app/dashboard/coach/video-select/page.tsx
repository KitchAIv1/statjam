'use client';

/**
 * Coach Video Select Page
 * 
 * Allows coach to select a game from their team for video tracking.
 * Shows video status card for games that already have videos uploaded.
 * Premium feature - requires hasVideoAccess subscription.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Button } from '@/components/ui/Button';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useSubscription } from '@/hooks/useSubscription';
import { CoachGameService } from '@/lib/services/coachGameService';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { VideoStatService } from '@/lib/services/videoStatService';
import { UpgradeModal } from '@/components/subscription';
import { CoachVideoStatusCard } from '@/components/video/CoachVideoStatusCard';
import { 
  Loader2, ArrowLeft, Video, PlayCircle, Calendar, 
  Trophy, Clock, CheckCircle, AlertCircle, Plus, X, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { VideoCreditsDisplay } from '@/components/shared/VideoCreditsDisplay';
import { VideoCreditsModal } from '@/components/subscription/VideoCreditsModal';
import type { GameVideo } from '@/lib/types/video';

interface GameWithVideo {
  id: string;
  opponent_name?: string;
  game_date?: string;
  status?: string;
  home_score?: number;
  away_score?: number;
  video?: GameVideo | null;
}

function VideoSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamId = searchParams.get('teamId');
  
  const { user, loading: authLoading } = useAuthV2();
  const { tier: subscriptionTier, limits, videoCredits, loading: subLoading } = useSubscription('coach');
  
  // User has video access if subscribed OR has video credits
  const hasVideoAccess = limits.hasVideoAccess || videoCredits > 0;
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [games, setGames] = useState<GameWithVideo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [totalGames, setTotalGames] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const GAMES_PER_PAGE = 10;
  
  // New game form state
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [newGameOpponent, setNewGameOpponent] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // Refetch subscription after purchase
  const { refetch: refetchSubscription } = useSubscription('coach');
  
  // Check video access (subscription OR credits)
  useEffect(() => {
    if (!authLoading && !subLoading && !hasVideoAccess) {
      setShowUpgradeModal(true);
    }
  }, [authLoading, subLoading, hasVideoAccess]);
  
  // Load team, games, and video data
  useEffect(() => {
    async function loadData() {
      if (!teamId || !user) return;
      
      try {
        setLoading(true);
        const [teamData, gamesResult] = await Promise.all([
          CoachTeamService.getTeam(teamId),
          CoachGameService.getTeamGames(teamId, GAMES_PER_PAGE, 0),
        ]);
        
        setTeam(teamData);
        setHasMore(gamesResult.hasMore);
        setTotalGames(gamesResult.total);
        
        // Load video data for each game
        const gamesWithVideos = await Promise.all(
          gamesResult.games.map(async (game: any) => {
            try {
              const video = await VideoStatService.getGameVideo(game.id);
              return { ...game, video };
            } catch {
              return { ...game, video: null };
            }
          })
        );
        
        setGames(gamesWithVideos);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (user && teamId) {
      loadData();
    }
  }, [user, teamId]);
  
  // Load more games
  const handleLoadMore = async () => {
    if (!teamId || loadingMore) return;
    
    try {
      setLoadingMore(true);
      const gamesResult = await CoachGameService.getTeamGames(
        teamId, 
        GAMES_PER_PAGE, 
        games.length
      );
      
      setHasMore(gamesResult.hasMore);
      
      // Load video data for new games
      const newGamesWithVideos = await Promise.all(
        gamesResult.games.map(async (game: any) => {
          try {
            const video = await VideoStatService.getGameVideo(game.id);
            return { ...game, video };
          } catch {
            return { ...game, video: null };
          }
        })
      );
      
      setGames(prev => [...prev, ...newGamesWithVideos]);
    } catch (error) {
      console.error('Error loading more games:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  const handleSelectGame = (gameId: string) => {
    router.push(`/dashboard/coach/video/${gameId}`);
  };
  
  // Delete game (only removes from this video tracking context)
  const handleDeleteGame = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Delete this game? This will remove it from video tracking.')) {
      return;
    }
    
    try {
      setDeletingGameId(gameId);
      await CoachGameService.deleteGame(gameId);
      setGames(prev => prev.filter(g => g.id !== gameId));
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Please try again.');
    } finally {
      setDeletingGameId(null);
    }
  };
  
  const handleToggleNewGameForm = () => {
    setShowNewGameForm(!showNewGameForm);
    setNewGameOpponent('');
    setCreateError(null);
  };
  
  const handleCreateGame = async () => {
    if (!teamId || !newGameOpponent.trim()) {
      setCreateError('Please enter an opponent name');
      return;
    }
    
    try {
      setCreatingGame(true);
      setCreateError(null);
      
      const newGame = await CoachGameService.createQuickTrackGame({
        coach_team_id: teamId,
        opponent_name: newGameOpponent.trim(),
        game_settings: { quarter_length_minutes: 8 },
      });
      
      router.push(`/dashboard/coach/video/${newGame.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setCreateError('Failed to create game. Please try again.');
      setCreatingGame(false);
    }
  };
  
  if (authLoading || subLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                      flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }
  
  if (!teamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 
                      flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Team Selected</h2>
          <p className="text-muted-foreground mt-2">Please select a team from your dashboard.</p>
          <Button onClick={() => router.push('/dashboard/coach')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={() => router.push('/dashboard/coach')}
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
              {team && (
                <p className="text-muted-foreground mt-1">
                  Select a game for <span className="font-medium text-foreground">{team.name}</span>
                </p>
              )}
            </div>
            
            {/* Video Credits Display */}
            <VideoCreditsDisplay
              credits={videoCredits}
              onBuyCredits={() => setShowCreditsModal(true)}
              size="md"
            />
          </div>
          
          {/* New Game Form */}
          {showNewGameForm && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  New Game for Video Tracking
                </h3>
                <button
                  onClick={handleToggleNewGameForm}
                  className="text-orange-600 hover:text-orange-800 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opponent Name *
                  </label>
                  <Input
                    value={newGameOpponent}
                    onChange={(e) => setNewGameOpponent(e.target.value)}
                    placeholder="e.g., Eagles, Team Blue"
                    className="max-w-md"
                    disabled={creatingGame}
                  />
                </div>
                
                {createError && (
                  <p className="text-sm text-red-600">{createError}</p>
                )}
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCreateGame}
                    disabled={creatingGame || !newGameOpponent.trim()}
                    className="gap-2"
                  >
                    {creatingGame ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                    {creatingGame ? 'Creating...' : 'Create & Upload Video'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleNewGameForm}
                    disabled={creatingGame}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Games List */}
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Your Games</h2>
              <Button
                onClick={handleToggleNewGameForm}
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={showNewGameForm}
              >
                <Plus className="w-4 h-4" />
                New Game
              </Button>
            </div>
            
            {games.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No games yet</p>
                <p className="text-sm mt-1">Create a game to start video tracking</p>
                <Button onClick={handleToggleNewGameForm} className="mt-4 gap-2" disabled={showNewGameForm}>
                  <Plus className="w-4 h-4" />
                  Create Game
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => {
                  // If game has a video uploaded, show the status card with delete option
                  if (game.video && game.video.status !== 'uploading') {
                    return (
                      <div key={game.id} className="relative group">
                        <div 
                          onClick={() => handleSelectGame(game.id)} 
                          className="cursor-pointer"
                        >
                          <CoachVideoStatusCard
                            video={game.video}
                            teamName={team?.name || 'My Team'}
                            opponentName={game.opponent_name || 'Opponent'}
                            compact
                          />
                        </div>
                        <button
                          onClick={(e) => handleDeleteGame(game.id, e)}
                          disabled={deletingGameId === game.id}
                          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 
                                     hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50
                                     opacity-0 group-hover:opacity-100"
                          title="Delete game"
                        >
                          {deletingGameId === game.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    );
                  }
                  
                  // Otherwise show the regular game card
                  const isCompleted = game.status === 'completed';
                  const isInProgress = game.status === 'in_progress';
                  
                  return (
                    <div
                      key={game.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 
                                 hover:border-orange-200 hover:bg-orange-50/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectGame(game.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-100' : isInProgress ? 'bg-orange-100' : 'bg-gray-100'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : isInProgress ? (
                          <Clock className="w-5 h-5 text-orange-600" />
                        ) : (
                          <PlayCircle className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          vs {game.opponent_name || 'Opponent'}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {game.game_date ? new Date(game.game_date).toLocaleDateString() : 'No date'}
                          </span>
                          {isCompleted && game.home_score !== undefined && (
                            <span className="font-medium">
                              {game.home_score} - {game.away_score}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectGame(game.id);
                          }}
                        >
                          <Video className="w-4 h-4" />
                          Upload
                        </Button>
                        
                        <button
                          onClick={(e) => handleDeleteGame(game.id, e)}
                          disabled={deletingGameId === game.id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 
                                     rounded-lg transition-colors disabled:opacity-50"
                          title="Delete game"
                        >
                          {deletingGameId === game.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="pt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Games
                          <span className="text-muted-foreground text-xs">
                            ({games.length} of {totalGames})
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          router.push('/dashboard/coach');
        }}
        role="coach"
        currentTier={subscriptionTier}
        triggerReason="Video Tracking is a premium feature. Upgrade to track games using video playback with frame-by-frame precision."
      />
      
      <VideoCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        role="coach"
        currentCredits={videoCredits}
        onPurchaseComplete={refetchSubscription}
      />
    </div>
  );
}

export default function CoachVideoSelectPage() {
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
