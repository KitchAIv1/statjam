'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { NavigationHeader } from '@/components/NavigationHeader';
import { HeroSection } from '@/components/HeroSection';
import { Differentiators } from '@/components/marketing/Differentiators';
import { SmartSequencesCarousel } from '@/components/marketing/SmartSequencesCarousel';
import { LiveTournamentSection } from '@/components/LiveTournamentSection';
import { Footer } from '@/components/Footer';

// Lazy load below-the-fold components
const AudienceGrid = dynamic(() => import('@/components/marketing/AudienceGrid').then(mod => ({ default: mod.AudienceGrid })), { ssr: true });
const PlayerPremiumSection = dynamic(() => import('@/components/PlayerPremiumSection').then(mod => ({ default: mod.PlayerPremiumSection })), { ssr: true });
const ProofTrust = dynamic(() => import('@/components/marketing/ProofTrust').then(mod => ({ default: mod.ProofTrust })), { ssr: true });
const RoadmapSection = dynamic(() => import('@/components/marketing/RoadmapSection').then(mod => ({ default: mod.RoadmapSection })), { ssr: true });
const FinalCta = dynamic(() => import('@/components/marketing/FinalCta').then(mod => ({ default: mod.FinalCta })), { ssr: true });
const TournamentViewer = dynamic(() => import('@/components/TournamentViewer').then(mod => ({ default: mod.TournamentViewer })), { ssr: false });
const TournamentPage = dynamic(() => import('@/components/TournamentPage').then(mod => ({ default: mod.TournamentPage })), { ssr: false });

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'landing' | 'tournament' | 'tournamentPage'>('landing');

  const navigateToTournament = () => {
    setCurrentView('tournament');
  };

  const navigateToTournamentPage = () => {
    setCurrentView('tournamentPage');
  };

  const navigateToLanding = () => {
    setCurrentView('landing');
  };

  const scrollToLiveGames = () => {
    const liveGamesSection = document.getElementById('live-games');
    if (liveGamesSection) {
      liveGamesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Analytics handlers for SmartSequencesCarousel
  const handleSequencesView = () => {
    // Fire analytics event when section enters viewport
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('carousel_view', { 
        props: { section: 'sequences' } 
      });
    }
  };

  const handleSequencesSlideChange = (index: number) => {
    // Fire analytics event when slide changes
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('carousel_slide_change', { 
        props: { 
          index: index, 
          name: 'shooting_foul_sequence' 
        } 
      });
    }
  };

  if (currentView === 'tournament') {
    return <TournamentViewer onBack={navigateToLanding} />;
  }

  if (currentView === 'tournamentPage') {
    return <TournamentPage onBack={navigateToLanding} onWatchLive={navigateToTournament} />;
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-16 bg-gray-900" />}>
        <NavigationHeader />
      </Suspense>
      <HeroSection 
        onWatchLive={scrollToLiveGames} 
        onViewTournament={navigateToTournamentPage}
      />
      <Differentiators />
      <SmartSequencesCarousel 
        onSlideChange={handleSequencesSlideChange}
        onSectionView={handleSequencesView}
      />
      <LiveTournamentSection 
        onWatchLive={navigateToTournament} 
        onViewTournament={navigateToTournamentPage}
      />
      <AudienceGrid />
      <PlayerPremiumSection />
      <ProofTrust />
      <RoadmapSection />
      <FinalCta onWatchLive={navigateToTournament} onStartTracking={navigateToTournament} />
      <Footer />
    </div>
  );
}