'use client';

/**
 * VideoStatsTimeline - Enhanced timeline of recorded stats with video timestamps
 * 
 * Features:
 * - Quarter filter dropdown
 * - Edit/Delete buttons per row
 * - Click to seek to video position
 * - Table layout matching Edit Stats modal
 * 
 * @module VideoStatsTimeline
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Loader2, Clock, Trash2, Play, Edit, Filter, X, RefreshCw, Crosshair, CheckSquare, Square, Pause } from 'lucide-react';
import { VideoStatService, ClockSyncConfig } from '@/lib/services/videoStatService';
import { StatEditServiceV2 } from '@/lib/services/statEditServiceV2';
import { SubstitutionsService, SubstitutionRow } from '@/lib/services/substitutionsService';
import { supabase } from '@/lib/supabase';
import { StatEditForm } from '@/components/tracker-v3/modals/StatEditForm';
import type { VideoStat } from '@/lib/types/video';
import type { GameStatRecord } from '@/lib/services/statEditService';

// ✅ OPTIMIZATION: Debounce delay for timeline refresh (prevents connection storms)
const REFRESH_DEBOUNCE_MS = 3000;

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

export interface GameClockData {
  quarter: number;
  minutes: number;
  seconds: number;
}

interface VideoStatsTimelineProps {
  gameId: string;
  onSeekToTimestamp: (timestampMs: number, gameClock?: GameClockData) => void;
  refreshTrigger?: number;
  // Team data for edit form
  teamAPlayers?: Player[];
  teamBPlayers?: Player[];
  teamAId?: string;
  teamBId?: string;
  teamAName?: string;
  teamBName?: string;
  // Coach mode
  isCoachMode?: boolean;
  opponentName?: string;  // Coach mode: name of opponent team
  // Clock sync config for video timestamp sync when editing stats
  clockSyncConfig?: ClockSyncConfig | null;
  // Current video position for "Mark at current position" feature
  currentVideoTimeMs?: number;
  // Clock control props (optional - only show if provided)
  clockFrozen?: boolean;
  frozenClockValue?: { quarter: number; minutesRemaining: number; secondsRemaining: number } | null;
  gameClock?: { quarter: number; minutesRemaining: number; secondsRemaining: number } | null;
  onClockPause?: () => void;
  onClockResume?: () => void;
}

// Format milliseconds to MM:SS
function formatVideoTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format game clock to MM:SS
function formatGameClock(minutes: number | undefined, seconds: number | undefined): string {
  if (minutes === undefined || seconds === undefined) return '--:--';
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Get stat display label
function getStatLabel(statType: string, modifier?: string): string {
  if (statType === 'turnover' && modifier) {
    const labels: Record<string, string> = {
      bad_pass: 'TO-BadPass', lost_ball: 'TO-Lost', travel: 'TO-Travel',
      out_of_bounds: 'TO-OOB', double_dribble: 'TO-Dbl', offensive_foul: 'TO-Off', steal: 'TO-Stl',
    };
    return labels[modifier] || 'TO';
  }
  if (statType === 'foul' && modifier) {
    const labels: Record<string, string> = {
      personal: 'PF', shooting: 'SF', offensive: 'OF', technical: 'TF', flagrant: 'FF', '1-and-1': '1&1',
    };
    return labels[modifier] || 'FOUL';
  }
  const labels: Record<string, string> = {
    field_goal: modifier === 'made' ? '2PT✓' : '2PT✗',
    three_pointer: modifier === 'made' ? '3PT✓' : '3PT✗',
    free_throw: modifier === 'made' ? 'FT✓' : 'FT✗',
    assist: 'AST', rebound: modifier === 'offensive' ? 'OREB' : 'DREB',
    steal: 'STL', block: 'BLK', turnover: 'TO', foul: 'FOUL',
  };
  return labels[statType] || statType.toUpperCase();
}

// Get stat color class
function getStatBadgeColor(statType: string, modifier?: string): string {
  if (statType === 'substitution') return 'bg-purple-100 text-purple-700';
  if (modifier === 'made') return 'bg-green-100 text-green-700';
  if (modifier === 'missed') return 'bg-red-100 text-red-700';
  const colors: Record<string, string> = {
    assist: 'bg-blue-100 text-blue-700', rebound: 'bg-yellow-100 text-yellow-700',
    steal: 'bg-purple-100 text-purple-700', block: 'bg-indigo-100 text-indigo-700',
    turnover: 'bg-orange-100 text-orange-700', foul: 'bg-red-100 text-red-700',
  };
  return colors[statType] || 'bg-gray-100 text-gray-700';
}

// Unified timeline entry (stat or substitution)
interface TimelineEntry {
  id: string;
  type: 'stat' | 'substitution';
  quarter: number;
  gameTimeMinutes: number;
  gameTimeSeconds: number;
  createdAt: string;
  // Stat-specific
  stat?: VideoStat;
  // Substitution-specific
  substitution?: SubstitutionRow;
  playerOutName?: string;
  playerInName?: string;
}

export function VideoStatsTimeline({
  gameId,
  onSeekToTimestamp,
  refreshTrigger = 0,
  teamAPlayers = [],
  teamBPlayers = [],
  teamAId,
  teamBId,
  teamAName = 'Team A',
  teamBName = 'Team B',
  isCoachMode = false,
  opponentName = 'Opponent',
  clockSyncConfig,
  currentVideoTimeMs,
  // Clock control props
  clockFrozen = false,
  frozenClockValue,
  gameClock,
  onClockPause,
  onClockResume,
}: VideoStatsTimelineProps) {
  
  // Helper to get display name for a stat (handles opponent stats)
  const getStatDisplayName = (stat: VideoStat): string => {
    if (stat.isOpponentStat) {
      return opponentName;
    }
    return stat.playerName || 'Unknown';
  };
  const [stats, setStats] = useState<VideoStat[]>([]);
  const [substitutions, setSubstitutions] = useState<SubstitutionRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // Only true on first load
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [editingStat, setEditingStat] = useState<GameStatRecord | null>(null);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  
  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Scroll position preservation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // ✅ OPTIMIZATION: Debounce ref for refresh
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTriggerRef = useRef(refreshTrigger);

  // Helper to get player name by ID
  const getPlayerNameById = useCallback((playerId: string | null, customPlayerId: string | null): string => {
    if (!playerId && !customPlayerId) return 'Unknown';
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const player = allPlayers.find(p => p.id === playerId || p.id === customPlayerId);
    return player?.name || 'Unknown';
  }, [teamAPlayers, teamBPlayers]);

  // Load stats and substitutions (initial load only shows spinner)
  const loadStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading && stats.length === 0) {
        setInitialLoading(true);
      }
      const [videoStats, subs] = await Promise.all([
        VideoStatService.getVideoStats(gameId),
        SubstitutionsService.getByGameId(gameId),
      ]);
      setStats(videoStats);
      setSubstitutions(subs);
    } catch (error) {
      console.error('Error loading video stats:', error);
    } finally {
      setInitialLoading(false);
    }
  }, [gameId, stats.length]);

  // Silent background refresh (preserves scroll, no UI disruption)
  const silentRefresh = useCallback(async () => {
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    await loadStats(false);
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    });
  }, [loadStats]);

  // ✅ OPTIMIZATION: Initial load only (no dependency on refreshTrigger)
  useEffect(() => {
    loadStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);
  
  // ✅ OPTIMIZATION: Debounced refresh on trigger change (prevents connection storms)
  useEffect(() => {
    // Skip if this is initial mount or same trigger
    if (refreshTrigger === 0 || refreshTrigger === lastRefreshTriggerRef.current) {
      return;
    }
    lastRefreshTriggerRef.current = refreshTrigger;
    
    // Clear existing debounce
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }
    
    // Debounce the refresh
    refreshDebounceRef.current = setTimeout(() => {
      console.log('🔄 Timeline: Debounced refresh triggered');
      silentRefresh();
    }, REFRESH_DEBOUNCE_MS);
    
    // Cleanup on unmount
    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, [refreshTrigger, silentRefresh]);

  // Build unified timeline entries
  const timelineEntries = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];
    
    // Add stats - convert gameClockSeconds to minutes/seconds
    stats.forEach(stat => {
      // VideoStat has gameClockSeconds (total), convert to minutes/seconds
      const totalSeconds = stat.gameClockSeconds || 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      
      entries.push({
        id: stat.id,
        type: 'stat',
        quarter: stat.quarter,
        gameTimeMinutes: minutes,
        gameTimeSeconds: seconds,
        createdAt: stat.createdAt || '',
        stat,
      });
    });
    
    // Add substitutions
    substitutions.forEach(sub => {
      entries.push({
        id: sub.id,
        type: 'substitution',
        quarter: sub.quarter || 1,
        gameTimeMinutes: sub.game_time_minutes || 0,
        gameTimeSeconds: sub.game_time_seconds || 0,
        createdAt: sub.created_at || '',
        substitution: sub,
        playerOutName: getPlayerNameById(sub.player_out_id, sub.custom_player_out_id || null),
        playerInName: getPlayerNameById(sub.player_in_id, sub.custom_player_in_id || null),
      });
    });
    
    // Sort by created_at descending (most recent first)
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return entries;
  }, [stats, substitutions, getPlayerNameById]);

  // Filter by quarter
  const filteredEntries = useMemo(() => {
    if (filterQuarter === 'all') return timelineEntries;
    return timelineEntries.filter(e => e.quarter === parseInt(filterQuarter, 10));
  }, [timelineEntries, filterQuarter]);

  // Handle delete stat (optimistic update - remove from UI immediately)
  const handleDelete = useCallback(async (statId: string) => {
    // Save scroll position
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    
    // Optimistic update: remove from local state immediately
    setStats(prev => prev.filter(s => s.id !== statId));
    setDeletingStatId(null);
    
    try {
      await StatEditServiceV2.deleteStat(statId, gameId);
      // Success - item already removed from UI
    } catch (error) {
      console.error('Error deleting stat:', error);
      alert('Failed to delete stat. Refreshing...');
      // Rollback: reload from server
      await silentRefresh();
    }
    
    // Restore scroll position
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    });
  }, [gameId, silentRefresh]);

  // Handle delete substitution (optimistic update)
  const handleDeleteSubstitution = useCallback(async (subId: string) => {
    // Save scroll position
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    
    // Optimistic update: remove from local state immediately
    setSubstitutions(prev => prev.filter(s => s.id !== subId));
    setDeletingSubId(null);
    
    try {
      const success = await SubstitutionsService.deleteSubstitution(subId);
      if (!success) {
        alert('Failed to delete substitution. Refreshing...');
        await silentRefresh();
      }
    } catch (error) {
      console.error('Error deleting substitution:', error);
      alert('Failed to delete substitution. Refreshing...');
      await silentRefresh();
    }
    
    // Restore scroll position
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    });
  }, [silentRefresh]);

  // Toggle selection for a single item
  const toggleSelection = useCallback((id: string, type: 'stat' | 'substitution') => {
    const key = `${type}:${id}`;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Select/deselect all visible entries
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredEntries.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      const allIds = new Set(filteredEntries.map(e => `${e.type}:${e.id}`));
      setSelectedIds(allIds);
    }
  }, [filteredEntries, selectedIds.size]);

  // Batch delete selected items (optimistic update)
  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    // Save scroll position
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    
    setIsDeleting(true);
    
    // Optimistic update: remove all selected items from UI immediately
    const statIdsToDelete = new Set<string>();
    const subIdsToDelete = new Set<string>();
    
    for (const key of selectedIds) {
      const [type, id] = key.split(':');
      if (type === 'stat') statIdsToDelete.add(id);
      else if (type === 'substitution') subIdsToDelete.add(id);
    }
    
    setStats(prev => prev.filter(s => !statIdsToDelete.has(s.id)));
    setSubstitutions(prev => prev.filter(s => !subIdsToDelete.has(s.id)));
    setSelectedIds(new Set());
    setShowBatchDeleteConfirm(false);
    
    // Now delete from server in background
    let failCount = 0;
    
    try {
      for (const key of selectedIds) {
        const [type, id] = key.split(':');
        try {
          if (type === 'stat') {
            await StatEditServiceV2.deleteStat(id, gameId);
          } else if (type === 'substitution') {
            const success = await SubstitutionsService.deleteSubstitution(id);
            if (!success) failCount++;
          }
        } catch (error) {
          console.error(`Failed to delete ${type} ${id}:`, error);
          failCount++;
        }
      }
      
      console.log(`✅ Batch delete complete: ${selectedIds.size - failCount} deleted, ${failCount} failed`);
      
      if (failCount > 0) {
        alert(`Some items failed to delete. Refreshing...`);
        await silentRefresh();
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      alert('Error during batch delete. Refreshing...');
      await silentRefresh();
    } finally {
      setIsDeleting(false);
      // Restore scroll position
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    }
  }, [selectedIds, gameId, silentRefresh]);

  // Handle edit click - convert VideoStat to GameStatRecord format
  const handleEditClick = useCallback((stat: VideoStat) => {
    // Convert gameClockSeconds (total seconds) to minutes/seconds
    const totalSeconds = stat.gameClockSeconds || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const gameStatRecord: GameStatRecord = {
      id: stat.id,
      game_id: gameId,
      player_id: stat.playerId || null,
      custom_player_id: stat.customPlayerId || null,
      team_id: stat.teamId,
      stat_type: stat.statType,
      modifier: stat.modifier || null,
      stat_value: stat.statValue || 1,
      quarter: stat.quarter,
      game_time_minutes: minutes,
      game_time_seconds: seconds,
      created_at: stat.createdAt || new Date().toISOString(),
      is_opponent_stat: stat.isOpponentStat || false,
      player_name: stat.playerName,
      // ✅ Shot location fields for edit form
      shot_location_x: stat.shotLocationX ?? null,
      shot_location_y: stat.shotLocationY ?? null,
      shot_zone: stat.shotZone ?? null,
    };
    setEditingStat(gameStatRecord);
  }, [gameId]);

  // Handle edit success (silent refresh, preserves scroll position)
  const handleEditSuccess = useCallback(async () => {
    setEditingStat(null);
    await silentRefresh();
  }, [silentRefresh]);

  // Handle "Mark at current position" - update stat's video_timestamp_ms to current playhead
  const handleMarkAtCurrentPosition = useCallback(async (statId: string) => {
    if (currentVideoTimeMs === undefined) {
      console.warn('⚠️ Cannot mark - no current video time available');
      return;
    }
    
    // Save scroll position
    const scrollTop = scrollContainerRef.current?.scrollTop || 0;
    const newTimestamp = Math.round(currentVideoTimeMs);
    
    // Optimistic update: update local state immediately
    setStats(prev => prev.map(s => 
      s.id === statId 
        ? { ...s, videoTimestampMs: newTimestamp }
        : s
    ));
    
    try {
      const { error } = await supabase
        .from('game_stats')
        .update({ video_timestamp_ms: newTimestamp })
        .eq('id', statId);
      
      if (error) throw error;
      
      console.log(`✅ Marked stat ${statId} at ${formatVideoTime(currentVideoTimeMs)}`);
    } catch (error) {
      console.error('❌ Error marking stat:', error);
      alert('Failed to mark stat at current position. Refreshing...');
      await silentRefresh();
    }
    
    // Restore scroll position
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    });
  }, [currentVideoTimeMs, silentRefresh]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All ({timelineEntries.length})</option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
            <option value="5">OT1</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch delete button */}
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Delete ({selectedIds.size})
            </button>
          )}
          {/* ✅ Manual refresh button */}
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              await silentRefresh();
              setIsRefreshing(false);
            }}
            disabled={isRefreshing}
            title="Refresh timeline"
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </button>
          <span className="text-xs text-gray-500">
            {filteredEntries.length} entries
          </span>
        </div>
      </div>
      
      {/* Clock Pause/Resume Controls */}
      {(onClockPause || onClockResume) && (
        <div className="mb-3 flex items-center gap-2">
          {/* Clock Frozen: Resume Button */}
          {clockFrozen && frozenClockValue && onClockResume && (
            <button
              onClick={onClockResume}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors animate-pulse"
            >
              <Play className="w-4 h-4" />
              Resume Clock
            </button>
          )}
          
          {/* Clock Running: Pause Button */}
          {!clockFrozen && gameClock && onClockPause && (
            <button
              onClick={onClockPause}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause Clock
            </button>
          )}
          
          {/* Frozen Clock Indicator */}
          {clockFrozen && frozenClockValue && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-700 text-xs font-medium">
                ❄️ Frozen at Q{frozenClockValue.quarter > 4 ? `OT${frozenClockValue.quarter - 4}` : frozenClockValue.quarter} {frozenClockValue.minutesRemaining}:{frozenClockValue.secondsRemaining.toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium mb-2">
            Delete {selectedIds.size} selected item{selectedIds.size > 1 ? 's' : ''}?
          </p>
          <p className="text-xs text-red-600 mb-3">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
            </button>
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats table */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No stats recorded yet</p>
        </div>
      ) : (
        <div ref={scrollContainerRef} className="overflow-y-auto max-h-60">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-2 py-1.5 w-8">
                  <button
                    onClick={toggleSelectAll}
                    className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    title={selectedIds.size === filteredEntries.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedIds.size === filteredEntries.length && filteredEntries.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-2 py-1.5 font-medium">Video</th>
                <th className="px-2 py-1.5 font-medium">Q</th>
                <th className="px-2 py-1.5 font-medium">Time</th>
                <th className="px-2 py-1.5 font-medium">Player</th>
                <th className="px-2 py-1.5 font-medium">Action</th>
                <th className="px-2 py-1.5 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map((entry) => {
                const selectionKey = `${entry.type}:${entry.id}`;
                const isSelected = selectedIds.has(selectionKey);
                return (
                <tr key={entry.id} className={`hover:bg-gray-50 group ${isSelected ? 'bg-orange-50' : ''}`}>
                  {/* Selection checkbox */}
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => toggleSelection(entry.id, entry.type)}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  </td>
                  {/* Video timestamp - clickable (stats and substitutions with video timestamps) */}
                  <td className="px-2 py-1.5">
                    {entry.type === 'stat' && entry.stat?.videoTimestampMs ? (
                      <button
                        onClick={() => onSeekToTimestamp(entry.stat!.videoTimestampMs, {
                          quarter: entry.quarter,
                          minutes: entry.gameTimeMinutes,
                          seconds: entry.gameTimeSeconds,
                        })}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded text-xs font-mono transition-colors"
                        title="Jump to this moment (video + game clock)"
                      >
                        <Play className="w-3 h-3" />
                        {formatVideoTime(entry.stat!.videoTimestampMs)}
                      </button>
                    ) : entry.type === 'substitution' && entry.substitution?.video_timestamp_ms ? (
                      <button
                        onClick={() => onSeekToTimestamp(entry.substitution!.video_timestamp_ms!, {
                          quarter: entry.quarter,
                          minutes: entry.gameTimeMinutes,
                          seconds: entry.gameTimeSeconds,
                        })}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded text-xs font-mono transition-colors"
                        title="Jump to this moment (video + game clock)"
                      >
                        <Play className="w-3 h-3" />
                        {formatVideoTime(entry.substitution!.video_timestamp_ms!)}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">--:--</span>
                    )}
                  </td>
                  {/* Quarter */}
                  <td className="px-2 py-1.5 text-gray-600 font-medium">
                    {entry.quarter > 4 ? `OT${entry.quarter - 4}` : `Q${entry.quarter}`}
                  </td>
                  {/* Game clock */}
                  <td className="px-2 py-1.5 font-mono text-gray-500 text-xs">
                    {formatGameClock(entry.gameTimeMinutes, entry.gameTimeSeconds)}
                  </td>
                  {/* Player */}
                  <td className="px-2 py-1.5 font-medium text-gray-900 truncate max-w-[100px]">
                    {entry.type === 'stat' && entry.stat ? (
                      <span className={entry.stat.isOpponentStat ? 'text-red-600' : ''}>
                        {getStatDisplayName(entry.stat)}
                      </span>
                    ) : entry.type === 'substitution' ? (
                      <span className="text-purple-700 text-xs">
                        {entry.playerOutName} → {entry.playerInName}
                      </span>
                    ) : null}
                  </td>
                  {/* Stat type badge */}
                  <td className="px-2 py-1.5">
                    {entry.type === 'stat' && entry.stat ? (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatBadgeColor(entry.stat.statType, entry.stat.modifier)}`}>
                        {getStatLabel(entry.stat.statType, entry.stat.modifier)}
                      </span>
                    ) : entry.type === 'substitution' ? (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        SUB
                      </span>
                    ) : null}
                  </td>
                  {/* Actions */}
                  <td className="px-2 py-1.5">
                    {entry.type === 'stat' && entry.stat && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Mark at current position */}
                        {currentVideoTimeMs !== undefined && (
                          <button
                            onClick={() => handleMarkAtCurrentPosition(entry.stat!.id)}
                            className="p-1 hover:bg-green-100 rounded transition-colors"
                            title={`Mark at current position (${formatVideoTime(currentVideoTimeMs)})`}
                          >
                            <Crosshair className="w-3.5 h-3.5 text-green-600" />
                          </button>
                        )}
                        {/* Edit */}
                        <button
                          onClick={() => handleEditClick(entry.stat!)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit stat"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        {/* Delete */}
                        {deletingStatId === entry.stat.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.stat!.id)}
                              className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingStatId(null)}
                              className="px-1.5 py-0.5 bg-gray-300 text-gray-700 text-xs rounded"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingStatId(entry.stat!.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete stat"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    )}
                    {/* Substitution actions: Delete only */}
                    {entry.type === 'substitution' && entry.substitution && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {deletingSubId === entry.substitution.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteSubstitution(entry.substitution!.id)}
                              className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingSubId(null)}
                              className="px-1.5 py-0.5 bg-gray-300 text-gray-700 text-xs rounded"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingSubId(entry.substitution!.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Delete substitution"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Edit Stat</h3>
              <button
                onClick={() => setEditingStat(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <StatEditForm
              stat={editingStat}
              players={[...teamAPlayers, ...teamBPlayers]}
              onClose={() => setEditingStat(null)}
              onSuccess={handleEditSuccess}
              clockSyncConfig={clockSyncConfig}
            />
          </div>
        </div>
      )}
    </div>
  );
}
