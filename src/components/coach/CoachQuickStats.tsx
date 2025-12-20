'use client';

import React from 'react';
import { Users, PlayCircle, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { CoachTeam } from '@/lib/types/coach';

interface CoachQuickStatsProps {
  teams: CoachTeam[];
  loading: boolean;
}

/**
 * CoachQuickStats - Compact 2x2 grid of square stat cards
 * Designed to sit beside the profile card on desktop
 * 
 * Follows .cursorrules: <200 lines, UI only
 */
export function CoachQuickStats({ teams, loading }: CoachQuickStatsProps) {
  // Calculate stats
  const totalTeams = teams.length;
  const totalGames = teams.reduce((sum, team) => sum + (team.games_count || 0), 0);
  const publicTeams = teams.filter(team => team.visibility === 'public').length;
  const avgGamesPerTeam = totalTeams > 0 ? Math.round((totalGames / totalTeams) * 10) / 10 : 0;

  const privateTeams = totalTeams - publicTeams;
  
  const stats = [
    {
      title: "Teams",
      value: totalTeams.toString(),
      description: `${publicTeams} public, ${privateTeams} private`,
      icon: Users,
      bgGradient: "bg-primary"
    },
    {
      title: "Games",
      value: totalGames.toString(),
      description: totalGames > 0 ? "Tracked this season" : "No games yet",
      icon: PlayCircle,
      bgGradient: "bg-green-600"
    },
    {
      title: "Public",
      value: publicTeams.toString(),
      description: totalTeams > 0 ? `${Math.round((publicTeams / totalTeams) * 100)}% visibility` : "0% visibility",
      icon: Trophy,
      bgGradient: "bg-orange-500"
    },
    {
      title: "Avg/Team",
      value: avgGamesPerTeam.toString(),
      description: "Games per team",
      icon: TrendingUp,
      bgGradient: "bg-purple-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="border-0 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`${stat.bgGradient} aspect-square flex flex-col items-center justify-center p-3`}>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mb-1.5">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white font-medium">{stat.title}</div>
              <div className="text-[10px] text-white/70 text-center mt-1 line-clamp-1 px-1">
                {stat.description}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * CoachQuickStatsSkeleton - Loading skeleton for quick stats
 */
export function CoachQuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
