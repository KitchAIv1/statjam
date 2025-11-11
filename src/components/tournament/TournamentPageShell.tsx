"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { TournamentHero } from './TournamentHero';
import { TournamentPrimaryNav } from './TournamentPrimaryNav';
import { TournamentRightRail } from './TournamentRightRail';
import { OverviewTab } from './tabs/OverviewTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { BracketTab } from './tabs/BracketTab';
import { StandingsTab } from './tabs/StandingsTab';
import { LeadersTab } from './tabs/LeadersTab';
import { TeamsTab } from './tabs/TeamsTab';
import { PlayersTab } from './tabs/PlayersTab';
import { LiveGamesTab } from './tabs/LiveGamesTab';
import { MediaTab } from './tabs/MediaTab';
import { InfoTab } from './tabs/InfoTab';

const TABS = [
  'overview',
  'schedule',
  'bracket',
  'standings',
  'leaders',
  'teams',
  'players',
  'live',
  'media',
  'info',
] as const;

export type TournamentTab = (typeof TABS)[number];

interface TournamentPageShellProps {
  data: TournamentPageData;
}

export function TournamentPageShell({ data }: TournamentPageShellProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TournamentTab>('overview');

  const tabOptions = useMemo(() => TABS, []);

  const handleSignIn = () => {
    router.push('/auth?mode=signin');
  };

  const handleStartTournament = () => {
    // If user is logged in as organizer, go to create tournament page
    if (user && user.role === 'organizer') {
      router.push('/dashboard/create-tournament');
    } else {
      // Otherwise, redirect to signup (which will allow them to sign up as organizer)
      router.push('/auth?mode=signup');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          {/* Left: StatJam Logo */}
          <a href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
            <h1 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent sm:text-xl">
              StatJam
            </h1>
          </a>

          {/* Center: Global Search Bar */}
          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <input
                type="search"
                placeholder="Search Teams, Tournaments, Players..."
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 pl-10 text-sm text-white placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:outline-none focus:ring-1 focus:ring-[#FF3B30]/30"
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right: Log In + Start Tournament */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button 
              onClick={handleSignIn}
              className="hidden rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30 hover:text-white sm:block sm:px-4 sm:py-2 sm:text-sm"
            >
              Log In
            </button>
            <button 
              onClick={handleStartTournament}
              className="rounded-full bg-[#FF3B30] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-4 sm:py-2 sm:text-sm"
            >
              Start Tournament
            </button>
          </div>
        </div>
      </header>

      <TournamentHero data={data} />
      <TournamentPrimaryNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-12 pt-6 sm:gap-6 sm:px-6 sm:pb-16 sm:pt-10 lg:flex-row">
        <div className="flex-1 space-y-4 sm:space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TournamentTab)}>
            <TabsList className="grid w-full grid-cols-2 gap-1.5 bg-transparent p-0 text-white sm:grid-cols-3 sm:gap-2 lg:hidden">
              {tabOptions.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full border border-white/10 bg-[#121212] px-2 py-1.5 text-[10px] uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white data-[state=active]:border-[#FF3B30]/80 data-[state=active]:bg-[#FF3B30]/20 data-[state=active]:text-white sm:px-4 sm:py-2 sm:text-xs"
                >
                  {labelForTab(tab)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab data={data} />
            </TabsContent>
            <TabsContent value="schedule">
              <ScheduleTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="bracket">
              <BracketTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="standings">
              <StandingsTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="leaders">
              <LeadersTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="teams">
              <TeamsTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="players">
              <PlayersTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="live">
              <LiveGamesTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="media">
              <MediaTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="info">
              <InfoTab data={data} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden w-full shrink-0 lg:block lg:w-[350px] xl:w-[380px]">
          <TournamentRightRail data={data} />
        </aside>
      </main>

      <footer className="border-t border-white/10 bg-[#121212] py-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 sm:gap-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-white/40 sm:text-sm">Organizer</div>
            <div className="mt-1 text-base font-semibold text-white/90 sm:text-lg">Elite Sports Federation</div>
            <div className="text-xs text-[#B3B3B3] sm:text-sm">15 prior tournaments • Verified</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#B3B3B3] sm:gap-3 sm:text-sm">
            <a href="#" className="transition hover:text-white">Privacy</a>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <a href="#" className="transition hover:text-white">Terms</a>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <a href="#" className="transition hover:text-white">Contact</a>
            <Separator orientation="vertical" className="h-4 bg-white/20" />
            <span>© {new Date().getFullYear()} StatJam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function labelForTab(tab: TournamentTab): string {
  switch (tab) {
    case 'overview':
      return 'Overview';
    case 'schedule':
      return 'Schedule';
    case 'bracket':
      return 'Bracket';
    case 'standings':
      return 'Standings';
    case 'leaders':
      return 'Leaders';
    case 'teams':
      return 'Teams';
    case 'players':
      return 'Players';
    case 'live':
      return 'Live Games';
    case 'media':
      return 'Media';
    case 'info':
      return 'Info';
    default:
      return tab;
  }
}
