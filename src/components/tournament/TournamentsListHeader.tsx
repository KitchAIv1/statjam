"use client";

import { CheckCircle2 } from 'lucide-react';

interface TournamentsListHeaderProps {
  selectedFilter: 'all' | 'live' | 'upcoming' | 'completed';
  onFilterChange: (filter: 'all' | 'live' | 'upcoming' | 'completed') => void;
  showVerifiedOnly: boolean;
  onVerifiedToggle: () => void;
  filteredCount: number;
  onSignIn: () => void;
  onStartTournament: () => void;
  user?: { role?: string } | null;
}

/**
 * TournamentsListHeader - Header component for tournaments list page
 * 
 * Purpose: Search, filters, and auth actions
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function TournamentsListHeader({
  selectedFilter,
  onFilterChange,
  showVerifiedOnly,
  onVerifiedToggle,
  filteredCount,
  onSignIn,
  onStartTournament,
  user
}: TournamentsListHeaderProps) {
  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center -ml-4 sm:-ml-6">
        <img 
          src="/images/logo-ball.webp" 
          alt="" 
          className="w-36 h-36 sm:w-48 sm:h-48 object-contain flex-shrink-0 -mr-6 sm:-mr-8"
        />
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 sm:text-5xl">Tournaments</h1>
          <p className="text-lg text-[#B3B3B3] sm:text-xl">Discover and follow live basketball tournaments</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Filter Tabs and Verified Toggle */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'live', 'upcoming', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
                  selectedFilter === filter
                    ? 'bg-[#FF3B30] text-white'
                    : 'bg-[#121212] text-[#B3B3B3] hover:text-white border border-white/10'
                }`}
              >
                {filter === 'all' ? 'All Tournaments' : filter}
              </button>
            ))}
          </div>
          
          {/* Verified Toggle */}
          <button
            onClick={onVerifiedToggle}
            className={`ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              showVerifiedOnly
                ? 'bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/50'
                : 'bg-[#121212] text-[#B3B3B3] hover:text-white border border-white/10'
            }`}
          >
            <CheckCircle2 className={`h-4 w-4 ${showVerifiedOnly ? 'text-[#FF3B30]' : ''}`} />
            Verified Only
          </button>
        </div>

        {/* Results Count */}
        {showVerifiedOnly && (
          <div className="text-sm text-[#B3B3B3]">
            Showing {filteredCount} tournament{filteredCount !== 1 ? 's' : ''}
            {showVerifiedOnly && ' (verified only)'}
          </div>
        )}
      </div>
    </>
  );
}

