"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Trophy, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
}


export function OverviewTab({ data }: OverviewTabProps) {
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
          
          {/* Filter Tabs */}
          <div className="flex gap-2 rounded-lg border border-white/10 bg-black/40 p-1">
            <button
              onClick={() => setMatchupFilter('all')}
              className={`rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
                matchupFilter === 'all'
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMatchupFilter('completed')}
              className={`rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
                matchupFilter === 'completed'
                  ? 'bg-[#FF3B30] text-white'
                  : 'text-[#B3B3B3] hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setMatchupFilter('scheduled')}
              className={`rounded-md px-3 py-1.5 text-[10px] font-medium transition-colors sm:text-xs ${
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
                    onClick={() => window.open(`/game-viewer/${matchup.gameId}`, '_blank')}
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
      <Card className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
        <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Leaderboard Highlights</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Top performers updated every possession</p>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-full border-white/10 bg-[#121212] text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:w-auto sm:text-xs md:text-sm"
            onClick={() => {
              const leadersTab = document.querySelector('[value="leaders"]');
              if (leadersTab) {
                (leadersTab as HTMLElement).click();
              }
            }}
          >
            View Full Leaders
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
          <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3">
            {topScorers.map((leader, index) => {
              const initials = getInitials(leader.playerName);
              return (
                <div 
                  key={leader.playerId}
                  onClick={() => openModal(leader.playerId, { isCustomPlayer: leader.isCustomPlayer || false })}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 transition hover:border-white/20 hover:bg-black/50 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 md:gap-4 md:px-4 md:py-3"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/10 sm:h-10 sm:w-10 md:h-14 md:w-14">
                    {leader.profilePhotoUrl ? (
                      <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                      {initials || <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-white truncate sm:text-xs md:text-sm">{leader.playerName}</div>
                    <div className="text-[9px] text-[#B3B3B3] truncate sm:text-[10px] md:text-xs">{leader.teamName}</div>
                    <div className="text-[9px] font-semibold text-[#FF3B30] mt-0.5 sm:text-[10px] sm:mt-1 md:text-xs">
                      {leader.pointsPerGame.toFixed(1)} PPG
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <div className="space-y-3 sm:space-y-4">
            {visibleAwards.map((award) => (
              <div key={award.gameId} className="rounded-lg border border-white/10 bg-black/40 p-3 sm:rounded-xl sm:p-4">
                <div className="text-[10px] text-[#B3B3B3] mb-2 sm:text-xs">
                  {new Date(award.gameDate).toLocaleDateString()} • {award.teamAName} vs {award.teamBName} ({award.teamAScore}-{award.teamBScore})
                </div>
                <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                  {award.playerOfTheGame && (
                    <AwardDisplayCard
                      playerId={award.playerOfTheGame.id}
                      playerName={award.playerOfTheGame.name}
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

      {/* Bracket Preview */}
      <Card className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
        <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Bracket Preview</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Interactive bracket launches soon</p>
          </div>
          <Button className="w-full rounded-full bg-[#FF3B30] px-3 py-1.5 text-[10px] uppercase tracking-wide text-white hover:brightness-110 sm:w-auto sm:px-4 sm:text-xs">
            Open Bracket
          </Button>
        </header>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-6">
          <MiniBracket />
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] text-[#B3B3B3] sm:space-y-3 sm:rounded-xl sm:p-4 sm:text-xs md:p-5 md:text-sm">
            <p>
              Pool standings update automatically as scores finalize. Bracket seeds lock when pool games end.
            </p>
            <p>
              Organizers can configure consolation rounds, double elimination, and placement games from the dashboard.
            </p>
          </div>
        </div>
      </Card>

      {/* CTA Cards */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-2">
        <Card className="rounded-xl border border-[#FF3B30]/30 bg-[#FF3B30]/10 p-3 text-white sm:rounded-2xl sm:p-4 md:p-6">
          <h3 className="text-sm font-semibold sm:text-base md:text-lg">Watch Live Now</h3>
          <p className="mt-1.5 text-[10px] text-white/70 sm:mt-2 sm:text-xs md:text-sm">Catch all live games with real-time play-by-play and stat leaderboards.</p>
          <Button className="mt-2 w-full rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-black hover:bg-white/90 sm:mt-3 sm:w-auto sm:px-4 sm:py-2 sm:text-xs md:text-sm">
            Launch Live Center
          </Button>
        </Card>
        <Card className="rounded-xl border border-white/10 bg-[#121212] p-3 text-white sm:rounded-2xl sm:p-4 md:p-6">
          <h3 className="text-sm font-semibold sm:text-base md:text-lg">Today&apos;s Schedule</h3>
          <p className="mt-1.5 text-[10px] text-[#B3B3B3] sm:mt-2 sm:text-xs md:text-sm">See court assignments, streaming links, and officials in one place.</p>
          <Button variant="outline" className="mt-2 w-full rounded-full border-white/20 bg-[#121212] text-[10px] text-white/70 hover:border-white/40 hover:text-white sm:mt-3 sm:w-auto sm:px-4 sm:py-2 sm:text-xs md:text-sm">
            View Schedule
          </Button>
        </Card>
      </div>

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

function MiniBracket() {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs text-white/70 sm:grid-cols-3 sm:gap-4 sm:text-sm">
      <div className="space-y-3 sm:space-y-4">
        <BracketCard label="Quarterfinals" matchups={[['Hurricanes', 'Wolves'], ['Chargers', 'Spartans']]} />
      </div>
      <div className="flex items-center sm:block">
        <BracketCard label="Semifinals" matchups={[['Winner QF1', 'Winner QF2']]} />
      </div>
      <div className="flex items-center sm:block">
        <BracketCard label="Final" matchups={[['Semifinal Winner', 'Semifinal Winner']]} />
      </div>
    </div>
  );
}

function BracketCard({ label, matchups }: { label: string; matchups: [string, string][] }) {
  return (
    <div className="w-full space-y-2 rounded-lg border border-white/10 bg-black/40 p-3 sm:rounded-xl sm:p-4">
      <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] sm:text-xs">{label}</div>
      <div className="space-y-2 sm:space-y-3">
        {matchups.map(([home, away], idx) => (
          <div key={`${home}-${away}-${idx}`} className="space-y-1">
            <div className="rounded-md border border-white/10 bg-[#121212] px-2 py-1.5 text-xs text-white sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">{home}</div>
            <div className="rounded-md border border-white/10 bg-[#121212] px-2 py-1.5 text-xs text-white sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">{away}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
