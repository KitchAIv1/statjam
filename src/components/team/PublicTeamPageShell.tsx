'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { TeamProfileHero } from './TeamProfileHero';
import { TeamPageMatchupCarousel } from './TeamPageMatchupCarousel';
import { TeamRosterGrid } from './TeamRosterGrid';
import { usePublicTeamPage } from '@/hooks/usePublicTeamPage';
import { useTeamMatchups } from '@/hooks/useTeamMatchups';

export interface PublicTeamPageShellProps {
  tournamentId: string;
  teamId: string;
  tournamentSlug: string;
}

export function PublicTeamPageShell({
  tournamentId,
  teamId,
  tournamentSlug,
}: PublicTeamPageShellProps) {
  const { team, loading: teamLoading, error: teamError } = usePublicTeamPage(teamId, tournamentId);
  const { matchups, loading: matchupsLoading } = useTeamMatchups(teamId, tournamentId, {
    status: 'scheduled',
    limit: 20,
  });

  const backHref = `/t/${tournamentSlug}`;

  if (teamError || (!teamLoading && !team)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationHeader minimal />
        <main className="container mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Team not found</p>
          <Link
            href={backHref}
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#FF3B30] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Tournament
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader minimal />

      <main className="pb-16 pt-20">
        <TeamProfileHero team={team} loading={teamLoading} />

        <div className="mt-4 px-4">
          <TeamPageMatchupCarousel
            matchups={matchups}
            loading={matchupsLoading}
            title="Upcoming Games"
            subtitle="Click a game to view"
            emptyMessage="No upcoming games scheduled"
            titlePosition="below"
          />
        </div>

        <div className="container mx-auto max-w-5xl space-y-6 px-4 mt-6">
          <TeamRosterGrid
            players={team?.players ?? []}
            teamPrimaryColor={team?.primaryColor}
          />
        </div>
      </main>
    </div>
  );
}
