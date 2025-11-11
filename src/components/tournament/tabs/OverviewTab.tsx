"use client";

import { useEffect, useState } from 'react';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { TournamentLeadersService, PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';

interface OverviewTabProps {
  data: TournamentPageData;
}

const SUMMARY_CARDS = [
  { label: 'Teams', key: 'teamCount' as const },
  { label: 'Games', key: 'gameCount' as const },
  { label: 'Venues', key: 'venueCount' as const },
  { label: 'Divisions', key: 'divisionCount' as const },
];

export function OverviewTab({ data }: OverviewTabProps) {
  const router = useRouter();
  const [topScorers, setTopScorers] = useState<PlayerLeader[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const { isOpen, playerId, openModal, closeModal } = usePlayerProfileModal();

  useEffect(() => {
    let mounted = true;

    const loadTopScorers = async () => {
      try {
        const leaders = await TournamentLeadersService.getTournamentPlayerLeaders(
          data.tournament.id,
          'points',
          1
        );
        if (mounted) {
          setTopScorers(leaders.slice(0, 3)); // Top 3 scorers
        }
      } catch (error) {
        console.error('Failed to load top scorers:', error);
      } finally {
        if (mounted) {
          setLoadingLeaders(false);
        }
      }
    };

    loadTopScorers();

    return () => {
      mounted = false;
    };
  }, [data.tournament.id]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Summary Cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.key} className="rounded-2xl border border-white/10 bg-[#121212] p-4 sm:p-6">
            <div className="text-xs uppercase tracking-wide text-[#B3B3B3] sm:text-sm">{card.label}</div>
            <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {data.summary[card.key]}
            </div>
          </Card>
        ))}
      </div>

      {/* Leaderboard Highlights */}
      <Card className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-4 sm:space-y-6 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Leaderboard Highlights</h2>
            <p className="text-xs text-[#B3B3B3] sm:text-sm">Top performers updated every possession</p>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-full border-white/10 bg-[#121212] text-xs text-white/70 hover:border-white/30 hover:text-white sm:w-auto sm:text-sm"
            onClick={() => {
              const leadersTab = document.querySelector('[value="leaders"]');
              if (leadersTab) {
                (leadersTab as HTMLElement).click();
              }
            }}
          >
            View Full Leaders
          </Button>
        </header>
        {loadingLeaders ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : topScorers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center text-[#B3B3B3]">
            No player stats available yet. Leaders will appear as games are tracked.
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            {topScorers.map((leader, index) => {
              const initials = getInitials(leader.playerName);
              return (
                <div 
                  key={leader.playerId}
                  onClick={() => openModal(leader.playerId)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 transition hover:border-white/20 hover:bg-black/50 sm:gap-4 sm:px-4 sm:py-3"
                >
                  <Avatar className="h-10 w-10 border-2 border-white/10 sm:h-14 sm:w-14">
                    {leader.profilePhotoUrl ? (
                      <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                      {initials || <User className="h-5 w-5 sm:h-6 sm:w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate sm:text-sm">{leader.playerName}</div>
                    <div className="text-[10px] text-[#B3B3B3] truncate sm:text-xs">{leader.teamName}</div>
                    <div className="text-[10px] font-semibold text-[#FF3B30] mt-0.5 sm:text-xs sm:mt-1">
                      {leader.pointsPerGame.toFixed(1)} PPG
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Bracket Preview */}
      <Card className="space-y-4 rounded-2xl border border-white/10 bg-[#121212] p-4 sm:space-y-6 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Bracket Preview</h2>
            <p className="text-xs text-[#B3B3B3] sm:text-sm">Interactive bracket launches soon</p>
          </div>
          <Button className="w-full rounded-full bg-[#FF3B30] px-4 text-xs uppercase tracking-wide text-white hover:brightness-110 sm:w-auto">
            Open Bracket
          </Button>
        </header>
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <MiniBracket />
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-[#B3B3B3] sm:space-y-4 sm:p-5 sm:text-sm">
            <p>
              Pool standings update automatically as scores finalize. Bracket seeds lock when pool games end.
            </p>
            <p>
              Organizers can configure consolation rounds, double elimination, and placement games from the dashboard.
            </p>
          </div>
        </div>
      </Card>

      {/* CTA Cards */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border border-[#FF3B30]/30 bg-[#FF3B30]/10 p-4 text-white sm:p-6">
          <h3 className="text-base font-semibold sm:text-lg">Watch Live Now</h3>
          <p className="mt-2 text-xs text-white/70 sm:text-sm">Catch all live games with real-time play-by-play and stat leaderboards.</p>
          <Button className="mt-3 w-full rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 sm:mt-4 sm:w-auto sm:text-sm">
            Launch Live Center
          </Button>
        </Card>
        <Card className="rounded-2xl border border-white/10 bg-[#121212] p-4 text-white sm:p-6">
          <h3 className="text-base font-semibold sm:text-lg">Today&apos;s Schedule</h3>
          <p className="mt-2 text-xs text-[#B3B3B3] sm:text-sm">See court assignments, streaming links, and officials in one place.</p>
          <Button variant="outline" className="mt-3 w-full rounded-full border-white/20 bg-[#121212] text-xs text-white/70 hover:border-white/40 hover:text-white sm:mt-4 sm:w-auto sm:text-sm">
            View Schedule
          </Button>
        </Card>
      </div>

      {/* Player Profile Modal */}
      {playerId && (
        <PlayerProfileModal isOpen={isOpen} onClose={closeModal} playerId={playerId} />
      )}
    </div>
  );
}

function MiniBracket() {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs text-white/70 sm:grid-cols-3 sm:gap-4 sm:text-sm">
      <div className="space-y-3 sm:space-y-4">
        <BracketCard label="Quarterfinals" matchups={[['Hurricanes', 'Wolves'], ['Chargers', 'Spartans']]} />
      </div>
      <div className="flex items-center sm:block">
        <BracketCard label="Semifinals" matchups={[['Winner QF1', 'Winner QF2']]} />
      </div>
      <div className="flex items-center sm:block">
        <BracketCard label="Final" matchups={[['Semifinal Winner', 'Semifinal Winner']]} />
      </div>
    </div>
  );
}

function BracketCard({ label, matchups }: { label: string; matchups: [string, string][] }) {
  return (
    <div className="w-full space-y-2 rounded-lg border border-white/10 bg-black/40 p-3 sm:rounded-xl sm:p-4">
      <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] sm:text-xs">{label}</div>
      <div className="space-y-2 sm:space-y-3">
        {matchups.map(([home, away], idx) => (
          <div key={`${home}-${away}-${idx}`} className="space-y-1">
            <div className="rounded-md border border-white/10 bg-[#121212] px-2 py-1.5 text-xs text-white sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">{home}</div>
            <div className="rounded-md border border-white/10 bg-[#121212] px-2 py-1.5 text-xs text-white sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm">{away}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
