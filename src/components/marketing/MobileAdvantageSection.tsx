'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Button } from '@/components/ui/Button';

interface MobileAdvantageSectionProps {
  onSectionView?: () => void;
  onCtaClick?: () => void;
}

const benefits = [
  'Dual game + shot clocks in your pocket',
  'One-tap actions for stats and fouls',
  'Auto possession, rebounds, and assists',
  'Instant sync with the public live feed'
];

export function MobileAdvantageSection({ 
  onSectionView,
  onCtaClick 
}: MobileAdvantageSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const hasViewedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer for analytics and animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (!hasViewedRef.current) {
              hasViewedRef.current = true;
              onSectionView?.();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [onSectionView]);

  const handleCtaClick = () => {
    onCtaClick?.();
    // Scroll to auth signup
    window.location.href = '/auth?mode=signup';
  };

  const handleDemoClick = () => {
    // Scroll to live games section
    const liveGamesSection = document.getElementById('live-games');
    if (liveGamesSection) {
      liveGamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="mobile-advantage"
      className="relative overflow-hidden"
    >
      {/* Top Divider */}
      <div className="w-full h-px bg-neutral-800" />

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#151515]" />

      {/* Radial Orange Glow */}
      <div 
        className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full opacity-[0.20] blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #FF6A2B 0%, transparent 70%)'
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[38%_62%] gap-8 lg:gap-12 items-center">
          
          {/* Left Column - Text Block */}
          <div 
            className={`space-y-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              The Mobile Advantage
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-neutral-300">
                Run your entire game from your phone
              </span>
            </h2>

            {/* Hook Paragraph */}
            <p className="text-base lg:text-lg text-neutral-300 leading-relaxed">
              No laptop required. No complex setup. Just your phone and the game. 
              Track stats, manage the clock, and broadcast to fans — all from one device 
              that fits in your pocket.
            </p>

            {/* Bullet Points */}
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li 
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-500`}
                  style={{ 
                    transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-12px)'
                  }}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-orange-400" strokeWidth={3} />
                  </div>
                  <span className="text-base lg:text-lg text-neutral-200 leading-relaxed">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button
                onClick={handleCtaClick}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-base lg:text-lg font-semibold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
              >
                Start Tracking Now
              </Button>
              <button
                onClick={handleDemoClick}
                className="text-orange-400 hover:text-orange-300 px-6 py-3 text-base lg:text-lg font-semibold transition-colors duration-200 underline decoration-orange-400/40 hover:decoration-orange-300/60 underline-offset-4"
              >
                See Live Demo Feed
              </button>
            </div>
          </div>

          {/* Right Column - iPhone Mockups */}
          <div 
            className={`relative h-[500px] lg:h-[600px] transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Back/Left Phone - Stat Tracker UI */}
            <div 
              className="absolute left-0 lg:left-8 top-1/2 -translate-y-1/2 w-[280px] sm:w-[320px] lg:w-[360px] transition-transform duration-700 hover:scale-105"
              style={{
                transform: isVisible 
                  ? 'translateY(-50%) scale(1.03) rotate(-5deg)' 
                  : 'translateY(-50%) scale(1) rotate(0deg)',
                zIndex: 1,
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.4))'
              }}
            >
              <ImageWithFallback
                src="/images/mobile-tracker-ui.png"
                alt="StatJam mobile stat tracker interface with game clock, shot clock, and one-tap stat buttons"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            {/* Front/Right Phone - Live Feed */}
            <div 
              className="absolute right-0 lg:right-12 top-1/2 -translate-y-1/2 w-[280px] sm:w-[320px] lg:w-[360px] transition-transform duration-700 hover:scale-105"
              style={{
                transform: isVisible 
                  ? 'translateY(-50%) scale(1)' 
                  : 'translateY(-50%) scale(0.95)',
                zIndex: 2,
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
              }}
            >
              <ImageWithFallback
                src="/images/mobile-live-feed..png"
                alt="StatJam mobile live play-by-play feed showing real-time game updates and scores"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>

        </div>

        {/* Optional Caption */}
        <p 
          className={`text-center text-sm lg:text-base text-neutral-400 mt-8 lg:mt-10 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Track and update fans — all from one device.
        </p>
      </div>
    </section>
  );
}

