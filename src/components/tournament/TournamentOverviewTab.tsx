'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Tournament } from '@/lib/types/tournament';
import { Users, Calendar, Trophy, Globe, Lock, MapPin, Play, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface TournamentOverviewTabProps {
  tournament: Tournament;
  tournamentId: string;
  currentTeams: number;
  maxTeams: number;
  gameCount: number;
  teamCountLoading: boolean;
  gameStatusLoading: boolean;
  onSettingsClick: () => void;
}

export function TournamentOverviewTab({
  tournament,
  tournamentId,
  currentTeams,
  maxTeams,
  gameCount,
  teamCountLoading,
  gameStatusLoading,
  onSettingsClick,
}: TournamentOverviewTabProps) {
  const router = useRouter();

  return (
    <div className="mt-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-100"
          value={teamCountLoading ? '...' : currentTeams}
          label={`of ${maxTeams} Teams`}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-100"
          value={gameStatusLoading ? '...' : gameCount}
          label="Games"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-100"
          value={tournament.tournamentType.replace('_', ' ')}
          label="Format"
          isText
        />
        <StatCard
          icon={tournament.isPublic ? <Globe className="w-5 h-5 text-orange-600" /> : <Lock className="w-5 h-5 text-orange-600" />}
          iconBg="bg-orange-100"
          value={tournament.isPublic ? 'Public' : 'Private'}
          label="Visibility"
          isText
        />
      </div>

      {/* Info Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <ScheduleVenueCard tournament={tournament} />
        <QuickActionsCard 
          tournamentId={tournamentId}
          router={router}
          onSettingsClick={onSettingsClick}
        />
      </div>
    </div>
  );
}

// Sub-components
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
  isText?: boolean;
}

function StatCard({ icon, iconBg, value, label, isText }: StatCardProps) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className={isText ? 'text-sm font-semibold capitalize' : 'text-2xl font-bold'}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleVenueCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          Schedule & Venue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow label="Start Date" value={new Date(tournament.startDate).toLocaleDateString()} />
        <InfoRow label="End Date" value={new Date(tournament.endDate).toLocaleDateString()} />
        <InfoRow 
          label="Venue" 
          value={
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {tournament.venue || 'TBD'}
            </span>
          } 
        />
        <InfoRow label="Location" value={tournament.country || 'N/A'} />
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface QuickActionsCardProps {
  tournamentId: string;
  router: ReturnType<typeof useRouter>;
  onSettingsClick: () => void;
}

function QuickActionsCard({ tournamentId, router, onSettingsClick }: QuickActionsCardProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="w-4 h-4 text-orange-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/teams`)}
        >
          <Users className="w-4 h-4" />
          Manage Teams
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={() => router.push(`/dashboard/tournaments/${tournamentId}/schedule`)}
        >
          <Calendar className="w-4 h-4" />
          Manage Schedule
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2"
          onClick={onSettingsClick}
        >
          <Settings className="w-4 h-4" />
          Edit Settings
        </Button>
      </CardContent>
    </Card>
  );
}
