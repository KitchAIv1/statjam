"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TournamentTab } from './TournamentPageShell';
import { logger } from '@/lib/utils/logger';

interface TournamentPrimaryNavProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
}

const PRIMARY_TABS: Array<{ tab: TournamentTab; label: string }> = [
  { tab: 'overview', label: 'Overview' },
  { tab: 'schedule', label: 'Schedule' },
  { tab: 'bracket', label: 'Bracket' },
  { tab: 'standings', label: 'Standings' },
  { tab: 'leaders', label: 'Leaders' },
  { tab: 'teams', label: 'Teams' },
  { tab: 'players', label: 'Players' },
  { tab: 'live', label: 'Live Games' },
  { tab: 'media', label: 'Media' },
  { tab: 'info', label: 'Info' },
];

const SECONDARY_MENU = ['Rules', 'Sponsors', 'Tickets', 'Merch'] as const;

export function TournamentPrimaryNav({ activeTab, onTabChange }: TournamentPrimaryNavProps) {
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  return (
    <nav className="sticky top-[52px] z-30 hidden border-b border-white/10 bg-[#121212]/95 backdrop-blur-lg sm:top-[60px] lg:block">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-0.5 overflow-x-auto sm:gap-1 scrollbar-hide [&>*]:cursor-pointer [&>*]:select-none">
          {PRIMARY_TABS.map(({ tab, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={(e) => {
                  // ✅ FIX: Ensure tab click works - prevent any event blocking
                  e.stopPropagation();
                  logger.debug('🔍 [TournamentPrimaryNav] Tab clicked:', tab, label);
                  onTabChange(tab);
                }}
                className={`relative shrink-0 px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3B30]/40 sm:px-4 sm:text-sm ${
                  isActive
                    ? 'text-white'
                    : 'text-[#B3B3B3] hover:text-white'
                }`}
                type="button"
              >
                {label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#FF3B30]" />
                )}
              </button>
            );
          })}
        </div>
        <div className="relative hidden items-center gap-2 xl:flex">
          <button
            onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs uppercase tracking-wide text-[#B3B3B3] transition hover:text-white"
          >
            More
            <ChevronDown className={`h-3 w-3 transition-transform ${showSecondaryMenu ? 'rotate-180' : ''}`} />
          </button>
          {showSecondaryMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-[#121212] p-2 shadow-xl">
              {SECONDARY_MENU.map((item) => (
                <button
                  key={item}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-[#B3B3B3] transition hover:bg-white/5 hover:text-white"
                  onClick={() => setShowSecondaryMenu(false)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
