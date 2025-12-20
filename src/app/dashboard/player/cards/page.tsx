'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { TemplateBrowser } from '@/components/cards/TemplateBrowser';
import { CardCustomizer } from '@/components/cards/CardCustomizer';
import { QuickCardGenerator } from '@/components/cards/QuickCardGenerator';
import { usePlayerDashboardData } from '@/hooks/usePlayerDashboardData';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeModal } from '@/components/subscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Sparkles, Trophy, Zap, Lock, Crown } from 'lucide-react';
import { QuickCardResult } from '@/lib/services/playerCardService';

type ViewState = 'home' | 'quick' | 'browse' | 'customize' | 'success';

export default function PlayerCardsPage() {
  const { user, loading } = useAuthContext();
  const userRole = user?.role;
  const router = useRouter();
  const { data: playerData } = usePlayerDashboardData(user);
  const { tier, limits } = useSubscription('player');
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<{
    templateId: string;
    variantId: string;
  } | null>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || userRole !== 'player')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'player') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-4 text-lg font-medium">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const handleTemplateSelect = (templateId: string, variantId: string) => {
    setSelectedTemplate({ templateId, variantId });
    setCurrentView('customize');
  };

  const handleBackToBrowse = () => {
    setCurrentView('browse');
    setSelectedTemplate(null);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedTemplate(null);
    setGeneratedCardUrl(null);
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard/player');
  };

  const handleCardGenerated = (cardUrl: string) => {
    setGeneratedCardUrl(cardUrl);
    setCurrentView('success');
  };

  const handleQuickCardGenerated = (result: QuickCardResult) => {
    if (result.status === 'success' && result.outputs) {
      setGeneratedCardUrl(result.outputs.web);
      setCurrentView('success');
    }
  };

  const handleCreateAnother = () => {
    setCurrentView('home');
    setSelectedTemplate(null);
    setGeneratedCardUrl(null);
  };

  // Prepare player data for card generation
  const cardPlayerData = {
    name: playerData.identity?.name || 'Player Name',
    jerseyNumber: playerData.identity?.jerseyNumber?.toString() || '00',
    position: playerData.identity?.position || 'Player',
    team: playerData.identity?.teamName || 'Team',
    profilePhotoUrl: playerData.identity?.profilePhotoUrl,
    posePhotoUrl: playerData.identity?.posePhotoUrl,
    stats: {
      points: playerData.season?.pointsPerGame || 0,
      rebounds: playerData.season?.reboundsPerGame || 0,
      assists: playerData.season?.assistsPerGame || 0,
      fieldGoalPct: playerData.season?.fieldGoalPct || 0,
      threePointPct: playerData.season?.threePointPct || 0,
      freeThrowPct: playerData.season?.freeThrowPct || 0,
    }
  };

  return (
    <>
      <NavigationHeader />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30 pt-20">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleBackToDashboard}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  NBA Card Generator
                </h1>
                <p className="text-muted-foreground">
                  Create professional basketball trading cards with your stats
                </p>
              </div>
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === 'home' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Subscription Gate - Show upgrade prompt for free users */}
              {!limits.hasExportStats && (
                <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Stat Cards are a Premium Feature
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Upgrade to create and download professional NBA-style trading cards with your stats.
                    </p>
                    <Button 
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Unlock
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Welcome Section - Only show if user has access */}
              {limits.hasExportStats && (
                <Card className="text-center">
                  <CardHeader>
                    <CardTitle className="text-2xl">Choose Your Card Generation Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6">
                      Create your personalized NBA trading card using one of our generation methods
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Quick Generator Option */}
                      <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
                            onClick={() => setCurrentView('quick')}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-6 h-6 text-primary" />
                            ⚡ Quick Generator
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Upload your photo and get a stunning holographic NBA card in seconds!
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                AI-Powered
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                3-5 seconds
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                Surprise templates
                              </span>
                            </div>
                            <Button className="w-full">
                              Try Quick Generator
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Template Browser Option */}
                      <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                            onClick={() => setCurrentView('browse')}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Trophy className="w-6 h-6 text-orange-500" />
                            🎨 Template Browser
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Browse and customize from our collection of professional templates
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                Custom templates
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Full control
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                Preview first
                              </span>
                            </div>
                            <Button variant="outline" className="w-full">
                              Browse Templates
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentView === 'quick' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <Button variant="outline" onClick={handleBackToHome}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Options
                </Button>
              </div>
              <QuickCardGenerator
                playerData={{
                  name: cardPlayerData.name,
                  jerseyNumber: cardPlayerData.jerseyNumber,
                  position: cardPlayerData.position,
                  team: cardPlayerData.team,
                  stats: {
                    ppg: cardPlayerData.stats.points,
                    rpg: cardPlayerData.stats.rebounds,
                    apg: cardPlayerData.stats.assists
                  }
                }}
                onCardGenerated={handleQuickCardGenerated}
              />
            </div>
          )}

          {currentView === 'browse' && (
            <div>
              <div className="mb-6">
                <Button variant="outline" onClick={handleBackToHome}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Options
                </Button>
              </div>
              <TemplateBrowser 
                onTemplateSelect={handleTemplateSelect}
              />
            </div>
          )}

          {currentView === 'customize' && selectedTemplate && (
            <CardCustomizer
              templateId={selectedTemplate.templateId}
              variantId={selectedTemplate.variantId}
              playerData={cardPlayerData}
              onBack={handleBackToBrowse}
              onCardGenerated={handleCardGenerated}
            />
          )}

          {currentView === 'success' && generatedCardUrl && (
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Your NBA Card is Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Generated Card Display */}
                  <div className="flex justify-center">
                    <div className="max-w-sm">
                      <img
                        src={generatedCardUrl}
                        alt="Generated NBA Card"
                        className="w-full rounded-lg shadow-2xl"
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild>
                      <a href={generatedCardUrl} download target="_blank" rel="noopener noreferrer">
                        Download Card
                      </a>
                    </Button>
                    <Button variant="outline" onClick={handleCreateAnother}>
                      Create Another Card
                    </Button>
                    <Button variant="ghost" onClick={handleBackToDashboard}>
                      Back to Dashboard
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Your card has been saved to your gallery and is ready to download or share!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="player"
        currentTier={tier}
        triggerReason="Unlock stat card generation and downloads."
      />
    </>
  );
}
