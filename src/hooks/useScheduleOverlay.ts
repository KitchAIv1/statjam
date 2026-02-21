/**
 * useScheduleOverlay Hook
 *
 * Manual-trigger schedule overlay for live broadcast.
 * REUSES useScheduleData - filters by day, memoized when visible.
 *
 * @module useScheduleOverlay
 */

import { useState, useCallback, useMemo } from 'react';
import { useScheduleData } from './useScheduleData';
import {
  formatScheduleTime,
  formatScheduleDate,
  isSameCalendarDay,
  getUniqueScheduleDates,
} from '@/lib/utils/scheduleOverlayUtils';
import type { ScheduleGameRow, ScheduleOverlayPayload } from '@/lib/types/scheduleOverlay';

interface UseScheduleOverlayOptions {
  tournamentId: string | null;
  country: string;
  selectedDate: Date | null;
}
export function useScheduleOverlay(options: UseScheduleOverlayOptions) {
  const [isVisible, setIsVisible] = useState(false);

  const { games: allGames, loading } = useScheduleData(
    options.tournamentId ?? ''
  );

  const availableDates = useMemo(
    () => getUniqueScheduleDates(allGames),
    [allGames]
  );

  const schedulePayload = useMemo<ScheduleOverlayPayload | null>(() => {
    if (!options.tournamentId || !isVisible || !options.selectedDate) return null;

    const refDate = options.selectedDate;
    const gamesForDay = allGames.filter((g) =>
      isSameCalendarDay(g.start_time, refDate)
    );

    const rows: ScheduleGameRow[] = gamesForDay
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 8)
      .map((g) => ({
        id: g.id,
        teamAName: g.teamAName ?? 'Team A',
        teamBName: g.teamBName ?? 'Team B',
        teamALogoUrl: g.teamALogo,
        teamBLogoUrl: g.teamBLogo,
        startTime: g.start_time,
        timeFormatted: formatScheduleTime(g.start_time),
        dateFormatted: formatScheduleDate(g.start_time),
        venue: g.venue,
        country: options.country,
      }));

    const displayDate = refDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return { displayDate, games: rows };
  }, [
    options.tournamentId,
    options.country,
    options.selectedDate?.toISOString?.().slice(0, 10),
    isVisible,
    allGames,
  ]);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible((v) => !v), []);

  return {
    isVisible,
    isLoading: loading,
    schedulePayload,
    availableDates,
    show,
    hide,
    toggle,
  };
}
