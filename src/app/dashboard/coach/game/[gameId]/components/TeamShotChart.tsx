/**
 * TeamShotChart - Visual shot chart with court diagram for coach game viewer
 * 
 * Shows shot locations on half-court with made/missed markers.
 * Integrates existing HalfCourtDiagram and shotChartService.
 * 
 * OPTIMIZATIONS:
 * - Accepts prefetched data to avoid redundant API calls
 * - Falls back to internal fetch if no prefetched data
 * - Hidden when no shot location data exists
 * 
 * @module TeamShotChart
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Target } from 'lucide-react';
import { getTeamShotChart, ShotChartData } from '@/lib/services/shotChartService';
import { ShotLocationMarker } from '@/components/tracker-v3/shot-tracker/ShotLocationMarker';

interface TeamShotChartProps {
  gameId: string;
  teamId: string;
  teamName: string;
  /** Prefetched data from parent - avoids redundant API call */
  prefetchedData?: ShotChartData;
}

export function TeamShotChart({ 
  gameId, 
  teamId, 
  teamName, 
  prefetchedData 
}: TeamShotChartProps) {
  const [data, setData] = useState<ShotChartData | null>(prefetchedData || null);
  const [loading, setLoading] = useState(!prefetchedData);
  const [error, setError] = useState<string | null>(null);
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Only fetch if no prefetched data provided
  useEffect(() => {
    // If prefetched data is available, use it directly
    if (prefetchedData) {
      setData(prefetchedData);
      setLoading(false);
      return;
    }

    // Otherwise fetch data
    isMountedRef.current = true;
    
    async function fetchData() {
      if (!gameId || !teamId) return;
      
      try {
        const chartData = await getTeamShotChart(gameId, teamId);
        if (isMountedRef.current) {
          setData(chartData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load shot chart:', err);
        if (isMountedRef.current) {
          setError('Failed to load shot data');
          setLoading(false);
        }
      }
    }
    
    void fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [gameId, teamId, prefetchedData]);

  // Don't render anything while loading (avoids layout shift)
  if (loading) {
    return null;
  }

  // Don't render if error, no data, or no shot locations tracked
  if (error || !data || data.shots.length === 0) {
    return null;
  }

  const { stats } = data;

  return (
    <div className="rounded-lg p-4 bg-white border border-orange-200 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 pb-3 border-b border-orange-100 mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-orange-500" />
        {teamName} Shot Chart
      </h3>

      {/* Court Diagram with Markers */}
      <div className="relative w-full aspect-[4/3] mb-4 bg-slate-900 rounded-lg overflow-hidden">
        <Image
          src="/assets/halfcourt.png"
          alt="Basketball half-court"
          fill
          className="object-contain pointer-events-none"
          priority
        />
        
        {/* Shot Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {data.shots.map((shot) => (
            <ShotLocationMarker
              key={shot.id}
              location={shot.location}
              made={shot.made}
              perspective="team_a_attacks_up"
            />
          ))}
        </div>
      </div>

      {/* Shot Stats Summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatBox 
          label="FG" 
          made={stats.totalMade} 
          attempted={stats.totalAttempted} 
          percentage={stats.fgPercentage} 
        />
        <StatBox 
          label="2PT" 
          made={stats.twoPointMade} 
          attempted={stats.twoPointAttempted} 
          percentage={stats.twoPointPercentage} 
        />
        <StatBox 
          label="3PT" 
          made={stats.threePointMade} 
          attempted={stats.threePointAttempted} 
          percentage={stats.threePointPercentage} 
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600">Made ({stats.totalMade})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600">Missed ({stats.totalAttempted - stats.totalMade})</span>
        </div>
      </div>
    </div>
  );
}

/** Compact stat box for shot breakdown */
function StatBox({ 
  label, 
  made, 
  attempted, 
  percentage 
}: { 
  label: string; 
  made: number; 
  attempted: number; 
  percentage: number;
}) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg">
      <div className="text-[10px] uppercase text-gray-500 font-medium">{label}</div>
      <div className="text-sm font-bold text-gray-900">{made}/{attempted}</div>
      <div className="text-xs font-semibold text-orange-600">{percentage}%</div>
    </div>
  );
}
