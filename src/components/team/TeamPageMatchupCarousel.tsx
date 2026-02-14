'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TeamMatchupCard } from '@/components/tournament/TeamMatchupCard';
import { useCarouselDrag } from '@/hooks/useCarouselDrag';
import type { TournamentMatchup } from '@/hooks/useTournamentMatchups';

export interface TeamPageMatchupCarouselProps {
  matchups: TournamentMatchup[];
  loading: boolean;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  titlePosition?: 'above' | 'below';
}

const CARD_WIDTH = 320;
const GAP = 16;

export function TeamPageMatchupCarousel({
  matchups,
  loading,
  title = 'Upcoming Games',
  subtitle,
  emptyMessage = 'No upcoming games',
  titlePosition = 'above',
}: TeamPageMatchupCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useCarouselDrag(scrollRef);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [matchups]);

  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -(CARD_WIDTH + GAP), behavior: 'smooth' });
  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: CARD_WIDTH + GAP, behavior: 'smooth' });

  const showArrows = matchups.length > 3;

  const textBlock = (title || subtitle) && (
    <header className="text-center sm:text-left">
      {title && <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h2>}
      {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
    </header>
  );

  return (
    <section className="space-y-3">
      {titlePosition === 'above' && textBlock}

      <div className="relative w-full">
        {showArrows && (
          <>
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-800/80 p-2 text-white backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                !canScrollLeft ? 'hidden' : ''
              }`}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-800/80 p-2 text-white backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                !canScrollRight ? 'hidden' : ''
              }`}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 w-80 flex-shrink-0 animate-pulse rounded-xl border border-gray-200 bg-gray-100 shadow-md"
              />
            ))
          ) : matchups.length > 0 ? (
            matchups.map((m) => (
              <div key={m.gameId} data-matchup-card className="rounded-xl shadow-md">
                <TeamMatchupCard
                  gameId={m.gameId}
                  teamA={{
                    name: m.teamA.name,
                    logo: m.teamA.logo,
                    score: m.teamA.score,
                    bgColor: '#000000',
                    textColor: '#FFFFFF',
                  }}
                  teamB={{
                    name: m.teamB.name,
                    logo: m.teamB.logo,
                    score: m.teamB.score,
                    bgColor: '#FFFFFF',
                    textColor: '#000000',
                  }}
                  gameStatus={m.status}
                  gameDate={m.gameDate}
                  gamePhase={m.gamePhase}
                  onClick={() => window.open(`/game-viewer-v3/${m.gameId}`, '_blank')}
                />
              </div>
            ))
          ) : (
            <div className="flex w-full items-center justify-center py-12">
              <p className="text-sm text-gray-500">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>

      {titlePosition === 'below' && textBlock}
    </section>
  );
}
