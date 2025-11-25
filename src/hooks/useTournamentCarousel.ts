/**
 * useTournamentCarousel - Hook for tournament carousel state and navigation
 * 
 * Purpose: Manage carousel state, autoplay, and navigation
 * Follows .cursorrules: <100 lines, UI logic only
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTournamentsForCarousel, TournamentCarouselData } from '@/lib/services/tournamentCarouselService';

interface UseTournamentCarouselReturn {
  tournaments: TournamentCarouselData[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
}

const AUTOPLAY_INTERVAL = 5000; // 5 seconds

export function useTournamentCarousel(): UseTournamentCarouselReturn {
  const [tournaments, setTournaments] = useState<TournamentCarouselData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch tournaments on mount
  useEffect(() => {
    async function loadTournaments() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchTournamentsForCarousel();
        setTournaments(data);
        if (data.length > 0) {
          setCurrentIndex(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournaments');
        console.error('❌ useTournamentCarousel: Error loading tournaments:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTournaments();
  }, []);

  // Navigation functions
  const goToSlide = useCallback((index: number) => {
    if (tournaments.length === 0) return;
    const newIndex = (index + tournaments.length) % tournaments.length;
    setCurrentIndex(newIndex);
  }, [tournaments.length]);

  const nextSlide = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  // Autoplay logic
  useEffect(() => {
    if (tournaments.length === 0 || isHovered || isPaused) {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      return;
    }

    autoplayRef.current = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [currentIndex, tournaments.length, isHovered, isPaused, nextSlide]);

  // Pause when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    tournaments,
    currentIndex,
    isLoading,
    error,
    goToSlide,
    nextSlide,
    prevSlide,
    isHovered,
    setIsHovered
  };
}

