'use client';

/**
 * ShotChartView - Reusable shot chart visualization component
 * 
 * Displays shot locations on a half-court diagram with made/missed markers.
 * Includes shooting statistics and zone breakdown.
 * 
 * @module ShotChartView
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShotChartData, getShotChartData, ShotRecord } from '@/lib/services/shotChartService';

// ============================================================================
// TYPES
// ============================================================================

interface ShotChartViewProps {
  /** Game ID to fetch shots for */
  gameId: string;
  /** Optional: Filter to specific player */
  playerId?: string;
  /** Optional: Filter to specific team */
  teamId?: string;
  /** Optional: Title for the chart */
  title?: string;
  /** Optional: Show legend (default: true) */
  showLegend?: boolean;
  /** Optional: Show stats summary (default: true) */
  showStats?: boolean;
  /** Optional: Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Individual shot marker on the court
 */
function ShotMarker({ shot, size }: { shot: ShotRecord; size: 'sm' | 'md' | 'lg' }) {
  const markerSize = size === 'sm' ? 'w-2.5 h-2.5' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  const fontSize = size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-xs';
  
  return (
    <div
      className={`absolute ${markerSize} rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 
        ${shot.made 
          ? 'bg-green-500 border-green-300' 
          : 'bg-red-500 border-red-300'
        }`}
      style={{
        left: `${shot.location.x}%`,
        top: `${shot.location.y}%`
      }}
      title={`${shot.playerName || 'Player'}: ${shot.made ? 'Made' : 'Missed'} ${shot.points}PT`}
    >
      <span className={`absolute inset-0 flex items-center justify-center text-white font-bold ${fontSize}`}>
        {shot.made ? '✓' : '✗'}
      </span>
    </div>
  );
}

/**
 * Legend showing made/missed indicators
 */
function ShotChartLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-3">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-300" />
        <span className="text-xs text-gray-600">Made</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-300" />
        <span className="text-xs text-gray-600">Missed</span>
      </div>
    </div>
  );
}

/**
 * Stats summary panel
 */
function ShotChartStats({ stats }: { stats: ShotChartData['stats'] }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
      {/* Overall FG% */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="text-lg font-bold text-gray-900">{stats.fgPercentage}%</div>
        <div className="text-xs text-gray-500">FG ({stats.totalMade}/{stats.totalAttempted})</div>
      </div>
      
      {/* 2PT% */}
      <div className="bg-blue-50 rounded-lg p-2">
        <div className="text-lg font-bold text-blue-600">{stats.twoPointPercentage}%</div>
        <div className="text-xs text-gray-500">2PT ({stats.twoPointMade}/{stats.twoPointAttempted})</div>
      </div>
      
      {/* 3PT% */}
      <div className="bg-purple-50 rounded-lg p-2">
        <div className="text-lg font-bold text-purple-600">{stats.threePointPercentage}%</div>
        <div className="text-xs text-gray-500">3PT ({stats.threePointMade}/{stats.threePointAttempted})</div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShotChartView({
  gameId,
  playerId,
  teamId,
  title,
  showLegend = true,
  showStats = true,
  size = 'md'
}: ShotChartViewProps) {
  const [data, setData] = useState<ShotChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shot data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const chartData = await getShotChartData({ gameId, playerId, teamId });
        setData(chartData);
      } catch (err) {
        console.error('❌ Error loading shot chart:', err);
        setError('Failed to load shot chart data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [gameId, playerId, teamId]);

  // Size configurations
  const sizeConfig = {
    sm: { court: 'h-40', container: 'max-w-xs' },
    md: { court: 'h-56', container: 'max-w-sm' },
    lg: { court: 'h-72', container: 'max-w-md' }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${sizeConfig[size].container} mx-auto`}>
        <div className={`${sizeConfig[size].court} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
          <div className="text-gray-400 text-sm">Loading shot chart...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${sizeConfig[size].container} mx-auto`}>
        <div className={`${sizeConfig[size].court} bg-red-50 rounded-lg flex items-center justify-center`}>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.shots.length === 0) {
    return (
      <div className={`${sizeConfig[size].container} mx-auto`}>
        {title && (
          <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">{title}</h3>
        )}
        <div className={`${sizeConfig[size].court} bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200`}>
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-1">🏀</div>
            <div className="text-sm">No shot data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeConfig[size].container} mx-auto`}>
      {/* Title */}
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">{title}</h3>
      )}
      
      {/* Court with shots */}
      <div className={`relative ${sizeConfig[size].court} rounded-lg overflow-hidden bg-slate-800`}>
        {/* Court image */}
        <Image
          src="/assets/halfcourt.png"
          alt="Half Court"
          fill
          className="object-contain"
          priority
        />
        
        {/* Shot markers overlay */}
        <div className="absolute inset-0">
          {data.shots.map((shot) => (
            <ShotMarker key={shot.id} shot={shot} size={size} />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && <ShotChartLegend />}
      
      {/* Stats */}
      {showStats && <ShotChartStats stats={data.stats} />}
    </div>
  );
}
