"use client";

import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface TournamentsEmptyStateProps {
  searchQuery?: string;
  showVerifiedOnly?: boolean;
}

/**
 * TournamentsEmptyState - Empty state component for tournaments list
 * 
 * Purpose: Display appropriate empty state messages
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function TournamentsEmptyState({ searchQuery, showVerifiedOnly }: TournamentsEmptyStateProps) {
  const hasFilters = !!searchQuery || showVerifiedOnly;

  return (
    <Card className="rounded-2xl border border-white/10 bg-[#121212] p-12 text-center">
      <Trophy className="h-16 w-16 mx-auto mb-4 text-[#B3B3B3]" />
      <h2 className="text-xl font-semibold text-white mb-2">
        {hasFilters ? 'No tournaments found' : 'No tournaments yet'}
      </h2>
      <p className="text-[#B3B3B3]">
        {hasFilters
          ? 'Try adjusting your search or filter criteria.'
          : 'Check back soon for upcoming tournaments and live events.'}
      </p>
    </Card>
  );
}

