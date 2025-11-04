'use client';

import { useState, Suspense } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { HeroSection } from '@/components/HeroSection';
import { PlayerPremiumSection } from '@/components/PlayerPremiumSection';
import { LiveTournamentSection } from '@/components/LiveTournamentSection';
import { Differentiators } from '@/components/marketing/Differentiators';
import { AudienceGrid } from '@/components/marketing/AudienceGrid';
import { ProofTrust } from '@/components/marketing/ProofTrust';
import { RoadmapSection } from '@/components/marketing/RoadmapSection';
import { FinalCta } from '@/components/marketing/FinalCta';
import { Footer } from '@/components/Footer';
import { TournamentViewer } from '@/components/TournamentViewer';
import { TournamentPage } from '@/components/TournamentPage';

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