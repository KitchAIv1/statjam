/**
 * StatEditTable - Stats Table Display Component
 * 
 * PURPOSE: Extract stats table from StatEditModal to keep it under 200 lines
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React from 'react';
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
}

export function StatEditTable({
  filteredStats,
  loading,
  allPlayers,
  onEdit,
  onDelete,
  getPlayerName,
  formatStatDisplay
}: StatEditTableProps) {
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
          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Edit</th>
        </tr>
      </thead>
      <tbody>
        {filteredStats.map((stat, index) => (
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
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                {/* Hide edit button for timeout events (read-only) */}
                {stat.stat_type !== 'timeout' && (
                  <button
                    onClick={() => onEdit(stat)}
                    className="p-1.5 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {/* Hide delete button for game-level stats, but allow deletion of timeout events */}
                {!stat.is_game_level_stat && (
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
        ))}
      </tbody>
    </table>
  );
}

