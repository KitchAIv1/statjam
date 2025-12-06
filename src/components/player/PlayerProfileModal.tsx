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
import { cache, CacheTTL } from '@/lib/utils/cache';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  isCustomPlayer?: boolean;
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

export function PlayerProfileModal({ isOpen, onClose, playerId, isCustomPlayer = false, gameStats, gameId, awardType }: PlayerProfileModalProps) {
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
        // Pass isCustomPlayer flag to service methods
        const [identityData, seasonData, careerData] = await Promise.all([
          PlayerDashboardService.getIdentity(playerId, isCustomPlayer),
          PlayerDashboardService.getSeasonAverages(playerId, isCustomPlayer),
          PlayerDashboardService.getCareerHighs(playerId, isCustomPlayer),
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
  }, [isOpen, playerId, isCustomPlayer]);

  // Load award game details when gameId and awardType are provided
  useEffect(() => {
    if (!isOpen || !gameId || !awardType || !playerId) {
      setGameAwardDetails(null);
      setLoadingAwardDetails(false);
      return;
    }

    const loadAwardDetails = async () => {
      // ⚡ OPTIMIZATION: Check cache first (5 min TTL)
      const cacheKey = `game_award_details_${gameId}_${playerId}_${isCustomPlayer ? 'custom' : 'regular'}`;
      const cached = cache.get<GameAwardDetails>(cacheKey);
      if (cached) {
        console.log('⚡ PlayerProfileModal: Using cached award details for', playerId.substring(0, 8));
        setGameAwardDetails(cached);
        setLoadingAwardDetails(false);
        return;
      }

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

        // ⚡ OPTIMIZATION: Fetch player stats, all game stats, and shooting stats in parallel
        const rosterPlayerIds = roster.map(p => p.id);
        const { supabase } = await import('@/lib/supabase');
        
        // Build shooting stats query
        const shootingStatsQuery = supabase
          .from('game_stats')
          .select('stat_type, stat_value, modifier')
          .eq('game_id', gameId)
          .in('stat_type', ['field_goal', 'two_pointer', 'three_pointer', 'free_throw']);

        if (isCustomPlayer) {
          shootingStatsQuery.eq('custom_player_id', playerId);
        } else {
          shootingStatsQuery.eq('player_id', playerId);
        }
        
        // ⚡ Run ALL queries in parallel (was sequential before)
        const [playerStats, allGameStatsResult, shootingStatsResult] = await Promise.all([
          TeamStatsService.aggregatePlayerStats(gameId, playerTeamId, rosterPlayerIds),
          supabase.from('game_stats').select('team_id, stat_value, modifier, is_opponent_stat').eq('game_id', gameId),
          shootingStatsQuery
        ]);

        const playerStat = playerStats.find(p => p.playerId === playerId);
        const allGameStats = allGameStatsResult.data;
        const shootingStats = shootingStatsResult.data;

        // ✅ Calculate scores from game_stats (matches useGameViewerV2 and getTournamentAwards pattern)
        let teamAScore = 0;
        let teamBScore = 0;
        
        allGameStats?.forEach(stat => {
          if (stat.modifier === 'made') {
            const points = stat.stat_value || 0;
            
            // Check is_opponent_stat flag for coach mode consistency
            if (stat.is_opponent_stat) {
              // Opponent stats go to team B score
              teamBScore += points;
            } else if (stat.team_id === game.team_a_id) {
              teamAScore += points;
            } else if (stat.team_id === game.team_b_id) {
              teamBScore += points;
            }
          }
        });

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

        const awardDetails: GameAwardDetails = {
          gameDate: game.start_time || game.created_at,
          teamAName: game.team_a?.name || 'Team A',
          teamBName: game.team_b?.name || 'Team B',
          teamAScore: teamAScore,
          teamBScore: teamBScore,
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
        };

        // ⚡ Cache the result (5 min TTL)
        cache.set(cacheKey, awardDetails, CacheTTL.playerGameStats);
        console.log('💾 PlayerProfileModal: Cached award details for', playerId.substring(0, 8));

        setGameAwardDetails(awardDetails);
      } catch (error) {
        // Silently handle errors - award details are optional
        setGameAwardDetails(null);
      } finally {
        setLoadingAwardDetails(false);
      }
    };

    loadAwardDetails();
  }, [isOpen, gameId, awardType, playerId, isCustomPlayer]);

  const handleViewFullProfile = () => {
    window.open(`/player/${playerId}`, '_blank');
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
  const isPOTG = awardType === 'player_of_the_game';
  const awardTitle = isPOTG ? 'Player of the Game' : 'Hustle Player of the Game';
  const AwardIcon = isPOTG ? Trophy : Sparkles;
  
  // ✅ Distinct color schemes for each award type (entire modal + badge)
  const awardColors = isPOTG 
    ? {
        // Modal background - Amber/Gold theme for Player of the Game
        modalBg: 'bg-gradient-to-br from-amber-600 via-yellow-500 to-orange-600',
        sidePanelBg: 'bg-gradient-to-br from-amber-700/30 to-orange-700/30',
        // Badge colors
        gradient: 'from-amber-400/20 to-orange-400/20',
        border: 'border-amber-300/30',
        iconColor: 'text-amber-200',
        titleColor: 'text-amber-50',
        textColor: 'text-amber-100/90',
        accentColor: 'text-amber-200',
        separatorColor: 'text-amber-200/60'
      }
    : {
        // Modal background - Cyan/Teal theme for Hustle Player
        modalBg: 'bg-gradient-to-br from-cyan-600 via-teal-500 to-emerald-600',
        sidePanelBg: 'bg-gradient-to-br from-cyan-700/30 to-teal-700/30',
        // Badge colors
        gradient: 'from-cyan-400/20 to-teal-400/20',
        border: 'border-cyan-300/30',
        iconColor: 'text-cyan-200',
        titleColor: 'text-cyan-50',
        textColor: 'text-cyan-100/90',
        accentColor: 'text-cyan-200',
        separatorColor: 'text-cyan-200/60'
      };
  
  // Default modal colors for non-award view
  const defaultModalBg = 'bg-gradient-to-br from-red-600 via-red-500 to-orange-600';
  const defaultSidePanelBg = 'bg-gradient-to-br from-red-700/30 to-orange-700/30';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-hidden p-0 border-0 shadow-2xl ${
        isAwardView ? awardColors.modalBg : defaultModalBg
      }`}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isAwardView ? `${awardTitle} - Player Profile` : 'Player Profile'}</DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-row min-h-[400px] sm:min-h-[500px] lg:min-h-[650px]">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 rounded-full bg-black/30 p-1.5 sm:p-2 text-white hover:bg-black/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Player Info Section - Left side, always visible */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Content */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 text-white overflow-y-auto">
            {/* Award Badge with Integrated Game Context */}
            {isAwardView && (
              loadingAwardDetails ? (
                <div className="relative -mt-2 mb-4">
                  <div className={`flex flex-col gap-2 bg-gradient-to-r ${awardColors.gradient} backdrop-blur-sm rounded-xl border-2 ${awardColors.border} px-4 py-3 shadow-lg`}>
                    <Skeleton className="h-6 w-48 bg-white/20" />
                    <Skeleton className="h-4 w-full bg-white/20" />
                  </div>
                </div>
              ) : gameAwardDetails ? (
                <div className="relative -mt-2 mb-4">
                  <div className={`flex flex-col gap-2 bg-gradient-to-r ${awardColors.gradient} backdrop-blur-sm rounded-xl border-2 ${awardColors.border} px-4 py-3 shadow-lg`}>
                    {/* Award Title */}
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <AwardIcon className={`h-6 w-6 sm:h-7 sm:w-7 ${awardColors.iconColor} drop-shadow-lg`} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-base sm:text-lg font-bold ${awardColors.titleColor} drop-shadow-md`}>
                          {awardTitle}
                        </div>
                      </div>
                    </div>
                    
                    {/* Compact Game Details Inside Badge */}
                    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] sm:text-xs ${awardColors.textColor} pl-9 sm:pl-10`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(gameAwardDetails.gameDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <span className={awardColors.separatorColor}>•</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{gameAwardDetails.teamAName} vs {gameAwardDetails.teamBName}</span>
                        <span className={`font-bold ${awardColors.accentColor}`}>•</span>
                        <span className={`font-bold ${awardColors.accentColor}`}>{gameAwardDetails.teamAScore} - {gameAwardDetails.teamBScore}</span>
                      </div>
                      {gameAwardDetails.playerMinutes > 0 && (
                        <>
                          <span className={awardColors.separatorColor}>•</span>
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
                <div className="space-y-1 sm:space-y-2">
                  <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold tracking-tight drop-shadow-lg leading-tight">
                    {identity.name || 'Player Name'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3 text-orange-200 mb-1 sm:mb-2">
                    {identity.jerseyNumber && (
                      <>
                        <span className="text-base sm:text-xl lg:text-3xl font-bold">#{identity.jerseyNumber}</span>
                        <span className="text-sm sm:text-lg">•</span>
                      </>
                    )}
                    {identity.position && (
                      <span className="text-sm sm:text-base lg:text-xl font-semibold">{identity.position}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-orange-100 text-xs sm:text-sm lg:text-base">
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
                    <p className={`mb-2 sm:mb-4 text-xs sm:text-sm font-medium uppercase tracking-wider ${
                      isAwardView ? 'text-yellow-50' : 'text-orange-100'
                    }`}>Game Performance</p>
                    <div className="flex flex-nowrap gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 overflow-x-auto">
                      <div className="flex-shrink-0">
                        <div className={`text-2xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.points}
                        </div>
                        <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>PTS</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`text-2xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.rebounds}
                        </div>
                        <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>REB</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`text-2xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                          isAwardView ? 'text-yellow-50' : 'text-white'
                        }`}>
                          {gameStats.assists}
                        </div>
                        <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                          isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                        }`}>AST</div>
                      </div>
                      {gameStats.steals > 0 && (
                        <div className="flex-shrink-0">
                          <div className={`text-2xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                            isAwardView ? 'text-yellow-50' : 'text-white'
                          }`}>
                            {gameStats.steals}
                          </div>
                          <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>STL</div>
                        </div>
                      )}
                      {gameStats.blocks > 0 && (
                        <div className="flex-shrink-0">
                          <div className={`text-2xl sm:text-2xl lg:text-3xl font-bold drop-shadow-lg ${
                            isAwardView ? 'text-yellow-50' : 'text-white'
                          }`}>
                            {gameStats.blocks}
                          </div>
                          <div className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>BLK</div>
                        </div>
                      )}
                    </div>

                    {/* Shooting Efficiency - Award View */}
                    {gameAwardDetails && (gameAwardDetails.shootingStats.fgAttempted > 0 || gameAwardDetails.shootingStats.ftAttempted > 0) && (
                      <>
                        <div className="flex items-center gap-2 mb-3 mt-4 sm:mt-6">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                            isAwardView ? 'bg-yellow-200' : 'bg-orange-300'
                          }`}></div>
                          <p className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${
                            isAwardView ? 'text-yellow-100/90' : 'text-orange-200'
                          }`}>Shooting Efficiency</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          {gameAwardDetails.shootingStats.fgAttempted > 0 && (
                            <div className={`flex-1 min-w-[70px] text-center rounded-lg p-2 sm:p-2.5 border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-base sm:text-lg font-bold ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.fgPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[8px] sm:text-[10px] mt-0.5 leading-tight ${
                                isAwardView ? 'text-yellow-100/80' : 'text-orange-300'
                              }`}>
                                FG ({gameAwardDetails.shootingStats.fgMade}-{gameAwardDetails.shootingStats.fgAttempted})
                              </div>
                            </div>
                          )}
                          {gameAwardDetails.shootingStats.threePtAttempted > 0 && (
                            <div className={`flex-1 min-w-[70px] text-center rounded-lg p-2 sm:p-2.5 border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-base sm:text-lg font-bold ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.threePtPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[8px] sm:text-[10px] mt-0.5 leading-tight ${
                                isAwardView ? 'text-yellow-100/80' : 'text-orange-300'
                              }`}>
                                3PT ({gameAwardDetails.shootingStats.threePtMade}-{gameAwardDetails.shootingStats.threePtAttempted})
                              </div>
                            </div>
                          )}
                          {gameAwardDetails.shootingStats.ftAttempted > 0 && (
                            <div className={`flex-1 min-w-[70px] text-center rounded-lg p-2 sm:p-2.5 border ${
                              isAwardView 
                                ? 'bg-black/20 border-yellow-200/20' 
                                : 'bg-white/5 border-white/10'
                            }`}>
                              <div className={`text-base sm:text-lg font-bold ${
                                isAwardView ? 'text-yellow-50' : 'text-white'
                              }`}>
                                {gameAwardDetails.shootingStats.ftPercentage.toFixed(1)}%
                              </div>
                              <div className={`text-[8px] sm:text-[10px] mt-0.5 leading-tight ${
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
                    <p className="text-orange-100 mb-2 sm:mb-4 text-xs sm:text-sm font-medium uppercase tracking-wider">Season Averages</p>
                    <div className="flex flex-nowrap gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6">
                      <div className="flex-shrink-0">
                        <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.pointsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-xs sm:text-sm mt-0.5 sm:mt-1">PPG</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.reboundsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-xs sm:text-sm mt-0.5 sm:mt-1">RPG</div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.assistsPerGame) : '0.0'}
                        </div>
                        <div className="text-orange-200 text-xs sm:text-sm mt-0.5 sm:mt-1">APG</div>
                      </div>
                    </div>

                    {/* Shooting Efficiency - Only show for season averages */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-300 rounded-full"></div>
                      <p className="text-orange-200 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Shooting</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
                      <div className="text-center bg-white/5 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-3">
                        <div className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.fieldGoalPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[9px] sm:text-xs lg:text-sm mt-0.5">FG%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-3">
                        <div className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.threePointPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[9px] sm:text-xs lg:text-sm mt-0.5">3PT%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-3">
                        <div className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.freeThrowPct, 1) : '0.0'}%
                        </div>
                        <div className="text-orange-300 text-[9px] sm:text-xs lg:text-sm mt-0.5">FT%</div>
                      </div>
                      <div className="text-center bg-white/5 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-3">
                        <div className="text-base sm:text-xl lg:text-2xl font-bold text-white">
                          {seasonAverages ? formatStat(seasonAverages.minutesPerGame, 1) : '0.0'}
                        </div>
                        <div className="text-orange-300 text-[9px] sm:text-xs lg:text-sm mt-0.5">MPG</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Career Highs - 2 rows x 3 columns grid for compact layout */}
                {!isAwardView && (
                  <div>
                    <p className="text-orange-100 mb-2 sm:mb-3 text-xs sm:text-sm font-medium uppercase tracking-wider">Career Highs</p>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">PTS</span>
                        <span className="font-bold text-white">{careerHighs?.points ?? 0}</span>
                      </div>
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">REB</span>
                        <span className="font-bold text-white">{careerHighs?.rebounds ?? 0}</span>
                      </div>
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">AST</span>
                        <span className="font-bold text-white">{careerHighs?.assists ?? 0}</span>
                      </div>
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">BLK</span>
                        <span className="font-bold text-white">{careerHighs?.blocks ?? 0}</span>
                      </div>
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">STL</span>
                        <span className="font-bold text-white">{careerHighs?.steals ?? 0}</span>
                      </div>
                      <div className="bg-white/5 rounded-md px-2 py-1.5 text-center">
                        <span className="text-orange-200 text-[10px] sm:text-xs block">3PM</span>
                        <span className="font-bold text-white">{careerHighs?.threes ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}

              </>
            ) : (
              <div className="text-center text-white/70 py-8">
                <p>Player profile not found</p>
              </div>
            )}
            </div>
            
            {/* Sticky Footer - View Full Profile Button (only if profile is public) */}
            {!isAwardView && !isCustomPlayer && identity && identity.isPublicProfile !== false && (
              <div className="shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-t border-white/10 bg-black/20 backdrop-blur-sm">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewFullProfile}
                        className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 opacity-50" />
                        View Full Profile
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="bg-[#121212] border border-white/20 text-white shadow-lg rounded-lg px-3 py-2 text-xs font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>View full player dashboard</span>
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Player Image Section - Right side, always visible */}
          <div className={`relative w-[35%] sm:w-[40%] lg:w-[45%] flex-shrink-0 overflow-hidden ${
            isAwardView ? awardColors.sidePanelBg : defaultSidePanelBg
          }`}>
            {identity?.posePhotoUrl ? (
              <>
                {/* Image fills container, aligned to right */}
                <ImageWithFallback
                  src={identity.posePhotoUrl}
                  alt={identity.name || 'Player'}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300"
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImagesLoaded((prev) => ({ ...prev, pose: true }))}
                  style={{ opacity: imagesLoaded.pose ? 1 : 0.7 }}
                />
                {/* Jersey Number Overlay */}
                {identity.jerseyNumber && (
                  <div 
                    className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 lg:bottom-4 lg:right-4 text-2xl sm:text-3xl lg:text-6xl font-bold text-white/70 z-10"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.4)' }}
                  >
                    #{identity.jerseyNumber}
                  </div>
                )}
              </>
            ) : (
              /* Fallback when no pose photo */
              <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 sm:h-24 sm:w-24 lg:h-40 lg:w-40 mx-auto mb-2 sm:mb-4 border-2 sm:border-4 border-white/30">
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
                    <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-xl sm:text-3xl lg:text-5xl">
                      {identity?.name ? getInitials(identity.name) : 'P'}
                    </AvatarFallback>
                  </Avatar>
                  {identity?.jerseyNumber && (
                    <div 
                      className="text-2xl sm:text-4xl lg:text-7xl font-bold text-white/60 mt-2 sm:mt-4"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.4)' }}
                    >
                      #{identity.jerseyNumber}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Team Badge - Only show if team exists */}
            {identity?.teamName && identity.teamName !== 'N/A' && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 bg-black/40 backdrop-blur-sm rounded-md sm:rounded-lg px-1.5 sm:px-3 py-0.5 sm:py-1.5 border border-white/20">
                <span className="text-orange-200 font-bold text-[8px] sm:text-xs lg:text-sm">{String(identity.teamName).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

