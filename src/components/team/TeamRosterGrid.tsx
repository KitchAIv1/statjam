'use client';

import { PlayerRosterCard } from './PlayerRosterCard';
import type { PublicTeamPlayer } from '@/lib/services/publicTeamService';

export interface TeamRosterGridProps {
  players: PublicTeamPlayer[];
  teamPrimaryColor?: string;
}

export function TeamRosterGrid({ players, teamPrimaryColor }: TeamRosterGridProps) {
  if (!players?.length) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No roster available
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Roster</h2>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((rosterPlayer) => (
          <PlayerRosterCard
            key={rosterPlayer.id}
            player={rosterPlayer}
            teamPrimaryColor={teamPrimaryColor}
            href={`/player/${rosterPlayer.id}`}
          />
        ))}
      </div>
    </section>
  );
}
