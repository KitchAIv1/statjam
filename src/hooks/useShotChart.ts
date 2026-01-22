/**
 * useShotChart Hook - Shot Chart Data with Prefetching
 * 
 * PURPOSE: Fetch shot chart data with prefetch/enabled options
 * for optimized loading in coach game viewer.
 * 
 * FEATURES:
 * - Fetch shot locations using shotChartService
 * - Support prefetch mode for background loading
 * - Conditional fetching with enabled option
 * 
 * @module useShotChart
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTeamShotChart, ShotChartData } from '@/lib/services/shotChartService';

export interface UseShotChartOptions {
  prefetch?: boolean; // Enable prefetching mode (no loading state shown)
  enabled?: boolean;  // Allow conditional fetching
}

export interface UseShotChartReturn {
  data: ShotChartData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useShotChart(
  gameId: string,
  teamId: string,
  options: UseShotChartOptions = {}
): UseShotChartReturn {
  const [data, setData] = useState<ShotChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!gameId || !teamId) return;
    
    // Respect enabled option (default true)
    if (options.enabled === false) return;

    try {
      // Only show loading on initial load, not prefetch
      if (!options.prefetch) {
        setLoading(true);
      }
      setError(null);

      const chartData = await getTeamShotChart(gameId, teamId);
      
      if (isMountedRef.current) {
        setData(chartData);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ useShotChart: Error fetching shot chart:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load shot chart');
        setLoading(false);
      }
    }
  }, [gameId, teamId, options.enabled, options.prefetch]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    void fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
