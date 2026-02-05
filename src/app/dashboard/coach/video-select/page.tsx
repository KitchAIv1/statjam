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
import { useCheckoutReturn } from '@/hooks/useCheckoutReturn';
import { CoachGameService } from '@/lib/services/coachGameService';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { VideoStatService } from '@/lib/services/videoStatService';
import { useCoachTeams } from '@/hooks/useCoachTeams';
import { cache, CacheTTL } from '@/lib/utils/cache';
import { UpgradeModal } from '@/components/subscription';
import { VideoSelectGameCard } from '@/components/video/VideoSelectGameCard';
import { 
  Loader2, ArrowLeft, Video, Trophy, AlertCircle, Plus, X
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
  const urlTeamId = searchParams.get('teamId');
  
  const { user, loading: authLoading } = useAuthV2();
  const { tier: subscriptionTier, limits, videoCredits, loading: subLoading } = useSubscription('coach');
  const { teams, loading: teamsLoading } = useCoachTeams(user ? { id: user.id, role: user.role || 'coach' } : null);
  
  // User has video access if subscribed OR has video credits
  const hasVideoAccess = limits.hasVideoAccess || videoCredits > 0;
  
  // Handle checkout return (toast + subscription refresh + redirect to saved URL)
  useCheckoutReturn({ role: 'coach' });
  
  // Use URL teamId if provided, otherwise default to first team
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(urlTeamId);
  const teamId = selectedTeamId || (teams.length > 0 ? teams[0].id : null);
  
  // Update selectedTeamId when teams load and no URL teamId
  React.useEffect(() => {
    if (!selectedTeamId && teams.length > 0 && !urlTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId, urlTeamId]);
  
  // Handle team change from dropdown
  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId);
    router.replace(`/dashboard/coach/video-select?teamId=${newTeamId}`, { scroll: false });
  };
  
  // ⚡ Initialize with cached data to prevent spinner flash
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [team, setTeam] = useState<any>(() => {
    if (teamId) {
      const cached = cache.get<any>(`coach_video_team_${teamId}`);
      return cached || null;
    }
    return null;
  });
  const [games, setGames] = useState<GameWithVideo[]>(() => {
    if (teamId) {
      const cached = cache.get<GameWithVideo[]>(`coach_video_games_${teamId}`);
      return cached || [];
    }
    return [];
  });
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
  
  // Load team, games, and video data - with caching for instant navigation
  useEffect(() => {
    async function loadData() {
      if (!teamId || !user) {
        return;
      }
      
      const cacheKey = `coach_video_games_${teamId}`;
      const teamCacheKey = `coach_video_team_${teamId}`;
      
      // ⚡ Check cache first - NO spinner for cached data
      const cachedGames = cache.get<GameWithVideo[]>(cacheKey);
      const cachedTeam = cache.get<any>(teamCacheKey);
      
      if (cachedGames && cachedTeam) {
        setGames(cachedGames);
        setTeam(cachedTeam);
        return; // Use cached data, no loading spinner
      }
      
      try {
        // Only show loading if no cached data
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
        
        // ⚡ Cache for 3 minutes (same as organizer)
        cache.set(cacheKey, gamesWithVideos, CacheTTL.coachGames);
        cache.set(teamCacheKey, teamData, CacheTTL.coachGames);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
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
  
  // ⚡ Never show inline spinner - just let data populate
  // This prevents the jarring spinner flash on navigation
  const hasNoTeams = !teamsLoading && !authLoading && teams.length === 0;
  const isDataLoading = authLoading || subLoading || teamsLoading || loading;

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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Video className="w-6 h-6 text-orange-500" />
                  Video Tracking
                </h1>
                
                {/* Team Dropdown */}
                {teams.length > 0 && (
                  <select
                    value={teamId || ''}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="px-3 py-1.5 text-sm font-medium bg-white border border-orange-200 
                               rounded-lg text-foreground focus:outline-none focus:ring-2 
                               focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Select a game to upload video
              </p>
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
              <h2 className="font-semibold text-foreground">
                Your Games
                {isDataLoading && (
                  <Loader2 className="w-4 h-4 text-orange-400 animate-spin inline ml-2" />
                )}
              </h2>
              <Button
                onClick={handleToggleNewGameForm}
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={showNewGameForm || isDataLoading}
              >
                <Plus className="w-4 h-4" />
                New Game
              </Button>
            </div>
            
            {/* Content States - NO full spinner, just content */}
            {hasNoTeams ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-300" />
                <h2 className="text-xl font-semibold text-foreground">No Teams Yet</h2>
                <p className="mt-2">Create a team to start video tracking</p>
                <Button onClick={() => router.push('/dashboard/coach')} className="mt-4">
                  Go to Dashboard
                </Button>
              </div>
            ) : games.length === 0 ? (
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
                {games.map((game) => (
                  <VideoSelectGameCard
                    key={game.id}
                    game={game}
                    teamName={team?.name || 'My Team'}
                    onSelect={handleSelectGame}
                    onDelete={handleDeleteGame}
                    deletingGameId={deletingGameId}
                  />
                ))}
                
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
