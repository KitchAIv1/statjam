"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { PlayerDashboardService } from '@/lib/services/playerDashboardService';
import { getCountryName } from '@/data/countries';
import { PlayerDataDebug } from '@/lib/utils/playerDataDebug';
import { X, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { PlayerIdentity, SeasonAverages, CareerHighs } from '@/lib/types/playerDashboard';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
}

export function PlayerProfileModal({ isOpen, onClose, playerId }: PlayerProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<PlayerIdentity | null>(null);
  const [seasonAverages, setSeasonAverages] = useState<SeasonAverages | null>(null);
  const [careerHighs, setCareerHighs] = useState<CareerHighs | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState({ profile: false, pose: false });

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

        // ✅ DEBUG: Log modal data for comparison
        if (identityData) {
          console.group('📊 Player Profile Modal - RAW DATA');
          console.log('Player ID:', playerId);
          console.log('Identity:', JSON.stringify(identityData, null, 2));
          console.log('Season Averages:', JSON.stringify(seasonData, null, 2));
          console.log('Career Highs:', JSON.stringify(careerData, null, 2));
          console.groupEnd();

          PlayerDataDebug.logSnapshot('modal', playerId, {
            identity: identityData,
            seasonAverages: seasonData,
            careerHighs: careerData,
          });
        }
      } catch (error) {
        console.error('Failed to load player profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [isOpen, playerId]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-600 border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Player Profile</DialogTitle>
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
                {/* ✅ DEBUG: Log what modal is displaying */}
                {(() => {
                  const displayedName = identity.name || 'Player Name';
                  const displayedJersey = identity.jerseyNumber;
                  const displayedPosition = identity.position;
                  const displayedHeight = identity.height ? formatHeight(identity.height) : '--';
                  const displayedWeight = identity.weight ? formatWeight(identity.weight) : '--';
                  const displayedAge = identity.age;
                  const displayedLocation = identity.location ? getCountryName(identity.location) : undefined;
                  
                  console.group('📊 Player Profile Modal - DISPLAYED VALUES');
                  console.log('Name:', displayedName);
                  console.log('Jersey:', displayedJersey);
                  console.log('Position:', displayedPosition);
                  console.log('Height:', displayedHeight);
                  console.log('Weight:', displayedWeight);
                  console.log('Age:', displayedAge);
                  console.log('Location:', displayedLocation);
                  console.log('Season PTS:', seasonAverages?.pointsPerGame);
                  console.log('Season REB:', seasonAverages?.reboundsPerGame);
                  console.log('Season AST:', seasonAverages?.assistsPerGame);
                  console.log('Season FG%:', seasonAverages?.fieldGoalPct);
                  console.log('Season 3PT%:', seasonAverages?.threePointPct);
                  console.log('Season FT%:', seasonAverages?.freeThrowPct);
                  console.log('Season MPG:', seasonAverages?.minutesPerGame);
                  console.log('Career PTS:', careerHighs?.points);
                  console.log('Career REB:', careerHighs?.rebounds);
                  console.log('Career AST:', careerHighs?.assists);
                  console.groupEnd();
                  
                  return null;
                })()}

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

                {/* Season Averages - Always Show */}
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

                  {/* Shooting Efficiency - Always Show */}
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

                {/* Career Highs - Always Show */}
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

                {/* Action Button */}
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

