'use client';

/**
 * AssignedGamesList - Compact list view for stat admin assigned games
 *
 * Follows Cursor rules: extracted from stat-admin page to reduce file size.
 * Renders games in chronological order (1st → last). Supports 66+ games via pagination.
 * Mobile-responsive: table on desktop, stacked cards on small screens.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Zap, Eye, Lightbulb, ChevronDown, MapPin } from 'lucide-react';

const GAMES_PER_PAGE = 12;

export interface AssignedGameItem {
  id: string;
  tournamentName: string;
  teamA: string;
  teamB: string;
  teamAId: string;
  teamBId: string;
  scheduledDate: string;
  venue: string;
  status: string;
  is_demo?: boolean;
}

export interface OrganizerGroup {
  organizerId: string;
  organizerName: string;
  organizerEmail?: string;
  games: AssignedGameItem[];
}

export interface AssignedGamesListProps {
  organizerGroups: OrganizerGroup[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  launchingTracker: string | null;
  onLaunchTracker: (game: AssignedGameItem) => void;
  onViewDemo: (game: AssignedGameItem) => void;
}

export function AssignedGamesList({
  organizerGroups,
  loading,
  error,
  onRetry,
  launchingTracker,
  onLaunchTracker,
  onViewDemo,
}: AssignedGamesListProps) {
  const [displayLimit, setDisplayLimit] = useState(GAMES_PER_PAGE);

  const hasMore = organizerGroups.some((og) => (og.games?.length || 0) > displayLimit);
  const totalGames = organizerGroups.reduce((sum, og) => sum + (og.games?.length || 0), 0);
  const displayedCount = organizerGroups.reduce(
    (sum, og) => sum + Math.min(displayLimit, og.games?.length || 0),
    0,
  );

  if (loading) {
    return (
      <Card className="border-2 border-orange-200/50 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-gray-900 dark:text-gray-100">My Assigned Games</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Track and manage your game assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-orange-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 text-center">
            <div className="text-orange-600 text-base mb-2">Loading assigned games...</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">Fetching your game assignments</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-orange-200/50 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-gray-900 dark:text-gray-100">My Assigned Games</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-6 sm:p-8 text-center">
            <div className="text-red-700 dark:text-red-400 text-base mb-2">Error loading games</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</div>
            <button
              onClick={onRetry}
              className="bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (organizerGroups.length === 0 || totalGames === 0) {
    return (
      <Card className="border-2 border-orange-200/50 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-gray-900 dark:text-gray-100">My Assigned Games</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Track and manage your game assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-orange-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 text-center">
            <Trophy className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <div className="text-gray-700 dark:text-gray-300 text-base mb-2">No games assigned yet</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              Tournament organizers will assign games to you. Check back later or contact your
              organizer.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatGameDate = (date: Date) => ({
    dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
  });

  const actionButtons = (game: AssignedGameItem) => {
    const isLaunching = launchingTracker === game.id;
    const btnBase =
      'inline-flex items-center gap-1.5 rounded-md px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold min-h-[44px] sm:min-h-0 justify-center transition-colors touch-manipulation';
    return (
      <div className="flex flex-wrap gap-2 sm:gap-1.5">
        <button
          onClick={() => onLaunchTracker(game)}
          disabled={isLaunching}
          className={`${btnBase} disabled:opacity-70 disabled:cursor-not-allowed ${
            game.status === 'completed'
              ? 'bg-gray-900 text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0" />
          {isLaunching ? 'Launching...' : game.status === 'completed' ? 'Review' : 'Launch'}
        </button>
        {game.is_demo && (
          <button
            onClick={() => onViewDemo(game)}
            className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
          >
            <Eye className="h-3.5 w-3.5 shrink-0" />
            View Demo
          </button>
        )}
      </div>
    );
  };

  const statusBadge = (game: AssignedGameItem) =>
    game.is_demo ? (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-0">
        <Lightbulb className="mr-1 h-3 w-3" />
        Demo
      </Badge>
    ) : (
      <Badge
        className={
          game.status === 'completed'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-0'
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-0'
        }
      >
        {game.status}
      </Badge>
    );

  const renderGameRow = (game: AssignedGameItem, gameNum: number) => {
    const date = new Date(game.scheduledDate);
    const { dateStr, timeStr } = formatGameDate(date);

    return (
      <TableRow
        key={game.id}
        className={`${game.is_demo ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''} border-gray-200 dark:border-gray-700`}
      >
        <TableCell className="font-medium w-12 text-gray-500 dark:text-gray-400">{gameNum}</TableCell>
        <TableCell className="text-gray-900 dark:text-gray-100">
          <div className="font-medium">{game.teamA} vs {game.teamB}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{game.tournamentName}</div>
        </TableCell>
        <TableCell className="text-gray-600 dark:text-gray-400 whitespace-nowrap text-sm">
          {dateStr}
          <br />
          <span className="text-xs">{timeStr}</span>
        </TableCell>
        <TableCell className="text-gray-600 dark:text-gray-400 max-w-[120px] truncate text-sm hidden md:table-cell">
          {game.venue}
        </TableCell>
        <TableCell>{statusBadge(game)}</TableCell>
        <TableCell className="align-middle">{actionButtons(game)}</TableCell>
      </TableRow>
    );
  };

  const renderMobileCard = (game: AssignedGameItem, gameNum: number) => {
    const date = new Date(game.scheduledDate);
    const { dateStr, timeStr } = formatGameDate(date);

    return (
      <div
        key={game.id}
        className={`p-4 rounded-xl border-2 ${
          game.is_demo
            ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
            : 'bg-white dark:bg-gray-800/50 border-orange-200 dark:border-gray-700'
        }`}
      >
        <div className="flex justify-between items-start gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-base">
              {game.teamA} vs {game.teamB}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{game.tournamentName}</div>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">#{gameNum}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>{dateStr} · {timeStr}</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {game.venue}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(game)}
          <div className="flex-1 min-w-0">{actionButtons(game)}</div>
        </div>
      </div>
    );
  };

  let gameNumOffset = 0;

  return (
    <Card className="border-2 border-orange-200/50 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-orange-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-gray-900 dark:text-gray-100">My Assigned Games</CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Track and manage your game assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {(Array.isArray(organizerGroups) ? organizerGroups : []).map(
          (organizerGroup: OrganizerGroup) => {
            const games = organizerGroup.games || [];
            const visibleGames = games.slice(0, displayLimit);
            if (visibleGames.length === 0) return null;

            const startNum = gameNumOffset + 1;
            gameNumOffset += visibleGames.length;

            return (
              <div key={organizerGroup.organizerId} className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-white shadow-sm">
                  <Users className="h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">Organizer: {organizerGroup.organizerName}</div>
                    <div className="text-sm text-orange-100">
                      {games.length} game{games.length !== 1 ? 's' : ''} assigned
                    </div>
                  </div>
                </div>

                {/* Mobile: stacked cards */}
                <div className="md:hidden space-y-3">
                  {visibleGames.map((game, idx) => renderMobileCard(game, startNum + idx))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block rounded-lg border-2 border-orange-200/50 dark:border-gray-700 overflow-x-auto bg-white dark:bg-gray-900">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                        <TableHead className="w-12 text-gray-700 dark:text-gray-300">#</TableHead>
                        <TableHead className="text-gray-700 dark:text-gray-300">Matchup</TableHead>
                        <TableHead className="w-32 text-gray-700 dark:text-gray-300">Date & Time</TableHead>
                        <TableHead className="w-28 text-gray-700 dark:text-gray-300">Venue</TableHead>
                        <TableHead className="w-24 text-gray-700 dark:text-gray-300">Status</TableHead>
                        <TableHead className="w-40 text-gray-700 dark:text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleGames.map((game, idx) => renderGameRow(game, startNum + idx))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          },
        )}

        {hasMore && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedCount} of {totalGames}
            </span>
            <button
              onClick={() => setDisplayLimit((prev) => prev + GAMES_PER_PAGE)}
              className="inline-flex items-center gap-1.5 rounded-md border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 px-4 py-2.5 text-sm font-medium text-orange-700 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors min-h-[44px] touch-manipulation"
            >
              <ChevronDown className="h-4 w-4" />
              Load more
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
