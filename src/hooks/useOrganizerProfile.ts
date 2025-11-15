"use client";

import { useState, useEffect } from 'react';
import { getOrganizerBasicInfo, OrganizerBasicInfo } from '@/lib/services/organizerService';

interface UseOrganizerProfileReturn {
  organizer: OrganizerBasicInfo | null;
  loading: boolean;
  error: Error | null;
}

/**
 * useOrganizerProfile - Hook for fetching organizer profile data
 * 
 * Purpose: Fetch and cache organizer information
 * Follows .cursorrules: <100 lines, single responsibility
 */
export function useOrganizerProfile(organizerId: string | null | undefined): UseOrganizerProfileReturn {
  const [organizer, setOrganizer] = useState<OrganizerBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!organizerId) {
      setOrganizer(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchOrganizer = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrganizerBasicInfo(organizerId);
        if (mounted) {
          setOrganizer(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch organizer'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrganizer();

    return () => {
      mounted = false;
    };
  }, [organizerId]);

  return { organizer, loading, error };
}
