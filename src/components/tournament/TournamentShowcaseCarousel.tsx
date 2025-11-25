/**
 * TournamentShowcaseCarousel - Promotional carousel for Tournament Page
 * 
 * Purpose: Showcase tournaments with carousel navigation, autoplay, and CTA
 * Follows .cursorrules: <200 lines, UI component only
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useTournamentCarousel } from '@/hooks/useTournamentCarousel';
import { TournamentCarouselCard } from './TournamentCarouselCard';
import { useRouter } from 'next/navigation';

interface TournamentShowcaseCarouselProps {
  onSectionView?: () => void;
}

export function TournamentShowcaseCarousel({ 
  onSectionView 
}: TournamentShowcaseCarouselProps) {
  const {
    tournaments,
    currentIndex,
    isLoading,
    error,
    goToSlide,
    nextSlide,
    prevSlide,
    isHovered,
    setIsHovered
  } = useTournamentCarousel();

  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const hasViewedRef = useRef(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Intersection observer for analytics
  useEffect(() => {
    if (!sectionRef.current || hasViewedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasViewedRef.current) {
            hasViewedRef.current = true;
            onSectionView?.();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [onSectionView]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (isLoading) {
    return (
      <section ref={sectionRef} className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-gray-500">
          Loading tournaments...
        </div>
      </section>
    );
  }

  if (error || tournaments.length === 0) {
    return (
      <section ref={sectionRef} className="py-16 bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tournament <span className="text-orange-500">Showcase</span>
          </h2>
          <p className="text-gray-600 mb-6">{error || 'No tournaments available at this time.'}</p>
          <button
            onClick={() => router.push('/tournaments')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            Browse All Tournaments
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="tournament-showcase"
      ref={sectionRef}
      className="py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Tournament <span className="text-orange-500">Showcase</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Explore live tournaments, view real-time play-by-play, check leaderboards, 
            standings, and dive deep into stats & analytics.
          </p>
          <button
            onClick={() => router.push('/tournaments')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            View All Tournaments
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Cards Container - Compact Size */}
          <div className="relative h-[400px] lg:h-[450px] max-w-2xl mx-auto overflow-hidden rounded-xl">
            {tournaments.map((tournament, index) => (
              <div
                key={tournament.id}
                className={`
                  absolute inset-0 transition-all duration-500 ease-out
                  ${index === currentIndex 
                    ? 'opacity-100 z-10 translate-x-0' 
                    : index < currentIndex
                    ? 'opacity-0 z-0 -translate-x-full'
                    : 'opacity-0 z-0 translate-x-full'
                  }
                `}
              >
                <TournamentCarouselCard
                  tournament={tournament}
                  isActive={index === currentIndex}
                  onClick={() => goToSlide(index)}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {tournaments.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                aria-label="Previous tournament"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next tournament"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
              </button>
            </>
          )}

          {/* Dots Navigation */}
          {tournaments.length > 1 && (
            <div className="flex justify-center gap-3 mt-6">
              {tournaments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to tournament ${index + 1}`}
                  className={`h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    index === currentIndex 
                      ? 'bg-orange-500 w-8' 
                      : 'bg-neutral-300 hover:bg-neutral-400 w-3'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

