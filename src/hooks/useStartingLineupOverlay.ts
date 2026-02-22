/**
 * useStartingLineupOverlay Hook
 *
 * Manual-trigger starting lineup overlay for live broadcast.
 * Fetches first 5 players (on-court) per team via getTeamPlayersWithSubstitutions.
 *
 * @module useStartingLineupOverlay
 */

import { useState, useCallback, useEffect } from 'react';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import type { LineupPlayer, StartingLineupPayload } from '@/components/overlay/StartingLineupOverlayPanel';

interface UseStartingLineupOverlayOptions {
  gameId: string | null;
  teamAId: string | null;
  teamBId: string | null;
  teamAName: string;
  teamBName: string;
  teamALogo?: string | null;
  teamBLogo?: string | null;
  /** From overlayData.teamAPrimaryColor (teams.primary_color via useGameOverlayData) */
  teamAPrimaryColor?: string | null;
  /** From overlayData.teamBPrimaryColor (teams.primary_color via useGameOverlayData) */
  teamBPrimaryColor?: string | null;
  tournamentName: string;
  tournamentLogo?: string | null;
}

function mapToLineupPlayer(p: { id: string; name: string; jerseyNumber?: number; photo_url?: string | null }): LineupPlayer {
  return {
    id: p.id,
    name: p.name || 'Unknown',
    jerseyNumber: p.jerseyNumber ?? null,
    photo_url: p.photo_url ?? null,
  };
}

function buildPayload(
  rosterA: { id: string; name: string; jerseyNumber?: number; photo_url?: string | null }[],
  rosterB: { id: string; name: string; jerseyNumber?: number; photo_url?: string | null }[],
  opts: UseStartingLineupOverlayOptions
): StartingLineupPayload {
  const playersA = rosterA.slice(0, 5).map(mapToLineupPlayer);
  const playersB = rosterB.slice(0, 5).map(mapToLineupPlayer);
  return {
    tournamentName: opts.tournamentName,
    tournamentLogo: opts.tournamentLogo ?? null,
    teamA: {
      name: opts.teamAName,
      logo: opts.teamALogo ?? null,
      primaryColor: opts.teamAPrimaryColor ?? null,
      players: playersA,
    },
    teamB: {
      name: opts.teamBName,
      logo: opts.teamBLogo ?? null,
      primaryColor: opts.teamBPrimaryColor ?? null,
      players: playersB,
    },
  };
}

export function useStartingLineupOverlay(options: UseStartingLineupOverlayOptions) {
  const [isVisible, setIsVisible] = useState(false);
  const [payload, setPayload] = useState<StartingLineupPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [cachedPayload, setCachedPayload] = useState<StartingLineupPayload | null>(null);

  // Preload: fetch lineup when game/teams are selected (independent of isVisible)
  useEffect(() => {
    if (!options.gameId || !options.teamAId || !options.teamBId) {
      setCachedPayload(null);
      return;
    }
    setCachedPayload(null);
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        const [rosterA, rosterB] = await Promise.all([
          TeamServiceV3.getTeamPlayersWithSubstitutions(options.teamAId!, options.gameId!),
          TeamServiceV3.getTeamPlayersWithSubstitutions(options.teamBId!, options.gameId!),
        ]);
        if (cancelled) return;
        setCachedPayload(buildPayload(rosterA, rosterB, options));
      } catch (err) {
        if (!cancelled) setCachedPayload(null);
        console.error('❌ useStartingLineupOverlay (preload):', err);
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    options.gameId,
    options.teamAId,
    options.teamBId,
    options.teamAName,
    options.teamBName,
    options.teamALogo,
    options.teamBLogo,
    options.teamAPrimaryColor,
    options.teamBPrimaryColor,
    options.tournamentName,
    options.tournamentLogo,
  ]);

  // When overlay becomes visible: use cache if available, else fetch
  useEffect(() => {
    if (!isVisible || !options.gameId || !options.teamAId || !options.teamBId) {
      if (!isVisible) setPayload(null);
      return;
    }

    if (cachedPayload) {
      setPayload(cachedPayload);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        const [rosterA, rosterB] = await Promise.all([
          TeamServiceV3.getTeamPlayersWithSubstitutions(options.teamAId!, options.gameId!),
          TeamServiceV3.getTeamPlayersWithSubstitutions(options.teamBId!, options.gameId!),
        ]);
        if (cancelled) return;

        setPayload(buildPayload(rosterA, rosterB, options));
      } catch (err) {
        if (!cancelled) setPayload(null);
        console.error('❌ useStartingLineupOverlay:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [
    isVisible,
    cachedPayload,
    options.gameId,
    options.teamAId,
    options.teamBId,
    options.teamAName,
    options.teamBName,
    options.teamALogo,
    options.teamBLogo,
    options.teamAPrimaryColor,
    options.teamBPrimaryColor,
    options.tournamentName,
    options.tournamentLogo,
  ]);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible((v) => !v), []);

  return { isVisible, isLoading: loading, payload, show, hide, toggle };
}
