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

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Clock, Trash2, Play, Edit, Filter, X, RefreshCw } from 'lucide-react';
import { VideoStatService } from '@/lib/services/videoStatService';
import { StatEditServiceV2 } from '@/lib/services/statEditServiceV2';
import { SubstitutionsService, SubstitutionRow } from '@/lib/services/substitutionsService';
import { StatEditForm } from '@/components/tracker-v3/modals/StatEditForm';
import type { VideoStat } from '@/lib/types/video';
import type { GameStatRecord } from '@/lib/services/statEditService';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface VideoStatsTimelineProps {
  gameId: string;
  onSeekToTimestamp: (timestampMs: number) => void;
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
  const [loading, setLoading] = useState(true);
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [editingStat, setEditingStat] = useState<GameStatRecord | null>(null);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);

  // Helper to get player name by ID
  const getPlayerNameById = useCallback((playerId: string | null, customPlayerId: string | null): string => {
    if (!playerId && !customPlayerId) return 'Unknown';
    const allPlayers = [...teamAPlayers, ...teamBPlayers];
    const player = allPlayers.find(p => p.id === playerId || p.id === customPlayerId);
    return player?.name || 'Unknown';
  }, [teamAPlayers, teamBPlayers]);

  // Load stats and substitutions
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [videoStats, subs] = await Promise.all([
        VideoStatService.getVideoStats(gameId),
        SubstitutionsService.getByGameId(gameId),
      ]);
      setStats(videoStats);
      setSubstitutions(subs);
    } catch (error) {
      console.error('Error loading video stats:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

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

  // Handle delete stat
  const handleDelete = useCallback(async (statId: string) => {
    try {
      await StatEditServiceV2.deleteStat(statId, gameId);
      setDeletingStatId(null);
      await loadStats();
    } catch (error) {
      console.error('Error deleting stat:', error);
      alert('Failed to delete stat');
      setDeletingStatId(null);
    }
  }, [gameId, loadStats]);

  // Handle delete substitution
  const handleDeleteSubstitution = useCallback(async (subId: string) => {
    try {
      const success = await SubstitutionsService.deleteSubstitution(subId);
      if (success) {
        setDeletingSubId(null);
        await loadStats();
      } else {
        alert('Failed to delete substitution');
        setDeletingSubId(null);
      }
    } catch (error) {
      console.error('Error deleting substitution:', error);
      alert('Failed to delete substitution');
      setDeletingSubId(null);
    }
  }, [loadStats]);

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
    };
    setEditingStat(gameStatRecord);
  }, [gameId]);

  // Handle edit success
  const handleEditSuccess = useCallback(async () => {
    setEditingStat(null);
    await loadStats();
  }, [loadStats]);

  if (loading) {
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
        <span className="text-xs text-gray-500">
          {filteredEntries.length} entries
        </span>
      </div>

      {/* Stats table */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No stats recorded yet</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-60">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-2 py-1.5 font-medium">Video</th>
                <th className="px-2 py-1.5 font-medium">Q</th>
                <th className="px-2 py-1.5 font-medium">Time</th>
                <th className="px-2 py-1.5 font-medium">Player</th>
                <th className="px-2 py-1.5 font-medium">Action</th>
                <th className="px-2 py-1.5 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 group">
                  {/* Video timestamp - clickable (stats and substitutions with video timestamps) */}
                  <td className="px-2 py-1.5">
                    {entry.type === 'stat' && entry.stat?.videoTimestampMs ? (
                      <button
                        onClick={() => onSeekToTimestamp(entry.stat!.videoTimestampMs)}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded text-xs font-mono transition-colors"
                        title="Jump to this moment"
                      >
                        <Play className="w-3 h-3" />
                        {formatVideoTime(entry.stat!.videoTimestampMs)}
                      </button>
                    ) : entry.type === 'substitution' && entry.substitution?.video_timestamp_ms ? (
                      <button
                        onClick={() => onSeekToTimestamp(entry.substitution!.video_timestamp_ms!)}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded text-xs font-mono transition-colors"
                        title="Jump to this moment"
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
              ))}
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
            />
          </div>
        </div>
      )}
    </div>
  );
}
