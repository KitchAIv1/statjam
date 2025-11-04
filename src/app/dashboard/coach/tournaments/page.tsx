'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Trophy, ArrowLeft, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { TournamentService } from '@/lib/services/tournamentService';

interface TournamentWithTeams {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  teams: {
    id: string;
    name: string;
    approval_status?: string;
  }[];
}

/**
 * Coach Tournaments Page
 * 
 * Purpose: Display tournaments that coach teams are connected to
 * Status: Active (fetches from existing data)
 */
function CoachTournamentsContent() {
  const router = useRouter();
  const { user } = useAuthV2();
  const [tournaments, setTournaments] = useState<TournamentWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Fetch coach teams
        const teams = await CoachTeamService.getCoachTeams(user.id);
        
        // Extract unique tournament IDs
        const tournamentIds = [...new Set(
          teams
            .filter(t => t.tournament_id)
            .map(t => t.tournament_id!)
        )];

        if (tournamentIds.length === 0) {
          setTournaments([]);
          setLoading(false);
          return;
        }

        // Fetch tournament details
        const tournamentData = await Promise.all(
          tournamentIds.map(async (tid) => {
            try {
              const tournament = await TournamentService.getTournament(tid);
              const connectedTeams = teams.filter(t => t.tournament_id === tid);
              
              return {
                id: tournament.id,
                name: tournament.name,
                start_date: tournament.start_date,
                end_date: tournament.end_date,
                venue: tournament.venue,
                teams: connectedTeams.map(t => ({
                  id: t.id,
                  name: t.name,
                  approval_status: t.approval_status
                }))
              };
            } catch (error) {
              console.error('❌ Error fetching tournament:', tid, error);
              return null;
            }
          })
        );

        setTournaments(tournamentData.filter(Boolean) as TournamentWithTeams[]);
      } catch (error) {
        console.error('❌ Error loading tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
        <NavigationHeader />
        <main className="pt-24 pb-12 px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-red-50/30">
      <NavigationHeader />
      
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard/coach')}
            variant="ghost"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-orange-600" />
              My Tournaments
            </h1>
            <p className="text-gray-600">
              Tournaments your teams are connected to
            </p>
          </div>

          {/* Tournaments Grid */}
          {tournaments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  No Tournaments Yet
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your teams to tournaments to see them here. Use the "Add to Tournament" button on your team cards.
                </p>
                <Button
                  onClick={() => router.push('/dashboard/coach?section=teams')}
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Manage Teams
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      {tournament.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tournament Info */}
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {tournament.start_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
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
                          <MapPin className="w-4 h-4" />
                          <span>{tournament.venue}</span>
                        </div>
                      )}
                    </div>

                    {/* Connected Teams */}
                    <div>
                      <p className="text-sm font-medium mb-2">Your Teams ({tournament.teams.length})</p>
                      <div className="space-y-2">
                        {tournament.teams.map((team) => (
                          <div 
                            key={team.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <span className="text-sm font-medium">{team.name}</span>
                            {team.approval_status === 'pending' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                Pending
                              </Badge>
                            )}
                            {team.approval_status === 'rejected' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Denied
                              </Badge>
                            )}
                            {(!team.approval_status || team.approval_status === 'approved') && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions - Disabled for MVP */}
                    {/* <Button
                      onClick={() => router.push(`/dashboard/tournaments/${tournament.id}`)}
                      variant="outline"
                      className="w-full gap-2"
                      disabled
                    >
                      <Trophy className="w-4 h-4" />
                      View Tournament
                    </Button> */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CoachTournamentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <CoachTournamentsContent />
    </Suspense>
  );
}
