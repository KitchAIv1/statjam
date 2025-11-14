"use client";

import { useEffect, useState } from 'react';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { PlayerLeader } from '@/lib/services/tournamentLeadersService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PlayerProfileModal } from '@/components/player/PlayerProfileModal';
import { usePlayerProfileModal } from '@/hooks/usePlayerProfileModal';
import { useTournamentLeaders } from '@/hooks/useTournamentLeaders';

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

  // ✅ OPTIMIZED: Use custom hook with caching
  const { leaders: allLeaders, loading: leadersLoading } = useTournamentLeaders(data.tournament.id, 'points', 1);
  
  // Update state when leaders change
  useEffect(() => {
    setTopScorers(allLeaders.slice(0, 3)); // Top 3 scorers
    setLoadingLeaders(leadersLoading);
  }, [allLeaders, leadersLoading]);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Hero Summary Cards */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.key} className="rounded-xl border border-white/10 bg-[#121212] p-3 sm:rounded-2xl sm:p-4 md:p-6">
            <div className="text-[10px] uppercase tracking-wide text-[#B3B3B3] sm:text-xs md:text-sm">{card.label}</div>
            <div className="mt-1 text-xl font-bold text-white sm:mt-2 sm:text-2xl md:text-3xl">
              {data.summary[card.key]}
            </div>
          </Card>
        ))}
      </div>

      {/* Leaderboard Highlights */}
      <Card className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
        <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Leaderboard Highlights</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Top performers updated every possession</p>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-full border-white/10 bg-[#121212] text-[10px] text-white/70 hover:border-white/30 hover:text-white sm:w-auto sm:text-xs md:text-sm"
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
          <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5 sm:h-20 sm:rounded-xl" />
            ))}
          </div>
        ) : topScorers.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-center text-[10px] text-[#B3B3B3] sm:rounded-xl sm:p-6 sm:text-xs md:text-sm">
            No player stats available yet. Leaders will appear as games are tracked.
          </div>
        ) : (
          <div className="grid gap-2 sm:gap-3 md:gap-4 sm:grid-cols-2 md:grid-cols-3">
            {topScorers.map((leader, index) => {
              const initials = getInitials(leader.playerName);
              return (
                <div 
                  key={leader.playerId}
                  onClick={() => openModal(leader.playerId)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 transition hover:border-white/20 hover:bg-black/50 sm:gap-3 sm:rounded-xl sm:px-3 sm:py-2.5 md:gap-4 md:px-4 md:py-3"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/10 sm:h-10 sm:w-10 md:h-14 md:w-14">
                    {leader.profilePhotoUrl ? (
                      <AvatarImage src={leader.profilePhotoUrl} alt={leader.playerName} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/10 text-white">
                      {initials || <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-white truncate sm:text-xs md:text-sm">{leader.playerName}</div>
                    <div className="text-[9px] text-[#B3B3B3] truncate sm:text-[10px] md:text-xs">{leader.teamName}</div>
                    <div className="text-[9px] font-semibold text-[#FF3B30] mt-0.5 sm:text-[10px] sm:mt-1 md:text-xs">
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
      <Card className="space-y-3 rounded-xl border border-white/10 bg-[#121212] p-3 sm:space-y-4 sm:rounded-2xl sm:p-4 md:space-y-6 md:p-6">
        <header className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg md:text-xl">Bracket Preview</h2>
            <p className="text-[10px] text-[#B3B3B3] sm:text-xs md:text-sm">Interactive bracket launches soon</p>
          </div>
          <Button className="w-full rounded-full bg-[#FF3B30] px-3 py-1.5 text-[10px] uppercase tracking-wide text-white hover:brightness-110 sm:w-auto sm:px-4 sm:text-xs">
            Open Bracket
          </Button>
        </header>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-6">
          <MiniBracket />
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/40 p-3 text-[10px] text-[#B3B3B3] sm:space-y-3 sm:rounded-xl sm:p-4 sm:text-xs md:p-5 md:text-sm">
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
      <div className="grid gap-2 sm:gap-3 md:gap-4 md:grid-cols-2">
        <Card className="rounded-xl border border-[#FF3B30]/30 bg-[#FF3B30]/10 p-3 text-white sm:rounded-2xl sm:p-4 md:p-6">
          <h3 className="text-sm font-semibold sm:text-base md:text-lg">Watch Live Now</h3>
          <p className="mt-1.5 text-[10px] text-white/70 sm:mt-2 sm:text-xs md:text-sm">Catch all live games with real-time play-by-play and stat leaderboards.</p>
          <Button className="mt-2 w-full rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-black hover:bg-white/90 sm:mt-3 sm:w-auto sm:px-4 sm:py-2 sm:text-xs md:text-sm">
            Launch Live Center
          </Button>
        </Card>
        <Card className="rounded-xl border border-white/10 bg-[#121212] p-3 text-white sm:rounded-2xl sm:p-4 md:p-6">
          <h3 className="text-sm font-semibold sm:text-base md:text-lg">Today&apos;s Schedule</h3>
          <p className="mt-1.5 text-[10px] text-[#B3B3B3] sm:mt-2 sm:text-xs md:text-sm">See court assignments, streaming links, and officials in one place.</p>
          <Button variant="outline" className="mt-2 w-full rounded-full border-white/20 bg-[#121212] text-[10px] text-white/70 hover:border-white/40 hover:text-white sm:mt-3 sm:w-auto sm:px-4 sm:py-2 sm:text-xs md:text-sm">
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
