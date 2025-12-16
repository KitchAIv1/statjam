/**
 * StatEditTable - Stats Table Display Component
 * 
 * PURPOSE: Extract stats table from StatEditModal to keep it under 200 lines
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useMemo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { GameStatRecord } from '@/lib/services/statEditService';

interface Player {
  id: string;
  name: string;
}

interface StatEditTableProps {
  filteredStats: GameStatRecord[];
  loading: boolean;
  allPlayers: Player[];
  onEdit: (stat: GameStatRecord) => void;
  onDelete: (statId: string) => void;
  getPlayerName: (stat: GameStatRecord) => string;
  formatStatDisplay: (stat: GameStatRecord) => string;
  teamAId?: string;
  teamBId?: string;
  isCoachMode?: boolean;
}

// Calculate running scores for stats (sorted oldest-first for calculation)
function calculateRunningScores(
  stats: GameStatRecord[], 
  teamAId?: string, 
  teamBId?: string,
  isCoachMode?: boolean
): Map<string, { home: number; away: number }> {
  const scoreMap = new Map<string, { home: number; away: number }>();
  if (!teamAId) return scoreMap;
  
  // Sort chronologically by GAME TIME (oldest first) for accurate score calculation
  // Quarter ascending (Q1 before Q2), then minutes DESC (10:00 before 9:00), then seconds DESC
  const sorted = [...stats].sort((a, b) => 
    a.quarter - b.quarter || 
    b.game_time_minutes - a.game_time_minutes || 
    b.game_time_seconds - a.game_time_seconds ||
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  let homeScore = 0;
  let awayScore = 0;
  
  sorted.forEach(stat => {
    let points = 0;
    if (stat.modifier === 'made') {
      if (stat.stat_type === 'field_goal') points = 2;
      else if (stat.stat_type === 'three_pointer') points = 3;
      else if (stat.stat_type === 'free_throw') points = 1;
    }
    
    if (points > 0) {
      // Coach mode: use is_opponent_stat flag (team + opponent share same team_id)
      // Regular mode: use team_id comparison
      if (isCoachMode) {
        if (stat.is_opponent_stat) awayScore += points;
        else homeScore += points;
      } else {
        if (stat.team_id === teamAId) homeScore += points;
        else if (stat.team_id === teamBId) awayScore += points;
      }
    }
    
    scoreMap.set(stat.id, { home: homeScore, away: awayScore });
  });
  
  return scoreMap;
}

export function StatEditTable({
  filteredStats,
  loading,
  allPlayers,
  onEdit,
  onDelete,
  getPlayerName,
  formatStatDisplay,
  teamAId,
  teamBId,
  isCoachMode = false
}: StatEditTableProps) {
  // Calculate running scores for shot events
  const runningScores = useMemo(
    () => calculateRunningScores(filteredStats, teamAId, teamBId, isCoachMode),
    [filteredStats, teamAId, teamBId, isCoachMode]
  );
  
  const isShotStat = (stat: GameStatRecord) => 
    ['field_goal', 'three_pointer', 'free_throw'].includes(stat.stat_type);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">Loading stats...</div>
      </div>
    );
  }

  if (filteredStats.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">No stats recorded yet</div>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Q</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Player</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Score</th>
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Edit</th>
        </tr>
      </thead>
      <tbody>
        {filteredStats.map((stat, index) => {
          const score = runningScores.get(stat.id);
          return (
            <tr 
              key={stat.id}
              className={`border-b border-gray-100 hover:bg-purple-50 transition-colors ${
                index === 0 ? 'bg-orange-50' : ''
              }`}
            >
              <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                {String(stat.game_time_minutes).padStart(2, '0')}:{String(stat.game_time_seconds).padStart(2, '0')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{stat.quarter}</td>
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{getPlayerName(stat)}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{formatStatDisplay(stat)}</td>
              <td className="px-4 py-3 text-center">
                {isShotStat(stat) && score ? (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                    stat.modifier === 'made' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {score.home}-{score.away}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {stat.stat_type !== 'timeout' && stat.stat_type !== 'substitution' && (
                    <button
                      onClick={() => onEdit(stat)}
                      className="p-1.5 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {!stat.is_game_level_stat && stat.stat_type !== 'timeout' && stat.stat_type !== 'substitution' && (
                    <button
                      onClick={() => onDelete(stat.id)}
                      className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

