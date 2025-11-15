"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { getCountryName } from '@/data/countries';
import { X, ExternalLink, Trophy, Sparkles, Calendar, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { PlayerIdentity, SeasonAverages, CareerHighs } from '@/lib/types/playerDashboard';
import { GameService } from '@/lib/services/gameService';
import { TeamStatsService } from '@/lib/services/teamStatsService';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  gameStats?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
  } | null;
  gameId?: string | null;
  awardType?: 'player_of_the_game' | 'hustle_player' | null;
}

interface GameAwardDetails {
  gameDate: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  playerTeamId: string;
  playerMinutes: number;
  shootingStats: {
    fgMade: number;
    fgAttempted: number;
    fgPercentage: number;
    threePtMade: number;
    threePtAttempted: number;
    threePtPercentage: number;
    ftMade: number;
    ftAttempted: number;
    ftPercentage: number;
  };
}

export function PlayerProfileModal({ isOpen, onClose, playerId, gameStats, gameId, awardType }: PlayerProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [seasonAverages, setSeasonAverages] = useState<SeasonAverages | null>(null);
  const [careerHighs, setCareerHighs] = useState<CareerHighs | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState({ profile: false, pose: false });
  const [gameAwardDetails, setGameAwardDetails] = useState<GameAwardDetails | null>(null);
  const [loadingAwardDetails, setLoadingAwardDetails] = useState(false);

  // Preload images when identity data is available for fast loading
  useEffect(() => {
    if (!identity) return;

    const preloadImages = async () => {
      const imagesToPreload: string[] = [];
      
      if (identity.profilePhotoUrl) {
        imagesToPreload.push(identity.profilePhotoUrl);
      }
      if (identity.posePhotoUrl) {
        imagesToPreload.push(identity.posePhotoUrl);
      }

      if (imagesToPreload.length === 0) return;

      // Try to use avatar cache for optimized preloading
      try {
        const { avatarCache } = await import('@/lib/utils/avatarCache');
        if (avatarCache) {
          await avatarCache.preloadAvatars(imagesToPreload);
          return;
        }
      } catch {
        // Fallback to standard preloading if cache is not available
      }

      // Standard preload for images (parallel loading)
      imagesToPreload.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    };

    preloadImages();
  }, [identity]);

  useEffect(() => {
    if (!isOpen || !playerId) {
      // Reset state when modal closes
      setLoading(true);
      setIdentity(null);
      setSeasonAverages(null);
      setCareerHighs(null);
      setImagesLoaded({ profile: false, pose: false });
      setGameAwardDetails(null);
      return;
    }

    const loadPlayerData = async () => {
      setLoading(true);
      try {
        // Load data in parallel for faster loading
        const [identityData, seasonData, careerData] = await Promise.all([
          PlayerDashboardService.getIdentity(playerId),
          PlayerDashboardService.getSeasonAverages(playerId),
          PlayerDashboardService.getCareerHighs(playerId),
        ]);

        setIdentity(identityData);
        setSeasonAverages(seasonData);
        setCareerHighs(careerData);
      } catch (error) {
        console.error('Failed to load player profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [isOpen, playerId]);

  // Load award game details when gameId and awardType are provided
  useEffect(() => {
    if (!isOpen || !gameId || !awardType || !playerId) {
      setGameAwardDetails(null);
      setLoadingAwardDetails(false);
      return;
    }

    const loadAwardDetails = async () => {
      setLoadingAwardDetails(true);
      try {
        // Fetch game details
        const game = await GameService.getGame(gameId);
        if (!game) {
          setLoadingAwardDetails(false);
          return;
        }

        // Determine player's team and fetch roster in parallel
        const teamIds = [game.team_a_id, game.team_b_id].filter(Boolean) as string[];
        let playerTeamId: string | null = null;
        let roster: any[] = [];
        
        // Check both teams in parallel to find player
        const rosterChecks = await Promise.allSettled(
          teamIds.map(teamId => 
            TeamServiceV3.getTeamPlayersWithSubstitutions(teamId, gameId)
          )
        );

        for (let i = 0; i < rosterChecks.length; i++) {
          const result = rosterChecks[i];
          if (result.status === 'fulfilled' && result.value.some((p: any) => p.id === playerId)) {
            playerTeamId = teamIds[i];
            roster = result.value;
            break;
          }
        }

        if (!playerTeamId || roster.length === 0) {
          setLoadingAwardDetails(false);
          return;
        }

        // Fetch player stats and shooting stats in parallel
        const rosterPlayerIds = roster.map(p => p.id);
        const [{ supabase }, playerStats] = await Promise.all([
          import('@/lib/supabase'),
          TeamStatsService.aggregatePlayerStats(gameId, playerTeamId, rosterPlayerIds)
        ]);

        const playerStat = playerStats.find(p => p.playerId === playerId);

        // Fetch shooting stats
        const { data: shootingStats } = await supabase
          .from('game_stats')
          .select('stat_type, stat_value, modifier')
          .eq('game_id', gameId)
          .eq('player_id', playerId)
          .in('stat_type', ['field_goal', 'two_pointer', 'three_pointer', 'free_throw']);

        // Calculate shooting percentages
        let fgMade = 0, fgAttempted = 0;
        let threePtMade = 0, threePtAttempted = 0;
        let ftMade = 0, ftAttempted = 0;

        shootingStats?.forEach(stat => {
          if (stat.stat_type === 'field_goal' || stat.stat_type === 'two_pointer') {
            fgAttempted++;
            if (stat.modifier === 'made') fgMade++;
          } else if (stat.stat_type === 'three_pointer') {
            fgAttempted++;
            threePtAttempted++;
            if (stat.modifier === 'made') {
              fgMade++;
              threePtMade++;
            }
          } else if (stat.stat_type === 'free_throw') {
            ftAttempted++;
            if (stat.modifier === 'made') ftMade++;
          }
        });

        const fgPercentage = fgAttempted > 0 ? Math.round((fgMade / fgAttempted) * 1000) / 10 : 0;
        const threePtPercentage = threePtAttempted > 0 ? Math.round((threePtMade / threePtAttempted) * 1000) / 10 : 0;
        const ftPercentage = ftAttempted > 0 ? Math.round((ftMade / ftAttempted) * 1000) / 10 : 0;

        setGameAwardDetails({
          gameDate: game.start_time || game.created_at,
          teamAName: game.team_a?.name || 'Team A',
          teamBName: game.team_b?.name || 'Team B',
          teamAScore: game.home_score || 0,
          teamBScore: game.away_score || 0,
          playerTeamId,
          playerMinutes: playerStat?.minutes || 0,
          shootingStats: {
            fgMade,
            fgAttempted,
            fgPercentage,
            threePtMade,
            threePtAttempted,
            threePtPercentage,
            ftMade,
            ftAttempted,
            ftPercentage,
          },
        });
      } catch (error) {
        // Silently handle errors - award details are optional
        setGameAwardDetails(null);
      } finally {
        setLoadingAwardDetails(false);
      }
    };

    loadAwardDetails();
  }, [isOpen, gameId, awardType, playerId]);

  const handleViewFullProfile = () => {
    window.open(`/player-dashboard`, '_blank');
    onClose();
  };

  const formatStat = (value: number | undefined, decimals = 1): string => {
    if (value === undefined || value === null) return '0.0';
    return value.toFixed(decimals);
  };

  const formatHeight = (height: string | number | undefined): string => {
    if (!height || height === 'N/A') return '--';
    const heightStr = String(height);
    if (heightStr.includes('"') || heightStr.includes("'")) return heightStr;
    return `${heightStr}"`;
  };

  const formatWeight = (weight: string | number | undefined): string => {
    if (!weight || weight === 'N/A') return '--';
    const weightStr = String(weight);
    if (weightStr.includes('lbs')) return weightStr;
    return `${weightStr} lbs`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  const isAwardView = awardType && gameStats && gameId;
  const awardTitle = awardType === 'player_of_the_game' ? 'Player of the Game' : 'Hustle Player of the Game';
  const AwardIcon = awardType === 'player_of_the_game' ? Trophy : Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-hidden p-0 border-0 shadow-2xl ${
        isAwardView 
          ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-orange-600' 
          : 'bg-gradient-to-br from-red-600 via-red-500 to-orange-600'
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isAwardView ? `${awardTitle} - Player Profile` : 'Player Profile'}</DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-col lg:flex-row min-h-[500px] lg:min-h-[650px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/30 p-2 text-white hover:bg-black/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Player Info Section */}
          <div className="flex-1 p-6 lg:p-8 space-y-6 lg:space-y-8 text-white overflow-y-auto lg:overflow-y-auto">
            {/* Award Badge with Integrated Game Context */}
            {isAwardView && (
              loadingAwardDetails ? (
                <div className="relative -mt-2 mb-4">
                  <div className="flex flex-col gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl border-2 border-yellow-300/30 px-4 py-3 shadow-lg">
                    <Skeleton className="h-6 w-48 bg-yellow-300/20" />
                    <Skeleton className="h-4 w-full bg-yellow-300/20" />
                  </div>
                </div>
              ) : gameAwardDetails ? (
                <div className="relative -mt-2 mb-4">
                  <div className="flex flex-col gap-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl border-2 border-yellow-300/30 px-4 py-3 shadow-lg">
                    {/* Award Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <AwardIcon className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-200 drop-shadow-lg" />
                      </div>
                      <div className="flex-1">
                        <div className="text-base sm:text-lg font-bold text-yellow-50 drop-shadow-md">
                          {awardTitle}
                        </div>
                      </div>
                    </div>
                    
                    {/* Compact Game Details Inside Badge */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-xs text-yellow-100/90 pl-9 sm:pl-10">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(gameAwardDetails.gameDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <span className="text-yellow-200/60">•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{gameAwardDetails.teamAName} vs {gameAwardDetails.teamBName}</span>
                        <span className="font-bold text-yellow-200">•</span>
                        <span className="font-bold text-yellow-200">{gameAwardDetails.teamAScore} - {gameAwardDetails.teamBScore}</span>
                      </div>
                      {gameAwardDetails.playerMinutes > 0 && (
                        <>
                          <span className="text-yellow-200/60">•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.round(gameAwardDetails.playerMinutes)} min</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : null
            )}
            {loading ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-64 bg-white/20" />
                  <Skeleton className="h-6 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </div>
                <div className="flex gap-6 mt-8">
                  <Skeleton className="h-20 w-24 bg-white/20" />
                  <Skeleton className="h-20 w-24 bg-white/20" />
                  <Skeleton className="h-20 w-24 bg-white/20" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 bg-white/20" />
                  ))}
                </div>
              </div>
            ) : identity ? (
              <>

                {/* Player Name & Basic Info */}
                <div className="space-y-2">
                  <h1 className="text-3xl lg:text-5xl font-bold tracking-tight drop-shadow-lg">
                    {identity.name || 'Player Name'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 text-orange-200 mb-2">
                    {identity.jerseyNumber && (
                      <>
                        <span className="text-xl lg:text-3xl font-bold">#{identity.jerseyNumber}</span>
                        <span className="text-lg">•</span>
                      </>
                    )}
                    {identity.position && (
                      <span className="text-base lg:text-xl font-semibold">{identity.position}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-orange-100 text-sm lg:text-base">
                    {identity.height && formatHeight(identity.height) !== '--' && (
                      <>
                        <span className="font-medium">{formatHeight(identity.height)}</span>
                        <span>•</span>
                      </>
                    )}
                    {identity.weight && formatWeight(identity.weight) !== '--' && (
                      <>
                        <span className="font-medium">{formatWeight(identity.weight)}</span>
                        <span>•</span>
                      </>
                    )}
                    {identity.age && (
                      <>
                        <span className="font-medium">Age {identity.age}</span>
                        {identity.location && <span>•</span>}
                      </>
                    )}
                    {identity.location && (
                      <span className="font-medium">{getCountryName(identity.location)}</span>
                    )}
                  </div>
                </div>

                {/* Game Stats (from Award) or Season Averages */}
                {gameStats ? (
                  <div>
                    <p className={`mb-4 text-sm font-medium uppercase tracking-wider ${
                      isAwardView ? 'text-yellow-50' : 'text-orange-100'
                    }`}>Game Performance</p>
                    <div className="flex flex-nowrap gap-4 sm:gap-6 lg:gap-8 mb-6 overflow-x-auto scrollbar-hide">
                      <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                        <div className={`text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.points}
                        </div>
                        <div className={`text-sm mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>Points</div>
                      </div>
                      <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                        <div className={`text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.rebounds}
                        </div>
                        <div className={`text-sm mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>Rebounds</div>
                      </div>
                      <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                        <div className={`text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.assists}
                        </div>
                        <div className={`text-sm mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>Assists</div>
                      </div>
                      {gameStats.steals > 0 && (
                        <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                          <div className={`text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                            isAwardView ? 'text-yellow-50' : 'text-white'
                          }`}>
                            {gameStats.steals}
                          </div>
                          <div className={`text-sm mt-1 ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>Steals</div>
                        </div>
                      )}
                      {gameStats.blocks > 0 && (
                        <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                          <div className={`text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                            isAwardView ? 'text-yellow-50' : 'text-white'
                          }`}>
                            {gameStats.blocks}
                          </div>
                          <div className={`text-sm mt-1 ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>Blocks</div>
                        </div>
                      )}
                    </div>

                    {/* Shooting Efficiency - Award View */}
                    {gameAwardDetails && (gameAwardDetails.shootingStats.fgAttempted > 0 || gameAwardDetails.shootingStats.ftAttempted > 0) && (
                      <>
                        <div className="flex items-center gap-2 mb-3 mt-6">
                          <div className={`w-2 h-2 rounded-full ${
                            isAwardView ? 'bg-yellow-200' : 'bg-orange-300'
                          }`}></div>
                          <p className={`text-xs font-medium uppercase tracking-wider ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>Shooting Efficiency</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 lg:gap-3">
                          {gameAwardDetails.shootingStats.fgAttempted > 0 && (
                            <div className={`text-center rounded-lg p-2 sm:p-2 lg:p-2.5 border min-w-0 w-full box-border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-sm sm:text-base lg:text-lg font-bold whitespace-nowrap ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.fgPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[9px] sm:text-[10px] lg:text-[11px] mt-1 leading-tight ${
                                isAwardView ? 'text-yellow-100/80' : 'text-orange-300'
                              }`}>
                                FG ({gameAwardDetails.shootingStats.fgMade}-{gameAwardDetails.shootingStats.fgAttempted})
                              </div>
                            </div>
                          )}
                          {gameAwardDetails.shootingStats.threePtAttempted > 0 && (
                            <div className={`text-center rounded-lg p-2 sm:p-2 lg:p-2.5 border min-w-0 w-full box-border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-sm sm:text-base lg:text-lg font-bold whitespace-nowrap ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.threePtPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[9px] sm:text-[10px] lg:text-[11px] mt-1 leading-tight ${
                                isAwardView ? 'text-yellow-100/80' : 'text-orange-300'
                              }`}>
                                3PT ({gameAwardDetails.shootingStats.threePtMade}-{gameAwardDetails.shootingStats.threePtAttempted})
                              </div>
                            </div>
                          )}
                          {gameAwardDetails.shootingStats.ftAttempted > 0 && (
                            <div className={`text-center rounded-lg p-2 sm:p-2 lg:p-2.5 border min-w-0 w-full box-border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-sm sm:text-base lg:text-lg font-bold whitespace-nowrap ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.ftPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[9px] sm:text-[10px] lg:text-[11px] mt-1 leading-tight ${
                                isAwardView ? 'text-yellow-100/80' : 'text-orange-300'
                              }`}>
                                FT ({gameAwardDetails.shootingStats.ftMade}-{gameAwardDetails.shootingStats.ftAttempted})
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-orange-100 mb-4 text-sm font-medium uppercase tracking-wider">Season Averages</p>
                    <div className="flex flex-wrap gap-6 lg:gap-8 mb-6">
                      <div className="min-w-[80px]">
                        <div className="text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.pointsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-sm mt-1">Points</div>
                      </div>
                      <div className="min-w-[80px]">
                        <div className="text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.reboundsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-sm mt-1">Rebounds</div>
                      </div>
                      <div className="min-w-[80px]">
                        <div className="text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.assistsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-sm mt-1">Assists</div>
                      </div>
                    </div>

                    {/* Shooting Efficiency - Only show for season averages */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                      <p className="text-orange-200 text-xs font-medium uppercase tracking-wider">Shooting Efficiency</p>
                    </div>
                    <div className="grid grid-cols-4 gap-3 lg:gap-4">
                      <div className="text-center bg-white/5 rounded-lg p-2 lg:p-3">
                        <div className="text-lg lg:text-xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.fieldGoalPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[10px] lg:text-xs mt-1">FG%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-lg p-2 lg:p-3">
                        <div className="text-lg lg:text-xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.threePointPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[10px] lg:text-xs mt-1">3PT%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-lg p-2 lg:p-3">
                        <div className="text-lg lg:text-xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.freeThrowPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[10px] lg:text-xs mt-1">FT%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-lg p-2 lg:p-3">
                        <div className="text-lg lg:text-xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.minutesPerGame, 1) : '0.0'}
                        </div>
                        <div className="text-orange-300 text-[10px] lg:text-xs mt-1">MPG</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Career Highs - Hide for award view to avoid redundancy */}
                {!isAwardView && (
                  <div>
                    <p className="text-orange-100 mb-3 text-sm font-medium uppercase tracking-wider">Career Highs</p>
                    <div className="flex flex-wrap gap-4 lg:gap-6 text-sm">
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-orange-200">Points: </span>
                        <span className="font-bold text-white">
                          {careerHighs?.points ?? 0}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-orange-200">Rebounds: </span>
                        <span className="font-bold text-white">
                          {careerHighs?.rebounds ?? 0}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-orange-200">Assists: </span>
                        <span className="font-bold text-white">
                          {careerHighs?.assists ?? 0}
                        </span>
                      </div>
                      {careerHighs?.blocks !== undefined && (
                        <div className="bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-orange-200">Blocks: </span>
                          <span className="font-bold text-white">{careerHighs.blocks}</span>
                        </div>
                      )}
                      {careerHighs?.steals !== undefined && (
                        <div className="bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-orange-200">Steals: </span>
                          <span className="font-bold text-white">{careerHighs.steals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button - Hidden for Award View */}
                {!isAwardView && (
                  <div className="pt-6 border-t border-white/10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            disabled
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="bg-white/10 text-white/50 hover:bg-white/10 border border-white/20 backdrop-blur-sm transition-all cursor-not-allowed opacity-60"
                          >
                            <ExternalLink className="w-4 h-4 mr-2 opacity-50" />
                            View Full Profile
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="bg-[#121212] border border-white/20 text-white shadow-lg rounded-lg px-3 py-2 text-xs font-medium"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>Coming Soon</span>
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-white/70 py-8">
                <p>Player profile not found</p>
              </div>
            )}
          </div>

          {/* Player Image Section - Always Show */}
          <div className="relative w-full h-[280px] sm:h-[320px] lg:h-auto lg:flex-[0.7] lg:min-h-0 bg-gradient-to-br from-red-700/30 to-orange-700/30 overflow-hidden">
            {identity?.posePhotoUrl ? (
              <>
                {/* Mobile: Fill container completely, Desktop: Right align */}
                <ImageWithFallback
                  src={identity.posePhotoUrl}
                  alt={identity.name || 'Player'}
                  className="absolute inset-0 h-full w-full object-cover object-center lg:right-0 lg:left-auto lg:w-auto lg:object-top transition-opacity duration-300"
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImagesLoaded((prev) => ({ ...prev, pose: true }))}
                  style={{ opacity: imagesLoaded.pose ? 1 : 0.7 }}
                />
                {/* Jersey Number Overlay */}
                {identity.jerseyNumber && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 text-3xl sm:text-4xl lg:text-6xl font-bold text-white opacity-50 drop-shadow-lg z-10">
                    #{identity.jerseyNumber}
                  </div>
                )}
              </>
            ) : (
              /* Fallback when no pose photo */
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 mx-auto mb-4 border-4 border-white/30">
                    {identity?.profilePhotoUrl ? (
                      <AvatarImage
                        src={identity.profilePhotoUrl}
                        alt={identity.name || 'Player'}
                        className="object-cover"
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImagesLoaded((prev) => ({ ...prev, profile: true }))}
                        onError={() => setImagesLoaded((prev) => ({ ...prev, profile: true }))}
                      />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-3xl sm:text-4xl lg:text-5xl">
                      {identity?.name ? getInitials(identity.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  {identity?.jerseyNumber && (
                    <div className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white/40 mt-4">
                      #{identity.jerseyNumber}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Team Badge - Only show if team exists */}
            {identity?.teamName && identity.teamName !== 'N/A' && (
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                <span className="text-orange-200 font-bold text-xs lg:text-sm">{String(identity.teamName).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

