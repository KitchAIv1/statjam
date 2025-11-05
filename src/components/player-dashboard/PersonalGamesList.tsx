'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Calendar, MapPin, Users, MoreHorizontal, History } from 'lucide-react';
import { PersonalGameCard } from './PersonalGameCard';
import { PersonalGamesListResponse } from '@/lib/services/personalGamesService';

interface PersonalGamesListProps {
  games: PersonalGamesListResponse['games'];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function PersonalGamesList({ 
  games, 
  loading, 
  hasMore, 
  onLoadMore, 
  onRefresh 
}: PersonalGamesListProps) {
  
  // Loading skeleton
  if (loading && games.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!loading && games.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your personal games to build your basketball history.
          </p>
          <div className="text-sm text-muted-foreground">
            Record pickup games, practices, and scrimmages to track your progress over time.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Game History</h2>
          <p className="text-sm text-muted-foreground">
            {games.length} game{games.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Games List */}
      <div className="space-y-3">
        {games.map((game, index) => (
          <PersonalGameCard
            key={game.id}
            game={game}
            isRecent={index < 3}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            <MoreHorizontal className="w-4 h-4 mr-2" />
            {loading ? 'Loading...' : 'Load More Games'}
          </Button>
        </div>
      )}
    </div>
  );
}
