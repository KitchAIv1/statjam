'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BarChart3, History, Trophy } from 'lucide-react';
import { PersonalGameForm } from './PersonalGameForm';
import { PersonalGamesList } from './PersonalGamesList';
import { usePersonalGames } from '@/hooks/usePersonalGames';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * PersonalStatTracker - Main container for personal player stat tracking
 * 
 * Features:
 * - New game creation form
 * - Personal games history list
 * - Stats overview/summary
 * - Tab-based navigation
 */
export function PersonalStatTracker() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('new-game');
  
  const {
    games,
    totalGames,
    loading,
    creating,
    createGame,
    refreshGames,
    loadMoreGames,
    hasMore
  } = usePersonalGames(user?.id || null);

  // Calculate quick stats for overview
  const recentGames = games.slice(0, 5);
  const avgPoints = games.length > 0 ? 
    Math.round(games.reduce((sum, game) => sum + game.points, 0) / games.length * 10) / 10 : 0;
  const totalPoints = games.reduce((sum, game) => sum + game.points, 0);
  const bestGame = games.reduce((best, game) => 
    game.points > (best?.points || 0) ? game : best, games[0] || null);

  const handleGameCreated = () => {
    // Switch to history tab after creating a game
    setActiveTab('history');
    refreshGames();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-muted-foreground">
              Please sign in to track your personal games and stats.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personal Stat Tracker</h1>
          <p className="text-muted-foreground">
            Track your pickup games, practices, and scrimmages
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalGames}</div>
            <div className="text-xs text-muted-foreground">Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{avgPoints}</div>
            <div className="text-xs text-muted-foreground">Avg PTS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total PTS</div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new-game" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Game</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
            {totalGames > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                {totalGames}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* New Game Tab */}
        <TabsContent value="new-game" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Record New Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PersonalGameForm
                onGameCreated={handleGameCreated}
                creating={creating}
                onSubmit={createGame}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <PersonalGamesList
            games={games}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMoreGames}
            onRefresh={refreshGames}
          />
        </TabsContent>

        {/* Stats Overview Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Career Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Career Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Games Played</span>
                  <span className="font-semibold">{totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-semibold">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Points</span>
                  <span className="font-semibold">{avgPoints}</span>
                </div>
                {bestGame && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Career High</span>
                    <span className="font-semibold">{bestGame.points} PTS</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Performance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Games</CardTitle>
              </CardHeader>
              <CardContent>
                {recentGames.length > 0 ? (
                  <div className="space-y-2">
                    {recentGames.map((game, index) => (
                      <div key={game.id} className="flex justify-between items-center py-1">
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(game.game_date).toLocaleDateString()}
                          </div>
                          {game.opponent && (
                            <div className="text-xs text-muted-foreground">
                              vs {game.opponent}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{game.points} PTS</div>
                          <div className="text-xs text-muted-foreground">
                            {game.stats.stat_line}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No games recorded yet</p>
                    <p className="text-xs">Start tracking your games to see stats here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shooting Stats Card */}
            {games.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Shooting Averages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const totalFgMade = games.reduce((sum, game) => sum + game.fg_made, 0);
                    const totalFgAttempted = games.reduce((sum, game) => sum + game.fg_attempted, 0);
                    const total3ptMade = games.reduce((sum, game) => sum + game.three_pt_made, 0);
                    const total3ptAttempted = games.reduce((sum, game) => sum + game.three_pt_attempted, 0);
                    const totalFtMade = games.reduce((sum, game) => sum + game.ft_made, 0);
                    const totalFtAttempted = games.reduce((sum, game) => sum + game.ft_attempted, 0);

                    const fgPct = totalFgAttempted > 0 ? 
                      Math.round((totalFgMade / totalFgAttempted) * 1000) / 10 : 0;
                    const threePct = total3ptAttempted > 0 ? 
                      Math.round((total3ptMade / total3ptAttempted) * 1000) / 10 : 0;
                    const ftPct = totalFtAttempted > 0 ? 
                      Math.round((totalFtMade / totalFtAttempted) * 1000) / 10 : 0;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Field Goal %</span>
                          <span className="font-semibold">{fgPct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">3-Point %</span>
                          <span className="font-semibold">{threePct}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Free Throw %</span>
                          <span className="font-semibold">{ftPct}%</span>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Empty State for Stats */}
          {games.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Stats Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Record your first game to start seeing your personal statistics and trends.
                </p>
                <Button onClick={() => setActiveTab('new-game')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record First Game
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
