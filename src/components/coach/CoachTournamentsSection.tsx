'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { TournamentService } from '@/lib/services/tournamentService';

interface TournamentWithTeams {
  id: string;
  name: string;
  start_date?: string;
  venue?: string;
  teamCount: number;
}

interface CoachTournamentsSectionProps {
  userId: string;
}

/**
 * CoachTournamentsSection - List-based tournament display
 * 
 * Simple, powerful UI following edit modal pattern
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachTournamentsSection({ userId }: CoachTournamentsSectionProps) {
  const [tournaments, setTournaments] = useState<TournamentWithTeams[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setLoading(true);
        
        // Fetch coach teams
        const teams = await CoachTeamService.getCoachTeams(userId);
        
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

        // Fetch tournament details (limit to 4 for overview)
        const tournamentData = await Promise.all(
          tournamentIds.slice(0, 4).map(async (tid) => {
            try {
              const tournament = await TournamentService.getTournament(tid);
              const teamCount = teams.filter(t => t.tournament_id === tid).length;
              
              return {
                id: tournament.id,
                name: tournament.name,
                start_date: tournament.start_date,
                venue: tournament.venue,
                teamCount
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
  }, [userId]);

  if (loading) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Tournament List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Tournament List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No tournaments connected yet
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard/coach?section=teams'}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Add Teams to Tournaments
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Tournament List
        </CardTitle>
        <Button
          onClick={() => window.location.href = '/dashboard/coach/tournaments'}
          variant="ghost"
          size="sm"
          className="gap-1 text-primary hover:text-primary"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {/* List Container */}
        <div className="space-y-0 -mx-6 px-6">
          {tournaments.map((tournament, index) => (
            <div
              key={tournament.id}
              className={`
                flex items-center justify-between py-3 px-4 -mx-4
                ${index !== tournaments.length - 1 ? 'border-b border-border/50' : ''}
              `}
            >
              <div className="flex-1 min-w-0">
                {/* Tournament Name */}
                <div className="font-medium text-sm mb-1">
                  {tournament.name}
                </div>
                
                {/* Tournament Meta */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {tournament.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(tournament.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {tournament.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[120px]">{tournament.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{tournament.teamCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* View All Button */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button
            onClick={() => window.location.href = '/dashboard/coach/tournaments'}
            variant="ghost"
            className="w-full gap-2 text-primary hover:text-primary hover:bg-primary/5"
          >
            View All Tournaments
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

