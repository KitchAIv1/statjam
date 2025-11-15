"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { TournamentHero } from './TournamentHero';
import { TournamentPrimaryNav } from './TournamentPrimaryNav';
import { TournamentRightRail } from './TournamentRightRail';
import { TournamentSocialFooter } from '@/components/shared/TournamentSocialFooter';
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
  
  // ✅ FIX: Initialize phase based on tournament status
  const getInitialPhase = (): 'upcoming' | 'live' | 'finals' => {
    const status = data.tournament.status?.toLowerCase() || '';
    if (status === 'active' || status === 'live') return 'live';
    if (status === 'completed') return 'finals';
    return 'upcoming';
  };
  
  const [activePhase, setActivePhase] = useState<'upcoming' | 'live' | 'finals'>(getInitialPhase());
  const tabsListRef = useRef<HTMLDivElement>(null);

  const tabOptions = useMemo(() => TABS, []);

  // ✅ FIX: Handle phase change from hero section
  const handlePhaseChange = (phase: 'upcoming' | 'live' | 'finals') => {
    setActivePhase(phase);
    // If "Live" is clicked, switch to Live Games tab
    if (phase === 'live') {
      setActiveTab('live');
    }
    // If "Upcoming" is clicked, switch to Schedule tab
    else if (phase === 'upcoming') {
      setActiveTab('schedule');
    }
    // If "Finals" is clicked, switch to Standings tab
    else if (phase === 'finals') {
      setActiveTab('standings');
    }
  };

  // ✅ FIX: Sync phase when tab changes manually
  const handleTabChange = (tab: TournamentTab) => {
    setActiveTab(tab);
    // Update phase based on tab selection
    if (tab === 'live') {
      setActivePhase('live');
    } else if (tab === 'schedule') {
      setActivePhase('upcoming');
    } else if (tab === 'standings') {
      setActivePhase('finals');
    }
  };

  // ✅ FIX: Enable mouse drag scrolling for desktop testing (only on empty space, not tabs)
  useEffect(() => {
    const tabsList = tabsListRef.current;
    if (!tabsList) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let startTarget: EventTarget | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      // Only enable drag if clicking on the container itself, not on a tab button
      const target = e.target as HTMLElement;
      if (target.closest('[data-slot="tabs-trigger"]')) {
        // User clicked on a tab - let it handle the click normally
        return;
      }
      
      isDown = true;
      startTarget = e.target;
      tabsList.style.cursor = 'grabbing';
      startX = e.pageX - tabsList.offsetLeft;
      scrollLeft = tabsList.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      tabsList.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
      isDown = false;
      tabsList.style.cursor = 'grab';
      startTarget = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !startTarget) return;
      e.preventDefault();
      const x = e.pageX - tabsList.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      tabsList.scrollLeft = scrollLeft - walk;
    };

    tabsList.addEventListener('mousedown', handleMouseDown);
    tabsList.addEventListener('mouseleave', handleMouseLeave);
    tabsList.addEventListener('mouseup', handleMouseUp);
    tabsList.addEventListener('mousemove', handleMouseMove);

    return () => {
      tabsList.removeEventListener('mousedown', handleMouseDown);
      tabsList.removeEventListener('mouseleave', handleMouseLeave);
      tabsList.removeEventListener('mouseup', handleMouseUp);
      tabsList.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ✅ FIX: Auto-scroll active tab into view when tab changes
  useEffect(() => {
    const tabsList = tabsListRef.current;
    if (!tabsList) return;

    // Find the active tab trigger element
    const activeTrigger = tabsList.querySelector(`[data-slot="tabs-trigger"][data-state="active"]`) as HTMLElement;
    if (!activeTrigger) return;

    // Calculate scroll position to center the active tab
    const containerRect = tabsList.getBoundingClientRect();
    const triggerRect = activeTrigger.getBoundingClientRect();
    const scrollLeft = tabsList.scrollLeft;
    const triggerLeft = triggerRect.left - containerRect.left + scrollLeft;
    const triggerWidth = triggerRect.width;
    const containerWidth = containerRect.width;
    
    // Center the active tab in the viewport
    const targetScroll = triggerLeft - (containerWidth / 2) + (triggerWidth / 2);
    
    // Smooth scroll to the target position
    tabsList.scrollTo({
      left: Math.max(0, Math.min(targetScroll, tabsList.scrollWidth - containerWidth)),
      behavior: 'smooth'
    });
  }, [activeTab]);

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
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5 md:px-6 md:py-3">
          {/* Left: StatJam Logo */}
          <a href="/" className="flex shrink-0 items-center gap-1.5 transition-opacity hover:opacity-80 sm:gap-2">
            <h1 className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent sm:text-lg md:text-xl">
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
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <button 
              onClick={handleSignIn}
              className="hidden rounded-full border border-white/10 bg-transparent px-2.5 py-1 text-[10px] text-white/70 transition hover:border-white/30 hover:text-white sm:block sm:px-3 sm:py-1.5 sm:text-xs md:px-4 md:py-2 md:text-sm"
            >
              Log In
            </button>
            <button 
              onClick={handleStartTournament}
              className="rounded-full bg-[#FF3B30] px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-3 sm:py-1.5 sm:text-xs md:px-4 md:py-2 md:text-sm"
            >
              <span className="hidden sm:inline">Start Tournament</span>
              <span className="sm:hidden">Start</span>
            </button>
          </div>
        </div>
      </header>

      <TournamentHero 
        data={data} 
        activePhase={activePhase}
        onPhaseChange={handlePhaseChange}
      />
      <TournamentPrimaryNav activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-3 pb-8 pt-4 sm:gap-4 sm:px-4 sm:pb-12 sm:pt-6 md:gap-6 md:px-6 md:pb-16 md:pt-10 lg:flex-row">
        <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as TournamentTab)}>
            {/* Mobile: Horizontal scrollable tabs - Works with mouse drag on desktop too */}
            <div 
              ref={tabsListRef}
              className="mb-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing sm:mb-4 lg:hidden"
              style={{ 
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain'
              }}
            >
              <TabsList className="inline-flex w-max min-w-full gap-1.5 bg-transparent p-0 px-3 text-white sm:gap-2 sm:px-4 [&>*]:cursor-pointer [&>*]:select-none [&>*]:touch-none">
                {tabOptions.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="shrink-0 rounded-full border border-white/10 bg-[#121212] px-2.5 py-1.5 text-[10px] uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white data-[state=active]:border-[#FF3B30]/80 data-[state=active]:bg-[#FF3B30]/20 data-[state=active]:text-white sm:px-3 sm:py-2 sm:text-xs"
                  >
                    {labelForTab(tab)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0">
              <OverviewTab data={data} />
            </TabsContent>
            <TabsContent value="schedule" className="mt-0">
              <ScheduleTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="bracket" className="mt-0">
              <BracketTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="standings" className="mt-0">
              <StandingsTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="leaders" className="mt-0">
              <LeadersTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="teams" className="mt-0">
              <TeamsTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="players" className="mt-0">
              <PlayersTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="live" className="mt-0">
              <LiveGamesTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="media" className="mt-0">
              <MediaTab tournamentId={data.tournament.id} />
            </TabsContent>
            <TabsContent value="info" className="mt-0">
              <InfoTab data={data} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden w-full shrink-0 lg:block lg:w-[350px] xl:w-[380px]">
          <TournamentRightRail data={data} />
        </aside>
      </main>

      <TournamentSocialFooter organizerId={data.tournament.organizerId} />
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
