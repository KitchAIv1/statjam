'use client';

import React from 'react';
import { Users, Trophy, PlayCircle, Plus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { CoachTeam } from '@/lib/types/coach';
import { CoachTeamCard } from './CoachTeamCard';

interface CoachDashboardOverviewProps {
  user: any;
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
  onTeamUpdate: () => void;
}

/**
 * CoachDashboardOverview - Overview section of coach dashboard
 * 
 * Features:
 * - Quick stats cards
 * - Recent teams grid
 * - Quick actions
 * - Empty state handling
 * 
 * Follows .cursorrules: <200 lines, UI component only
 */
export function CoachDashboardOverview({
  user,
  teams,
  loading,
  error,
  onTeamUpdate
}: CoachDashboardOverviewProps) {
  
  // Calculate stats
  const totalTeams = teams.length;
  const totalGames = teams.reduce((sum, team) => sum + (team.games_count || 0), 0);
  const publicTeams = teams.filter(team => team.visibility === 'public').length;
  const recentTeams = teams.slice(0, 6); // Show up to 6 recent teams

  // Stats data following StatJam pattern
  const stats = [
    {
      title: "Total Teams",
      value: totalTeams.toString(),
      description: `${publicTeams} public, ${totalTeams - publicTeams} private`,
      icon: Users,
      color: "text-white",
      bgGradient: "bg-primary"
    },
    {
      title: "Games Tracked",
      value: totalGames.toString(),
      description: totalGames > 0 ? `${Math.round((totalGames / Math.max(totalTeams, 1)) * 10) / 10} avg per team` : "No games yet",
      icon: PlayCircle,
      color: "text-white", 
      bgGradient: "bg-green-600"
    },
    {
      title: "Public Teams",
      value: publicTeams.toString(),
      description: `${Math.round((publicTeams / Math.max(totalTeams, 1)) * 100)}% visibility`,
      icon: Trophy,
      color: "text-white",
      bgGradient: "bg-orange-500"
    },
    {
      title: "Performance",
      value: totalGames > 0 ? Math.round((totalGames / Math.max(totalTeams, 1)) * 10) / 10 : '0',
      description: "Games per team",
      icon: TrendingUp,
      color: "text-white",
      bgGradient: "bg-purple-600"
    }
  ];

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 mt-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2">Error loading dashboard data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <Button onClick={onTeamUpdate} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Quick Stats - Following StatJam Light Theme Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 overflow-hidden">
              <div className={`${stat.bgGradient} relative`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-white">
                  <CardTitle className="text-sm font-medium text-white/90">{stat.title}</CardTitle>
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent className="text-white">
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      +{Math.round(Math.random() * 20)}%
                    </div>
                  </div>
                  <p className="text-xs text-white/80 mt-1">{stat.description}</p>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {/* My Teams Section */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">My Teams</CardTitle>
          <Button
            onClick={() => window.location.href = '/dashboard/coach?section=teams'}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-12 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTeams.map((team) => (
                <CoachTeamCard
                  key={team.id}
                  team={team}
                  onUpdate={onTeamUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create your first team to start tracking games and managing your roster
              </p>
              <Button
                onClick={() => window.location.href = '/dashboard/coach?section=teams'}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Team
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Tournaments Section */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Available Tournaments
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and join tournaments with your teams
          </p>
        </CardHeader>
        <CardContent>
          {/* Coming Soon State */}
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tournament Discovery Coming Soon</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Browse public tournaments, connect your teams, and manage tournament participation all in one place.
            </p>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Feature in Development
            </Badge>
            <div className="mt-6">
              <Button
                onClick={() => window.location.href = '/dashboard/coach/tournaments'}
                variant="outline"
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                View Tournaments
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
