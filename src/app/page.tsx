'use client';

import { useState, Suspense } from 'react';
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
      <PlayerPremiumSection />
      <LiveTournamentSection 
        onWatchLive={navigateToTournament} 
        onViewTournament={navigateToTournamentPage}
      />
      <Footer />
    </div>
  );
}// Test: CodeRabbit review demo - Mon Oct 27 09:41:38 EDT 2025
