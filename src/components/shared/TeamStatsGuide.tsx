/**
 * TeamStatsGuide - Team stat abbreviation reference
 * Follows .cursorrules: <80 lines, UI only, single responsibility
 */
'use client';

import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { TEAM_SHOOTING_STATS, TEAM_PER_GAME_STATS, TEAM_TOTAL_STATS, StatTerm } from '@/lib/constants/basketballTerms';

export function TeamStatsGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Toggle Button - Orange branding */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-orange-100 hover:bg-orange-200 text-orange-700"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Stats Guide
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Expanded Guide */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-orange-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-orange-100">
            <h3 className="font-bold text-gray-900">📊 Team Stats Guide</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 max-h-[320px] overflow-y-auto space-y-4 stats-guide-scroll">
            <StatSection title="Shooting Efficiency" stats={TEAM_SHOOTING_STATS} />
            <StatSection title="Per Game Averages" stats={TEAM_PER_GAME_STATS} />
            <StatSection title="Season Totals" stats={TEAM_TOTAL_STATS} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatSection({ title, stats }: { title: string; stats: StatTerm[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide mb-2 text-orange-600">{title}</h4>
      <div className="space-y-1.5">
        {stats.map((stat) => (
          <div key={stat.abbr} className="flex items-start gap-2">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 bg-orange-100 text-gray-900">
              {stat.abbr}
            </span>
            <span className="text-sm text-gray-700">{stat.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

