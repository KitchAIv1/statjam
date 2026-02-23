"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { TournamentHero } from './TournamentHero';
import { TournamentPrimaryNav } from './TournamentPrimaryNav';
import { TournamentRightRail } from './TournamentRightRail';
import { TournamentSocialFooter } from '@/components/shared/TournamentSocialFooter';
import { TournamentTabsSection } from './TournamentTabsSection';
import { TournamentLeadersService } from '@/lib/services/tournamentLeadersService';
import { TeamService } from '@/lib/services/tournamentService';
import { GameService } from '@/lib/services/gameService';
import { TournamentStandingsService } from '@/lib/services/tournamentStandingsService';
import { cache, CacheKeys, CacheTTL } from '@/lib/utils/cache';
import { TournamentThemeProvider, useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';
import { TournamentThemeToggle } from './TournamentThemeToggle';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';

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
  const [tabsMounted, setTabsMounted] = useState(false);

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
  }, [tabsMounted]);

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
  }, [activeTab, tabsMounted]);

  // ✅ Prefetch Leaders data in background for instant tab load
  // Prefetch ALL game phases AND categories in parallel so ALL filter switches are instant
  useEffect(() => {
    const tournamentId = data.tournament.id;
    if (!tournamentId) return;

    const phases = ['all', 'regular', 'playoffs', 'finals'] as const;
    const categories = ['points', 'rebounds', 'assists', 'steals', 'blocks'] as const;
    
    // Prefetch all combinations (phases × categories = 20 requests, all parallel)
    phases.forEach(phase => {
      categories.forEach(category => {
        const cacheKey = `${CacheKeys.tournamentLeaders(tournamentId, category, 1)}_${phase}`;
        if (cache.get(cacheKey)) return; // Skip if already cached

        // Prefetch in background (silent, non-blocking)
        TournamentLeadersService.getTournamentPlayerLeaders(tournamentId, category, 1, phase)
          .then(leaders => {
            cache.set(cacheKey, leaders, CacheTTL.tournamentLeaders);
          })
          .catch(() => {}); // Silently ignore errors
      });
    });
  }, [data.tournament.id]);

  // ✅ Prefetch Teams/Players data for instant Players tab load
  useEffect(() => {
    const tournamentId = data.tournament.id;
    if (!tournamentId) return;

    const cacheKey = CacheKeys.tournamentTeams(tournamentId);
    if (cache.get(cacheKey)) return; // Skip if already cached

    // Prefetch teams with players in background
    TeamService.getTeamsByTournament(tournamentId)
      .then(teams => {
        cache.set(cacheKey, teams, CacheTTL.tournamentTeams);
      })
      .catch(() => {}); // Silently ignore errors
  }, [data.tournament.id]);

  // ✅ Prefetch Schedule data for instant Schedule tab load
  useEffect(() => {
    const tournamentId = data.tournament.id;
    if (!tournamentId) return;

    const cacheKey = CacheKeys.tournamentSchedule(tournamentId);
    if (cache.get(cacheKey)) return; // Skip if already cached

    // Prefetch games and enrich with team info (matches useScheduleData logic)
    (async () => {
      try {
        const games = await GameService.getGamesByTournament(tournamentId);
        if (games.length === 0) return;

        // Collect unique team IDs and batch fetch team info
        const teamIds = new Set<string>();
        games.forEach(game => {
          if (game.team_a_id) teamIds.add(game.team_a_id);
          if (game.team_b_id) teamIds.add(game.team_b_id);
        });
        const teamInfoMap = await TeamService.getBatchTeamInfo(Array.from(teamIds));

        // Enrich games with team info
        const enrichedGames = games.map(game => ({
          ...game,
          teamALogo: game.team_a_id ? teamInfoMap.get(game.team_a_id)?.logo : undefined,
          teamBLogo: game.team_b_id ? teamInfoMap.get(game.team_b_id)?.logo : undefined,
          teamAName: game.team_a_id ? teamInfoMap.get(game.team_a_id)?.name : undefined,
          teamBName: game.team_b_id ? teamInfoMap.get(game.team_b_id)?.name : undefined,
        }));

        cache.set(cacheKey, enrichedGames, CacheTTL.tournamentSchedule);
      } catch {} // Silently ignore errors
    })();
  }, [data.tournament.id]);

  // ✅ Prefetch Standings data for instant Standings tab load
  useEffect(() => {
    const tournamentId = data.tournament.id;
    if (!tournamentId) return;

    const cacheKey = CacheKeys.tournamentStandings(tournamentId);
    if (cache.get(cacheKey)) return; // Skip if already cached

    // Prefetch standings in background
    TournamentStandingsService.getTournamentStandings(tournamentId)
      .then(standings => {
        cache.set(cacheKey, standings, CacheTTL.tournamentStandings);
      })
      .catch(() => {}); // Silently ignore errors
  }, [data.tournament.id]);

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
    <TournamentThemeProvider>
      <TournamentPageShellContent
        data={data}
        activeTab={activeTab}
        activePhase={activePhase}
        onPhaseChange={handlePhaseChange}
        onTabChange={handleTabChange}
        onSignIn={handleSignIn}
        onStartTournament={handleStartTournament}
        tabOptions={tabOptions}
        tabsListRef={tabsListRef}
        onTabsMounted={() => setTabsMounted(true)}
      />
    </TournamentThemeProvider>
  );
}

interface TournamentPageShellContentProps {
  data: TournamentPageData;
  activeTab: TournamentTab;
  activePhase: 'upcoming' | 'live' | 'finals';
  onPhaseChange: (phase: 'upcoming' | 'live' | 'finals') => void;
  onTabChange: (tab: TournamentTab) => void;
  onSignIn: () => void;
  onStartTournament: () => void;
  tabOptions: readonly TournamentTab[];
  tabsListRef: React.RefObject<HTMLDivElement | null>;
  onTabsMounted: () => void;
}

function TournamentPageShellContent({
  data,
  activeTab,
  activePhase,
  onPhaseChange,
  onTabChange,
  onSignIn,
  onStartTournament,
  tabOptions,
  tabsListRef,
  onTabsMounted,
}: TournamentPageShellContentProps) {
  const { theme } = useTournamentTheme();

  return (
    <div className={`min-h-screen ${getTournamentThemeClass('pageBg', theme)} ${getTournamentThemeClass('pageText', theme)}`}>
      <header className={`sticky top-0 z-40 flex min-h-[52px] items-center border-b sm:min-h-[60px] md:min-h-[64px] ${getTournamentThemeClass('headerBorder', theme)} ${getTournamentThemeClass('headerBg', theme)}`}>
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5 md:px-6 md:py-3">
          {/* Left: StatJam Logo */}
          <a href="/" className="flex shrink-0 items-center gap-1.5 transition-opacity hover:opacity-80 sm:gap-2">
            <h1 className="text-base font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent sm:text-lg md:text-xl">
              StatJam
            </h1>
          </a>

          {/* Center: Global Search Bar */}
          <div className="hidden flex-1 max-w-md md:block">
            <GlobalSearchBar />
          </div>

          {/* Right: Theme Toggle + Log In + Start Tournament */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <TournamentThemeToggle />
            <button
              onClick={onSignIn}
              className={`hidden rounded-full border px-2.5 py-1 text-[10px] transition sm:block sm:px-3 sm:py-1.5 sm:text-xs md:px-4 md:py-2 md:text-sm ${getTournamentThemeClass('btnOutlineBorder', theme)} ${getTournamentThemeClass('btnOutlineText', theme)}`}
            >
              Log In
            </button>
            <button
              onClick={onStartTournament}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-lg shadow-[#FF3B30]/30 transition hover:brightness-110 sm:px-3 sm:py-1.5 sm:text-xs md:px-4 md:py-2 md:text-sm ${getTournamentThemeClass('btnPrimary', theme)}`}
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
        onPhaseChange={onPhaseChange}
      />
      <TournamentPrimaryNav activeTab={activeTab} onTabChange={onTabChange} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-3 pb-8 pt-4 sm:gap-4 sm:px-4 sm:pb-12 sm:pt-6 md:gap-6 md:px-6 md:pb-16 md:pt-10 lg:flex-row">
        <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6">
          <TournamentTabsSection
            data={data}
            activeTab={activeTab}
            onTabChange={onTabChange}
            tabOptions={tabOptions}
            tabsListRef={tabsListRef}
            onTabsMounted={onTabsMounted}
          />
        </div>

        <aside className="hidden w-full shrink-0 lg:block lg:w-[350px] xl:w-[380px]">
          <TournamentRightRail data={data} activeTab={activeTab} />
        </aside>
      </main>

      <TournamentSocialFooter organizerId={data.tournament.organizerId} />
    </div>
  );
}

