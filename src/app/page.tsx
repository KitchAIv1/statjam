'use client';

import { useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { HeroSection } from '@/components/HeroSection';
import { PlayerPremiumSection } from '@/components/PlayerPremiumSection';
import { LiveTournamentSection } from '@/components/LiveTournamentSection';
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

  if (currentView === 'tournament') {
    return <TournamentViewer onBack={navigateToLanding} />;
  }

  if (currentView === 'tournamentPage') {
    return <TournamentPage onBack={navigateToLanding} onWatchLive={navigateToTournament} />;
  }

  return (
    <div className="min-h-screen">
      <NavigationHeader />
      <HeroSection 
        onWatchLive={navigateToTournament} 
        onViewTournament={navigateToTournamentPage}
      />
      <PlayerPremiumSection />
      <LiveTournamentSection 
        onWatchLive={navigateToTournament} 
        onViewTournament={navigateToTournamentPage}
      />
      <Footer />
    </div>
  );
}