'use client';

import React from 'react';
import { Users, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { CoachTeam } from '@/lib/types/coach';
import { CoachTeamCard } from './CoachTeamCard';
import { CoachTournamentsSection } from './CoachTournamentsSection';

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
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 px-2 sm:px-0">
      {/* My Teams Section */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4">
          <CardTitle className="text-lg sm:text-xl font-semibold">My Teams</CardTitle>
          <Button
            onClick={() => window.location.href = '/dashboard/coach?section=teams'}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </CardHeader>
        <CardContent>
          {/* Stale-while-revalidate: Only show skeleton on initial load */}
          {loading && teams.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-8 bg-muted rounded mb-2"></div>
                    <div className="h-12 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : teams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {teams.map((team) => (
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

      {/* My Tournaments Section */}
      <CoachTournamentsSection userId={user?.id} />
    </div>
  );
}
