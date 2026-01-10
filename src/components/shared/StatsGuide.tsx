/**
 * StatsGuide - Basketball stat abbreviation reference for coaches
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */
'use client';

import React, { useState } from 'react';
import { HelpCircle, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { BASIC_STATS, SHOOTING_STATS, ADVANCED_STATS, StatTerm } from '@/lib/constants/basketballTerms';

interface StatsGuideProps { isDark?: boolean; }

export function StatsGuide({ isDark = true }: StatsGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  const bgClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedClass = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          isDark 
            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
            : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Stats Guide
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Expanded Guide */}
      {isOpen && (
        <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl border shadow-xl z-50 ${bgClass}`}>
          <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-slate-700' : 'border-orange-100'}`}>
            <h3 className={`font-bold ${textClass}`}>📊 Stats Guide</h3>
            <button onClick={() => setIsOpen(false)} className={`${mutedClass} hover:opacity-70`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative overflow-hidden rounded-b-xl">
            <div className="p-3 pr-1 max-h-[350px] overflow-y-scroll space-y-4 stats-guide-scroll">
              <StatSection title="Basic Stats" stats={BASIC_STATS} isDark={isDark} />
              <StatSection title="Shooting (Made/Attempted)" stats={SHOOTING_STATS} isDark={isDark} />
              <StatSection title="Advanced" stats={ADVANCED_STATS} isDark={isDark} showExamples />
              {/* Bottom padding for fade */}
              <div className="h-4" />
            </div>
            {/* Scroll fade indicator */}
            <div className={`absolute bottom-0 left-0 right-0 h-8 pointer-events-none ${
              isDark ? 'bg-gradient-to-t from-slate-800 to-transparent' : 'bg-gradient-to-t from-white to-transparent'
            }`} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatSection({ title, stats, isDark, showExamples = false }: { 
  title: string; 
  stats: StatTerm[]; 
  isDark: boolean;
  showExamples?: boolean;
}) {
  const headerClass = isDark ? 'text-orange-400' : 'text-orange-600';
  const abbrClass = isDark ? 'text-white bg-slate-700' : 'text-gray-900 bg-orange-100';
  const descClass = isDark ? 'text-slate-300' : 'text-gray-700';
  const exampleClass = isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-orange-50 text-gray-600';

  return (
    <div>
      <h4 className={`text-xs font-bold uppercase tracking-wide mb-2 ${headerClass}`}>{title}</h4>
      <div className="space-y-2">
        {stats.map((stat) => (
          <div key={stat.abbr}>
            <div className="flex items-start gap-2">
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${abbrClass}`}>{stat.abbr}</span>
              <span className={`text-sm ${descClass}`}>{stat.description}</span>
            </div>
            {showExamples && stat.example && (
              <div className={`mt-1.5 ml-8 p-2 rounded-lg text-xs ${exampleClass}`}>
                <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-500" />
                {stat.example}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

