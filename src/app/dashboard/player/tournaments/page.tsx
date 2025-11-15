'use client';

import React, { Suspense } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Trophy, ArrowLeft, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayerTournaments } from '@/hooks/usePlayerTournaments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Player Tournaments Page
 * 
 * PURPOSE: Full-page view of tournaments player is part of and their schedules
 * Follows .cursorrules: <500 lines, modular, mobile-responsive
 */
function PlayerTournamentsContent() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { tournaments, schedules, loading, error } = usePlayerTournaments(user?.id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <NavigationHeader />
        <main className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <NavigationHeader />
        <main className="pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => router.push('/dashboard/player')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const hasNoData = tournaments.length === 0 && schedules.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <NavigationHeader />
      
      <main className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard/player')}
            variant="ghost"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              My Tournaments
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Tournaments you're part of and your game schedules
            </p>
          </div>

          {hasNoData ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  No Tournaments Yet
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
                  You're not part of any tournaments yet. Join a team to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="tournaments" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="tournaments" className="text-sm sm:text-base">
                  Tournaments ({tournaments.length})
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-sm sm:text-base">
                  Schedule ({schedules.length})
                </TabsTrigger>
              </TabsList>

              {/* Tournaments Tab */}
              <TabsContent value="tournaments" className="space-y-6">
                {tournaments.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent className="pt-6">
                      <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No tournaments found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    {tournaments.map((tournament) => (
                      <Card 
                        key={tournament.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/tournament/${tournament.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 flex-1">
                              <Trophy className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="line-clamp-2">{tournament.name}</span>
                            </CardTitle>
                            <Badge
                              variant={
                                tournament.status === 'active'
                                  ? 'default'
                                  : tournament.status === 'completed'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="ml-2 text-xs flex-shrink-0"
                            >
                              {tournament.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Tournament Info */}
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {tournament.start_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>
                                  {new Date(tournament.start_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                  {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}`}
                                </span>
                              </div>
                            )}
                            {tournament.venue && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="line-clamp-1">{tournament.venue}</span>
                              </div>
                            )}
                          </div>

                          {/* Team Info */}
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">Your Team</p>
                            <p className="text-sm font-medium text-card-foreground">
                              {tournament.teamName}
                            </p>
                          </div>

                          {/* View Tournament Link */}
                          <div className="flex items-center gap-2 text-primary text-sm font-medium pt-2">
                            <span>View Tournament</span>
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-4">
                {schedules.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent className="pt-6">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No upcoming games scheduled</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {schedules.map((game) => (
                      <Card 
                        key={game.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/game-viewer/${game.id}`)}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={
                                    game.status === 'in_progress'
                                      ? 'default'
                                      : game.status === 'completed'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {game.status === 'in_progress' ? 'LIVE' : game.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {game.tournamentName}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-2">
                                {game.isHome ? 'vs' : '@'} {game.opponent}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                {game.start_time && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {new Date(game.start_time).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                )}
                                {game.venue && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="line-clamp-1">{game.venue}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-primary text-sm font-medium">
                              <span>View Game</span>
                              <ExternalLink className="w-4 h-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PlayerTournamentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <PlayerTournamentsContent />
    </Suspense>
  );
}

