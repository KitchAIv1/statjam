"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentPageData } from '@/lib/services/tournamentPublicService';
import { useTournamentTheme } from '@/contexts/TournamentThemeContext';
import { getTournamentThemeClass } from '@/lib/utils/tournamentThemeClasses';
import { OverviewTab } from './tabs/OverviewTab';
import { ScheduleTab } from './tabs/ScheduleTab';
import { BracketTab } from './tabs/BracketTab';
import { StandingsTab } from './tabs/StandingsTab';
import { LeadersTab } from './tabs/LeadersTab';
import { TeamsTab } from './tabs/TeamsTab';
import { PlayersTab } from './tabs/PlayersTab';
import { LiveTabContent } from './tabs/LiveTabContent';
import { MediaTab } from './tabs/MediaTab';
import { InfoTab } from './tabs/InfoTab';
import type { TournamentTab } from './TournamentPageShell';

const TABS: readonly TournamentTab[] = [
  'overview', 'schedule', 'bracket', 'standings', 'leaders', 'teams', 'players', 'live', 'media', 'info',
];

function labelForTab(tab: TournamentTab): string {
  const labels: Record<TournamentTab, string> = {
    overview: 'Overview', schedule: 'Schedule', bracket: 'Bracket', standings: 'Standings',
    leaders: 'Leaders', teams: 'Teams', players: 'Players', live: 'Live Games', media: 'Media', info: 'Info',
  };
  return labels[tab] ?? tab;
}

interface TournamentTabsSectionProps {
  data: TournamentPageData;
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  tabOptions: readonly TournamentTab[];
  tabsListRef: React.RefObject<HTMLDivElement | null>;
  onTabsMounted?: () => void;
}

/**
 * Client-only tabs section to avoid Radix useId hydration mismatch
 * (React 19+ / Next.js 15.5+ generate different IDs on server vs client).
 * Renders a static placeholder until mount, then the real Radix Tabs.
 */
export function TournamentTabsSection({
  data,
  activeTab,
  onTabChange,
  tabOptions,
  tabsListRef,
  onTabsMounted,
}: TournamentTabsSectionProps) {
  const { theme } = useTournamentTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    onTabsMounted?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- onTabsMounted is stable, called once on mount

  const tabBarPlaceholder = (
    <div
      ref={tabsListRef}
      className={`mb-3 overflow-x-auto scrollbar-hide sm:mb-4 lg:hidden`}
      style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
    >
      <div
        className={`inline-flex w-max min-w-full gap-1.5 p-0 px-3 sm:gap-2 sm:px-4 ${getTournamentThemeClass('pageText', theme)}`}
        role="tablist"
      >
        {tabOptions.map((tab) => (
          <span
            key={tab}
            className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-wide sm:px-3 sm:py-2 sm:text-xs ${getTournamentThemeClass('tabTriggerBg', theme)} ${getTournamentThemeClass('tabTriggerText', theme)} ${tab === 'overview' ? getTournamentThemeClass('tabTriggerActive', theme) : ''}`}
          >
            {labelForTab(tab)}
          </span>
        ))}
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex flex-col gap-2">
        {tabBarPlaceholder}
        <div className="flex-1 outline-none mt-0">
          <OverviewTab data={data} onNavigateToTab={onTabChange} />
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TournamentTab)}>
      <div
        ref={tabsListRef}
        className="mb-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing sm:mb-4 lg:hidden"
        style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}
      >
        <TabsList className={`inline-flex w-max min-w-full gap-1.5 bg-transparent p-0 px-3 sm:gap-2 sm:px-4 [&>*]:cursor-pointer [&>*]:select-none [&>*]:touch-none ${getTournamentThemeClass('pageText', theme)}`}>
          {tabOptions.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] uppercase tracking-wide transition sm:px-3 sm:py-2 sm:text-xs ${getTournamentThemeClass('tabTriggerBg', theme)} ${getTournamentThemeClass('tabTriggerText', theme)} ${getTournamentThemeClass('tabTriggerActive', theme)}`}
            >
              {labelForTab(tab)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        <OverviewTab data={data} onNavigateToTab={onTabChange} />
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
        <LiveTabContent
          tournamentId={data.tournament.id}
          isStreaming={data.tournament.isStreaming}
          liveStreamUrl={data.tournament.liveStreamUrl}
          streamPlatform={data.tournament.streamPlatform}
        />
      </TabsContent>
      <TabsContent value="media" className="mt-0">
        <MediaTab tournamentId={data.tournament.id} />
      </TabsContent>
      <TabsContent value="info" className="mt-0">
        <InfoTab data={data} />
      </TabsContent>
    </Tabs>
  );
}
