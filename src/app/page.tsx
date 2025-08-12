'use client';

import { useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { HeroSection } from '@/components/HeroSection';
import { PlayerPremiumSection } from '@/components/PlayerPremiumSection';
import { LiveTournamentSection } from '@/components/LiveTournamentSection';
import { Footer } from '@/components/Footer';
// Retire mock TournamentViewer in favor of live viewer links
import { TournamentPage } from '@/components/TournamentPage';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'landing' | 'tournamentPage'>('landing');

  const navigateToTournamentPage = () => {
    setCurrentView('tournamentPage');
  };

  const navigateToLanding = () => {
    setCurrentView('landing');
  };

  if (currentView === 'tournamentPage') {
    return <TournamentPage onBack={navigateToLanding} onWatchLive={navigateToTournamentPage} />;
  }

  return (
    <div className="min-h-screen">
      <NavigationHeader />
      <HeroSection 
        onWatchLive={navigateToTournamentPage} 
        onViewTournament={navigateToTournamentPage}
      />
      <PlayerPremiumSection />
      <LiveTournamentSection onViewTournament={navigateToTournamentPage} />
      <Footer />
    </div>
  );
}