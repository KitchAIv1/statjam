'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

interface Slide {
  image: string;
  alt: string;
  title: string;
  body: string;
}

interface SmartSequencesCarouselProps {
  onSlideChange?: (index: number) => void;
  onSectionView?: () => void;
}

const slides: Slide[] = [
  {
    image: '/images/sequence-1-foul.png',
    alt: 'Recording a shooting foul in StatJam tracker',
    title: 'The Foul Detected',
    body: 'Tap once to record a shooting foul. StatJam identifies the player and stops the clock.'
  },
  {
    image: '/images/sequence-2-type.png',
    alt: 'Selecting the foul type in StatJam',
    title: 'Select Foul Type',
    body: 'Instantly choose from foul types with color-coded clarity.'
  },
  {
    image: '/images/sequence-3-victim.png',
    alt: 'Choosing who was fouled in StatJam',
    title: 'Identify the Victim',
    body: 'Pick who got fouled. The right player chip is highlighted for context.'
  },
  {
    image: '/images/sequence-4-freethrows.png',
    alt: 'Automatic free throws sequence in StatJam',
    title: 'Automatic Free Throws',
    body: 'The system cues shot attempts, tracks makes/misses, and resets the clock automatically.'
  }
];

export function SmartSequencesCarousel({ 
  onSlideChange, 
  onSectionView
}: SmartSequencesCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const hasViewedRef = useRef(false);

  // Handle slide change
  const goToSlide = useCallback((index: number) => {
    const newIndex = (index + slides.length) % slides.length;
    setCurrentSlide(newIndex);
    onSlideChange?.(newIndex);
  }, [onSlideChange]);

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  // Autoplay logic
  useEffect(() => {
    if (isHovered || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => clearInterval(timer);
  }, [currentSlide, isHovered, isPaused, nextSlide]);

  // Pause when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

  return (
    <section 
      id="sequences" 
      ref={sectionRef}
      className="py-20 lg:py-28 bg-neutral-950"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-6">
            Smart Sequences: Where Real Basketball Meets Automation
          </h2>
          <p className="text-base lg:text-lg text-neutral-300 max-w-4xl mx-auto leading-relaxed">
            Every play tells a story — StatJam captures it with precision. When a shooting foul happens, 
            the system guides you step-by-step, asking the right questions, resetting clocks, and tracking 
            outcomes — all automatically. What used to take 5 manual inputs now happens in one smooth flow.
          </p>
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
          {/* Slides Container */}
          <div className="relative aspect-[16/10] lg:aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-950 shadow-2xl">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-300 ease-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <ImageWithFallback
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-contain"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>

          {/* Caption */}
          <div className="mt-8 text-center max-w-md mx-auto">
            <h3 className="text-xl lg:text-2xl font-semibold text-white mb-3">
              {slides[currentSlide].title}
            </h3>
            <p className="text-base text-neutral-300 leading-relaxed">
              {slides[currentSlide].body}
            </p>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                  index === currentSlide 
                    ? 'bg-orange-500 w-8' 
                    : 'bg-neutral-600 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

