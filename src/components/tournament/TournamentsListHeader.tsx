"use client";

import { Search, X, CheckCircle2 } from 'lucide-react';

interface TournamentsListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  searchQuery,
  onSearchChange,
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

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#B3B3B3]" />
          <input
            type="text"
            placeholder="Search tournaments by name or venue..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-[#121212] px-10 py-3 text-sm text-white placeholder:text-white/40 focus:border-[#FF3B30]/50 focus:outline-none focus:ring-1 focus:ring-[#FF3B30]/30"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#B3B3B3] hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

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
        {(searchQuery || showVerifiedOnly) && (
          <div className="text-sm text-[#B3B3B3]">
            Showing {filteredCount} tournament{filteredCount !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {showVerifiedOnly && ' (verified only)'}
          </div>
        )}
      </div>
    </>
  );
}

