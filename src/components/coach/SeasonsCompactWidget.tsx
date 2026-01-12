'use client';

/**
 * SeasonsCompactWidget - Compact seasons display for coach dashboard
 * 
 * Shows coach seasons with win/loss record and status badges.
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { SeasonService } from '@/lib/services/seasonService';
import { CoachTeamService } from '@/lib/services/coachTeamService';
import { Season } from '@/lib/types/season';

interface SeasonsCompactWidgetProps {
  userId: string;
}

export function SeasonsCompactWidget({ userId }: SeasonsCompactWidgetProps) {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        // Get all coach teams
        const teams = await CoachTeamService.getCoachTeams(userId);
        
        if (teams.length === 0) {
          setSeasons([]);
          setLoading(false);
          return;
        }

        // Fetch seasons for all teams
        const allSeasons = await Promise.all(
          teams.map(team => SeasonService.getSeasonsByTeam(team.id))
        );

        // Flatten, sort by created_at, take top 3
        const flatSeasons = allSeasons.flat()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);

        setSeasons(flatSeasons);
      } catch (err) {
        console.error('❌ SeasonsCompactWidget error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 border-green-300';
      case 'completed': return 'text-blue-600 border-blue-300';
      default: return 'text-gray-600 border-gray-300';
    }
  };

  return (
    <Card className="p-4 bg-white border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Seasons
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          No seasons created yet
        </div>
      ) : (
        <div className="space-y-2">
          {seasons.map((season) => (
            <div 
              key={season.id} 
              onClick={() => router.push(`/dashboard/coach/season/${season.id}`)}
              className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{season.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <TrendingUp className="w-3 h-3" />
                    {season.wins}-{season.losses}
                  </span>
                  <span>•</span>
                  <span>{season.total_games} games</span>
                </div>
              </div>
              <Badge variant="outline" className={`text-[10px] ${getStatusColor(season.status)}`}>
                {season.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

