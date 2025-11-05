'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  Users, PlayCircle, BarChart3, Settings,
  Check, ChevronRight
} from 'lucide-react';

export default function FeaturesPage() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const [playerCarouselIndex, setPlayerCarouselIndex] = useState(0);

  const playerCarouselImages = [
    '/images/Player carousel 1.png',
    '/images/Player carousel 2.png',
    '/images/Player carousel 3.png',
    '/images/Player carousel 4.png'
  ];

  // Redirect if user is signed in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // If loading or user exists, don't render
  if (loading || user) {
    return null;
  }

  const profiles = [
    {
      id: 'player',
      title: 'Player Dashboard',
      subtitle: 'Your stats, your legacy',
      icon: Users,
      description: 'Build your basketball legacy with permanent, pro-grade stat tracking. See every game, every achievement, every milestone.',
      gradient: 'from-blue-500 to-cyan-500',
      glowColor: 'rgba(59, 130, 246, 0.2)',
      features: [
        'Personal dashboard with season averages & career highs',
        'Performance analytics with game-by-game trends',
        'Personal stat tracker for pickup games & practices',
        'Achievement badges & performance highlights',
        'Profile photos & action poses with NBA-style cards',
        'Complete game history with detailed box scores',
        'Upcoming games & tournament schedules',
        'Shooting efficiency metrics (FG%, 3PT%, FT%)'
      ]
    },
    {
      id: 'stat-admin',
      title: 'Stat Admin',
      subtitle: 'NBA-level precision, zero complexity',
      icon: PlayCircle,
      description: 'Track games with professional accuracy. Smart automation handles sequences, clocks, and possession — you just tap and record.',
      gradient: 'from-green-500 to-emerald-500',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      features: [
        'Real-time stat tracking with instant updates',
        'Dual clock system (game + shot clock with auto-reset)',
        'Smart automation (auto-pause, possession flips, sequences)',
        'Complete stat recording (points, rebounds, assists, blocks, steals)',
        'Foul management with automatic free throw sequences',
        'Substitution system with instant roster updates',
        'Play-by-play sequences (assists, rebounds, blocks)',
        'Shot clock violation detection & handling'
      ]
    },
    {
      id: 'coach',
      title: 'Coach Tools',
      subtitle: 'See performance, make decisions',
      icon: BarChart3,
      description: 'Real stats, real insights. Track your team, analyze trends, and make game-day decisions backed by data.',
      gradient: 'from-purple-500 to-pink-500',
      glowColor: 'rgba(168, 85, 247, 0.2)',
      features: [
        'Team management with mixed rosters (users + custom players)',
        'Quick Track stat tracking for non-tournament games',
        'Player performance analytics & game-to-game trends',
        'Opponent stat tracking during games',
        'Team statistics & player performance reports',
        'Real-time game viewing with live updates',
        'Public/private team visibility controls',
        'Game scheduling & team management'
      ]
    },
    {
      id: 'organizer',
      title: 'Tournament Organizer',
      subtitle: 'Run tournaments like a pro',
      icon: Settings,
      description: 'Manage tournaments from one dashboard. Create schedules, assign stat admins, track progress — all automated.',
      gradient: 'from-orange-500 to-red-500',
      glowColor: 'rgba(249, 115, 22, 0.2)',
      features: [
        'Tournament creation & management with full control',
        'Team & player roster management per tournament',
        'Game scheduling with date, time & venue management',
        'Stat admin assignment per game',
        'Tournament dashboard with stats & overview',
        'Public/private tournament visibility controls',
        'Bracket builder & pool play scheduler',
        'Live game tracking & tournament progress'
      ]
    }
  ];

  // Auto-rotate player carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayerCarouselIndex((prev) => (prev + 1) % playerCarouselImages.length);
    }, 3500); // Change every 3.5 seconds

    return () => clearInterval(interval);
  }, [playerCarouselImages.length]);

  // Intersection observer for animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    
    profiles.forEach((_, index) => {
      const element = document.getElementById(`profile-${index}`);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleSections(prev => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach(observer => observer.disconnect());
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavigationHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#151515]" />
        
        {/* Orange Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.15] blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #FF6A2B 0%, transparent 70%)'
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Built for Everyone
              <span className="block text-3xl sm:text-4xl lg:text-5xl mt-3 text-neutral-300">
                From players to tournament organizers
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              Whether you're tracking personal stats, running games, coaching teams, or organizing tournaments — 
              StatJam has the tools you need.
            </p>
          </div>
        </div>
      </section>

      {/* Profile Sections */}
      {profiles.map((profile, index) => {
        const IconComponent = profile.icon;
        const isVisible = visibleSections.has(index);
        const isEven = index % 2 === 0;

        return (
          <section 
            key={profile.id}
            id={`profile-${index}`}
            className="relative overflow-hidden"
          >
            {/* Divider */}
            <div className="w-full h-px bg-neutral-800" />

            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#151515]" />

            {/* Glow Effect */}
            <div 
              className={`absolute top-1/2 ${isEven ? 'left-1/4' : 'right-1/4'} -translate-y-1/2 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full opacity-[0.15] blur-3xl pointer-events-none`}
              style={{
                background: `radial-gradient(circle, ${profile.glowColor.replace('0.2', '1')} 0%, transparent 70%)`
              }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                
                {/* Text Column */}
                <div 
                  className={`space-y-6 ${!isEven ? 'lg:order-2' : 'lg:order-1'} transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${isEven ? '-translate-x-8' : 'translate-x-8'}`
                  }`}
                >
                  {/* Icon Badge */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${profile.gradient} shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Headline */}
                  <div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2">
                      {profile.title}
                    </h2>
                    <p className="text-xl sm:text-2xl lg:text-3xl text-neutral-300 font-medium">
                      {profile.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-base lg:text-lg text-neutral-300 leading-relaxed">
                    {profile.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3 pt-2">
                    {profile.features.map((feature, featureIdx) => (
                      <li 
                        key={featureIdx}
                        className="flex items-start gap-3 transition-all duration-500"
                        style={{ 
                          transitionDelay: isVisible ? `${featureIdx * 80 + 200}ms` : '0ms',
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'translateX(0)' : `translateX(${isEven ? '-12px' : '12px'})`
                        }}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${profile.gradient} bg-opacity-20 flex items-center justify-center mt-0.5`}>
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-base text-neutral-200 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Column */}
                <div 
                  className={`${!isEven ? 'lg:order-1' : 'lg:order-2'} transition-all duration-1000 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  {/* Player: Carousel */}
                  {index === 0 ? (
                    <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center">
                      <div className="relative w-full max-w-[500px] h-[400px] lg:h-[500px]">
                        {/* Carousel Images */}
                        {playerCarouselImages.map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="absolute inset-0 transition-opacity duration-700"
                            style={{
                              opacity: imgIndex === playerCarouselIndex ? 1 : 0,
                              zIndex: imgIndex === playerCarouselIndex ? 1 : 0
                            }}
                          >
                            <ImageWithFallback
                              src={image}
                              alt={`StatJam Player Dashboard Feature ${imgIndex + 1}`}
                              className="w-full h-full object-contain"
                              loading="lazy"
                              style={{
                                filter: 'drop-shadow(0 25px 50px rgba(59, 130, 246, 0.3))'
                              }}
                            />
                          </div>
                        ))}

                        {/* Carousel Indicators */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                          {playerCarouselImages.map((_, imgIndex) => (
                            <button
                              key={imgIndex}
                              onClick={() => setPlayerCarouselIndex(imgIndex)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                imgIndex === playerCarouselIndex 
                                  ? 'bg-blue-500 w-6' 
                                  : 'bg-neutral-600 hover:bg-neutral-500'
                              }`}
                              aria-label={`Go to slide ${imgIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : index === 1 ? (
                    /* Stat Admin: Device Mockups (iPad + iPhone) */
                    <div className="relative h-[450px] lg:h-[550px]">
                      {/* iPad - Back/Left */}
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[320px] sm:w-[380px] lg:w-[440px] transition-transform duration-700 hover:scale-105"
                        style={{
                          transform: isVisible 
                            ? 'translateY(-50%) scale(1) rotate(-3deg)' 
                            : 'translateY(-50%) scale(0.95) rotate(0deg)',
                          zIndex: 1,
                          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.5))'
                        }}
                      >
                        <ImageWithFallback
                          src="/images/sequence-1-foul.png"
                          alt="StatJam iPad interface showing foul tracking sequence"
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>

                      {/* iPhone - Front/Right */}
                      <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-[240px] sm:w-[280px] lg:w-[320px] transition-transform duration-700 hover:scale-105"
                        style={{
                          transform: isVisible 
                            ? 'translateY(-50%) scale(1.05)' 
                            : 'translateY(-50%) scale(1)',
                          zIndex: 2,
                          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.6))'
                        }}
                      >
                        <ImageWithFallback
                          src="/images/mobile-tracker-ui.png"
                          alt="StatJam mobile tracker interface with dual clocks and one-tap stats"
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Large Icon Display for Coach & Organizer */
                    <div className="relative flex items-center justify-center h-[400px] lg:h-[500px]">
                      <div 
                        className={`w-64 h-64 lg:w-80 lg:h-80 rounded-3xl bg-gradient-to-br ${profile.gradient} flex items-center justify-center shadow-2xl`}
                        style={{
                          boxShadow: `0 25px 50px ${profile.glowColor}, 0 0 100px ${profile.glowColor}`
                        }}
                      >
                        <IconComponent className="w-32 h-32 lg:w-40 lg:h-40 text-white/90" strokeWidth={1.5} />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>
        );
      })}

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        {/* Divider */}
        <div className="w-full h-px bg-neutral-800" />

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#151515]" />

        {/* Orange Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.2] blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #FF6A2B 0%, transparent 70%)'
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-20 lg:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg lg:text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Join thousands of players, coaches, and organizers using StatJam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/auth?mode=signup')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
            >
              Sign Up Free
              <ChevronRight className="inline-block ml-2 w-5 h-5" />
            </Button>
            <button
              onClick={() => router.push('/')}
              className="text-orange-400 hover:text-orange-300 px-8 py-4 text-lg font-semibold transition-colors duration-200 underline decoration-orange-400/40 hover:decoration-orange-300/60 underline-offset-4"
            >
              Explore Platform
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
