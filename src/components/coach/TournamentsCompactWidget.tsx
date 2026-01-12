'use client';

/**
 * TournamentsCompactWidget - Compact tournament connections display
 * 
 * Shows connected tournaments with status badges.
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { CoachTeamService } from '@/lib/services/coachTeamService';

interface TournamentInfo {
  id: string;
  name: string;
  startDate?: string;
  teamCount: number;
}

interface TournamentsCompactWidgetProps {
  userId: string;
}

export function TournamentsCompactWidget({ userId }: TournamentsCompactWidgetProps) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        // Get all coach teams
        const teams = await CoachTeamService.getCoachTeams(userId);
        
        if (teams.length === 0) {
          setTournaments([]);
          setLoading(false);
          return;
        }

        // Fetch tournaments from junction table for all teams
        const allTournamentLinks = await Promise.all(
          teams.map(team => CoachTeamService.getTeamTournaments(team.id))
        );

        // Flatten and deduplicate by tournament_id
        const tournamentMap = new Map<string, TournamentInfo>();
        allTournamentLinks.flat().forEach(link => {
          if (!tournamentMap.has(link.tournament_id)) {
            tournamentMap.set(link.tournament_id, {
              id: link.tournament_id,
              name: link.tournament_name || 'Unknown Tournament',
              startDate: undefined,
              teamCount: 1,
            });
          } else {
            // Increment team count if same tournament
            const existing = tournamentMap.get(link.tournament_id)!;
            existing.teamCount++;
          }
        });

        setTournaments(Array.from(tournamentMap.values()).slice(0, 3));
      } catch (err) {
        console.error('❌ TournamentsCompactWidget error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [userId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="p-4 bg-white border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-500" />
          Tournaments
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard/coach/tournaments')} 
          className="h-6 text-xs text-gray-500"
        >
          Browse <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          No tournaments connected
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{t.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {t.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(t.startDate)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t.teamCount} teams
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                Active
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

