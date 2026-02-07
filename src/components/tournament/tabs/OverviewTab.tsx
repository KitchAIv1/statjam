"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Trophy, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, Video, Clock, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentLeaders } from '@/hooks/useTournamentLeaders';
import { useTournamentAwards } from '@/hooks/useTournamentAwards';
import { AwardDisplayCard } from '@/components/tournament/AwardDisplayCard';
import { TeamMatchupCard } from '@/components/tournament/TeamMatchupCard';
import { useTournamentMatchups } from '@/hooks/useTournamentMatchups';

interface OverviewTabProps {
  data: TournamentPageData;
  onNavigateToTab?: (tab: string) => void;
}


export function OverviewTab({ data, onNavigateToTab }: OverviewTabProps) {
  const router = useRouter();
  const [topScorers, setTopScorers] = useState<PlayerLeader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const { isOpen, playerId, isCustomPlayer, gameStats, gameId, awardType, openModal, closeModal } = usePlayerProfileModal();
  const [matchupFilter, setMatchupFilter] = useState<'all' | 'completed' | 'scheduled'>('all');
  const matchupScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ✅ OPTIMIZED: Use custom hook with caching
  const { leaders: allLeaders, loading: leadersLoading } = useTournamentLeaders(data.tournament.id, 'points', 1);
  
  // ✅ Fetch tournament awards (fetch 10, show 3 by default)
  const { awards: tournamentAwards, loading: awardsLoading } = useTournamentAwards(data.tournament.id, 10);
  const [awardsExpanded, setAwardsExpanded] = useState(false);

  // ✅ Fetch tournament matchups (completed + scheduled)
  const { matchups, loading: matchupsLoading } = useTournamentMatchups(data.tournament.id, {
    status: matchupFilter === 'all' ? undefined : matchupFilter,
    limit: 20
  });

  // ✅ Fetch upcoming games for mobile section (no WebSocket, just HTTP)
  const { matchups: upcomingGames, loading: upcomingLoading } = useTournamentMatchups(data.tournament.id, {
    status: 'scheduled',
    limit: 3
  });
  
  // Show 3 awards by default, all when expanded (latest first - already sorted by gameDate DESC)
  const COLLAPSED_AWARDS_COUNT = 3;
  const visibleAwards = useMemo(() => {
    if (awardsExpanded) return tournamentAwards;
    return tournamentAwards.slice(0, COLLAPSED_AWARDS_COUNT);
  }, [tournamentAwards, awardsExpanded]);
  
  const hasMoreAwards = tournamentAwards.length > COLLAPSED_AWARDS_COUNT;
  
  // Update state when leaders change
  useEffect(() => {
    setTopScorers(allLeaders.slice(0, 3)); // Top 3 scorers
    setLoadingLeaders(leadersLoading);
  }, [allLeaders, leadersLoading]);

  // ✅ Drag-to-scroll functionality for matchup cards (with global listeners for trackpad/mouse)
  useEffect(() => {
    const scrollContainer = matchupScrollRef.current;
    if (!scrollContainer) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let hasMoved = false;
    let containerRect: DOMRect;

    const handleMouseDown = (e: MouseEvent) => {
      // Don't start drag if clicking directly on a card - let card handle click
      const target = e.target as HTMLElement;
      if (target.closest('[data-matchup-card]')) {
        return; // Let the card's onClick handle navigation
      }
      
      // Use getBoundingClientRect for accurate position calculation
      containerRect = scrollContainer.getBoundingClientRect();
      isDown = true;
      hasMoved = false;
      scrollContainer.style.cursor = 'grabbing';
      scrollContainer.style.userSelect = 'none';
      startX = e.pageX - containerRect.left;
      scrollLeft = scrollContainer.scrollLeft;
      
      // Attach global listeners for dragging outside container
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDown || !scrollContainer) return;
      
      // Recalculate rect in case container moved/resized
      containerRect = scrollContainer.getBoundingClientRect();
      const x = e.pageX - containerRect.left;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      
      // Only prevent default and scroll if we've moved enough (5px threshold)
      if (Math.abs(walk) > 5) {
        hasMoved = true;
        e.preventDefault();
        scrollContainer.scrollLeft = scrollLeft - walk;
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!isDown) return;
      
      const wasDragging = hasMoved;
      isDown = false;
      scrollContainer.style.cursor = 'grab';
      scrollContainer.style.userSelect = '';
      
      // Only prevent click if we actually dragged (not just clicked)
      if (wasDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
      // If no drag occurred, let the click event propagate to the card
      
      // Remove global listeners
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      
      hasMoved = false;
    };

    // Touch handlers for mobile
    let touchStartX: number;
    let touchScrollLeft: number;
    let touchHasMoved = false;

    const handleTouchStart = (e: TouchEvent) => {
      containerRect = scrollContainer.getBoundingClientRect();
      touchStartX = e.touches[0].pageX - containerRect.left;
      touchScrollLeft = scrollContainer.scrollLeft;
      touchHasMoved = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX) return;
      
      containerRect = scrollContainer.getBoundingClientRect();
      const x = e.touches[0].pageX - containerRect.left;
      const walk = (x - touchStartX) * 1.5;
      
      if (Math.abs(walk) > 3) {
        touchHasMoved = true;
      }
      
      e.preventDefault();
      scrollContainer.scrollLeft = touchScrollLeft - walk;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // If we dragged, prevent card tap
      if (touchHasMoved) {
        e.preventDefault();
      }
      touchStartX = 0;
      touchScrollLeft = 0;
      touchHasMoved = false;
    };

    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd);

    // Set initial cursor style
    scrollContainer.style.cursor = 'grab';

    return () => {
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
      
      // Clean up global listeners if still attached
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // ✅ Track scroll position for navigation arrows
  useEffect(() => {
    const scrollContainer = matchupScrollRef.current;
    if (!scrollContainer) return;

    const updateScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    // Initial check
    updateScrollButtons();

    // Update on scroll
    scrollContainer.addEventListener('scroll', updateScrollButtons);
    
    // Update on resize
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [matchups]);

  // ✅ Scroll functions for navigation arrows
  const scrollLeft = () => {
    const scrollContainer = matchupScrollRef.current;
    if (!scrollContainer) return;
    const cardWidth = 320; // w-80 = 320px
    const gap = 16; // gap-4 = 16px
    scrollContainer.scrollBy({
      left: -(cardWidth + gap),
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const scrollContainer = matchupScrollRef.current;
    if (!scrollContainer) return;
    const cardWidth = 320; // w-80 = 320px
    const gap = 16; // gap-4 = 16px
    scrollContainer.scrollBy({
      left: cardWidth + gap,
      behavior: 'smooth'
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Team Matchups Section */}
      <Card className="space-y-3 overflow-hidden rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
        <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Recent Matchups</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Completed games and upcoming schedule</p>
          </div>
          
          {/* Filter Tabs - Compact rectangle style */}
          <div className="flex gap-1 rounded border border-white/10 bg-black/40 p-0.5">
            <button
              onClick={() => setMatchupFilter('all')}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors sm:text-xs ${
                matchupFilter === 'all'
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMatchupFilter('completed')}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors sm:text-xs ${
                matchupFilter === 'completed'
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setMatchupFilter('scheduled')}
              className={`rounded px-2.5 py-1 text-[10px] font-medium transition-colors sm:text-xs ${
                matchupFilter === 'scheduled'
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              Upcoming
            </button>
          </div>
        </header>

        {/* Horizontal Scroll Container with Navigation Arrows */}
        <div className="relative">
          {/* Navigation Arrows - Only show when there are matchups */}
          {matchups.length > 3 && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FF3B30] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  !canScrollLeft ? 'hidden' : ''
                }`}
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#FF3B30] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  !canScrollRight ? 'hidden' : ''
                }`}
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Scroll Container */}
          {matchupsLoading ? (
            <div 
              ref={matchupScrollRef}
              className="matchup-scroll-container flex gap-4 overflow-x-auto pb-2"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-48 w-80 flex-shrink-0 animate-pulse rounded-xl border border-white/10 bg-white/5" />
              ))}
            </div>
          ) : matchups.length > 0 ? (
            <div 
              ref={matchupScrollRef}
              className="matchup-scroll-container flex gap-4 overflow-x-auto pb-2"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {matchups.map((matchup) => (
                <div key={matchup.gameId} data-matchup-card>
                  <TeamMatchupCard
                    gameId={matchup.gameId}
                    teamA={{
                      name: matchup.teamA.name,
                      logo: matchup.teamA.logo,
                      score: matchup.teamA.score,
                      bgColor: '#000000',
                      textColor: '#FFFFFF'
                    }}
                    teamB={{
                      name: matchup.teamB.name,
                      logo: matchup.teamB.logo,
                      score: matchup.teamB.score,
                      bgColor: '#FFFFFF',
                      textColor: '#000000'
                    }}
                    gameStatus={matchup.status}
                    gameDate={matchup.gameDate}
                    gamePhase={matchup.gamePhase}
                    onClick={() => window.open(`/game-viewer-v3/${matchup.gameId}`, '_blank')}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 px-4">
              <div className="text-center">
                <p className="text-sm text-[#B3B3B3] sm:text-base">
                  {matchupFilter === 'scheduled' 
                    ? 'No upcoming games scheduled'
                    : matchupFilter === 'completed'
                    ? 'No completed games yet'
                    : 'No matchups available'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Leaderboard Highlights */}
      <Card className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121212] sm:rounded-2xl">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 pointer-events-none"
          style={{ backgroundImage: 'url(/images/leadersection.webp)' }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 space-y-3 p-3 sm:space-y-4 sm:p-4 md:space-y-6 md:p-6">
        <header className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Leaderboard Highlights</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Top performers updated every possession</p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 rounded-full border-white/10 bg-[#121212]/80 px-3 py-1.5 text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:px-4 sm:py-2 sm:text-xs md:text-sm"
            onClick={() => onNavigateToTab?.('leaders')}
          >
            View Leaders
          </Button>
        </header>
        {loadingLeaders ? (
          <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5 sm:h-20 sm:rounded-xl" />
            ))}
          </div>
        ) : topScorers.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-center text-[10px] text-[#B3B3B3] sm:rounded-xl sm:p-6 sm:text-xs md:text-sm">
            No player stats available yet. Leaders will appear as games are tracked.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3">
            {topScorers.map((leader, index) => {
              const initials = getInitials(leader.playerName);
              return (
                <div 
                  key={leader.playerId}
                  onClick={() => openModal(leader.playerId, { isCustomPlayer: leader.isCustomPlayer || false })}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-3 transition hover:border-white/20 hover:bg-black/50 sm:gap-3 sm:px-3 sm:py-2.5 md:gap-4 md:px-4 md:py-3"
                >
                  <Avatar className="h-14 w-14 border-2 border-white/10 sm:h-14 sm:w-14 md:h-[72px] md:w-[72px]">
                    {leader.profilePhotoUrl ? (
                      <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white text-base sm:text-base md:text-lg">
                      {initials || <User className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate sm:text-xs md:text-sm">{leader.playerName}</div>
                    <div className="text-[10px] text-[#B3B3B3] truncate sm:text-[10px] md:text-xs">{leader.teamName}</div>
                    <div className="text-[10px] font-semibold text-[#FF3B30] mt-0.5 sm:text-[10px] sm:mt-1 md:text-xs">
                      {leader.pointsPerGame.toFixed(1)} PPG
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </Card>

      {/* StatJam Promo Poster - Mobile Only (between Leaders & Awards) */}
      <section className="lg:hidden overflow-hidden">
        <Image
          src="/announcements/player-claim-announcement-2.png"
          alt="Own Your Game - Claim your profile on StatJam"
          width={600}
          height={600}
          className="w-full h-auto object-cover"
          loading="lazy"
          sizes="100vw"
        />
      </section>

      {/* Game Awards */}
      {tournamentAwards.length > 0 && (
        <Card className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
          <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Recent Game Awards</h2>
              <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Player of the Game and Hustle Player highlights</p>
            </div>
            {hasMoreAwards && (
              <Button
                variant="outline"
                onClick={() => setAwardsExpanded(!awardsExpanded)}
                className="w-full rounded-full border-white/10 bg-[#121212] text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:w-auto sm:text-xs md:text-sm"
              >
                {awardsExpanded ? (
                  <>Show Less <ChevronUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4" /></>
                ) : (
                  <>View All ({tournamentAwards.length}) <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" /></>
                )}
              </Button>
            )}
          </header>
          <div className="space-y-4">
            {visibleAwards.map((award, index) => (
              <div key={`${award.gameId}-${index}`}>
                {/* Game Context Header */}
                <div className="text-[10px] text-[#B3B3B3] mb-2 sm:text-xs">
                  {new Date(award.gameDate).toLocaleDateString()} • {award.teamAName} vs {award.teamBName} ({award.teamAScore}-{award.teamBScore})
                </div>
                {/* Award Cards */}
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {award.playerOfTheGame && (
                    <AwardDisplayCard
                      playerId={award.playerOfTheGame.id}
                      playerName={award.playerOfTheGame.name}
                      profilePhotoUrl={award.playerOfTheGame.profilePhotoUrl}
                      awardType="player_of_the_game"
                      stats={award.playerOfTheGame.stats}
                      onClick={() => openModal(award.playerOfTheGame!.id, {
                        gameId: award.gameId,
                        stats: award.playerOfTheGame!.stats,
                        awardType: 'player_of_the_game',
                        isCustomPlayer: award.playerOfTheGame?.isCustomPlayer || false
                      })}
                    />
                  )}
                  {award.hustlePlayer && (
                    <AwardDisplayCard
                      playerId={award.hustlePlayer.id}
                      playerName={award.hustlePlayer.name}
                      profilePhotoUrl={award.hustlePlayer.profilePhotoUrl}
                      awardType="hustle_player"
                      stats={award.hustlePlayer.stats}
                      onClick={() => openModal(award.hustlePlayer!.id, {
                        gameId: award.gameId,
                        stats: award.hustlePlayer!.stats,
                        awardType: 'hustle_player',
                        isCustomPlayer: award.hustlePlayer?.isCustomPlayer || false
                      })}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mobile Only: Upcoming Schedule & Streaming Teaser (hidden on lg+ where right rail shows) */}
      <div className="space-y-3 sm:space-y-4 lg:hidden">
        {/* Upcoming Games - Mobile */}
        <Card className="rounded-xl border border-white/10 bg-[#121212] p-3 sm:rounded-2xl sm:p-4">
          <header className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#FF3B30]" />
            <span className="text-sm font-semibold text-white">Upcoming Games</span>
          </header>
          <div className="space-y-2">
            {upcomingLoading && (
              <div className="animate-pulse h-12 rounded-lg bg-white/5" />
            )}
            {!upcomingLoading && upcomingGames.length === 0 && (
              <p className="text-xs text-[#B3B3B3]">No upcoming games scheduled</p>
            )}
            {!upcomingLoading && upcomingGames.map((game) => (
              <div
                key={game.gameId}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2 cursor-pointer hover:bg-white/10 transition"
                onClick={() => window.open(`/game-viewer-v3/${game.gameId}`, '_blank')}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {game.teamA.name} vs {game.teamB.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#B3B3B3]">
                    <Clock className="h-3 w-3" />
                    <span>{game.gameDate ? new Date(game.gameDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Streaming Coming Soon - Mobile */}
        <Card className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] sm:rounded-2xl">
          <div className="flex items-center gap-4 p-4">
            <Video className="h-8 w-8 text-[#FF3B30]/60 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white mb-0.5">Live Streaming</div>
              <div className="rounded bg-[#FF3B30]/20 px-2 py-0.5 text-[10px] font-medium text-[#FF3B30] inline-block">
                COMING SOON
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bracket Preview - Coming Soon */}
      <Card className="overflow-hidden rounded-xl border border-white/10 bg-[#121212] sm:rounded-2xl">
        <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12 text-center">
          <Zap className="h-10 w-10 text-[#FF3B30]/60 mb-3 sm:h-12 sm:w-12" />
          <h2 className="text-base font-semibold text-white mb-1 sm:text-lg">Tournament Bracket</h2>
          <div className="rounded bg-[#FF3B30]/20 px-2.5 py-0.5 text-[10px] font-medium text-[#FF3B30] mb-2 sm:text-xs">
            COMING SOON
          </div>
          <p className="text-[10px] text-white/40 max-w-[280px] sm:text-xs sm:max-w-[320px]">
            Interactive bracket view with live updates, automatic seeding, and elimination tracking
          </p>
        </div>
      </Card>

      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal 
          isOpen={isOpen} 
          onClose={closeModal} 
          playerId={playerId || ''}
          isCustomPlayer={isCustomPlayer || false}
          gameStats={gameStats || undefined}
          gameId={gameId || undefined}
          awardType={awardType || undefined}
        />
      )}
    </div>
  );
}

