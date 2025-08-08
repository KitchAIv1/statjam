'use client';

import { useEffect, useState, useCallback } from 'react';
import { SubstitutionsService, SubstitutionRow } from '@/lib/services/substitutionsService';
import { supabase } from '@/lib/supabase';

export function useSubstitutions(gameId: string) {
  const [subs, setSubs] = useState<SubstitutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubs = useCallback(async () => {
    try {
      setError(null);
      const rows = await SubstitutionsService.getByGameId(gameId);
      setSubs(rows);
    } catch (e) {
      setError('Failed to load substitutions');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    fetchSubs();

    const channel = supabase
      .channel(`subs-${gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'game_substitutions', filter: `game_id=eq.${gameId}` },
        (payload) => {
          const row = payload.new as SubstitutionRow;
          if (!row) return;
          setSubs((prev) => [row, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchSubs]);

  return { subs, loading, error, refetch: fetchSubs };
}

