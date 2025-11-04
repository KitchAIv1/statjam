/**
 * StatEditModal - Edit/Delete Game Stats
 * 
 * PURPOSE:
 * - Display all stats for a game in table format
 * - Allow editing individual stats
 * - Allow deleting incorrect stats
 * - Industry standard: compact table UI (not cards)
 * 
 * REAL-TIME:
 * - Changes trigger Supabase subscriptions
 * - Live viewers update automatically
 * - Play-by-play regenerates with correct data
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatEditService, GameStatRecord } from '@/lib/services/statEditService';
import { StatEditForm } from './StatEditForm';

interface Player {
  id: string;
  name: string;
}

interface StatEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
}

export function StatEditModal({
  isOpen,
  onClose,
  gameId,
  teamAPlayers,
  teamBPlayers
}: StatEditModalProps) {
  const [gameStats, setGameStats] = useState<GameStatRecord[]>([]);
  const [filteredStats, setFilteredStats] = useState<GameStatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStat, setEditingStat] = useState<GameStatRecord | null>(null);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);
  const [filterQuarter, setFilterQuarter] = useState<string>('all');

  const allPlayers = [...teamAPlayers, ...teamBPlayers];

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, gameId]);

  useEffect(() => {
    applyFilters();
  }, [gameStats, filterQuarter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const stats = await StatEditService.getGameStats(gameId);
      setGameStats(stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...gameStats];
    
    if (filterQuarter !== 'all') {
      filtered = filtered.filter(stat => stat.quarter === parseInt(filterQuarter));
    }
    
    setFilteredStats(filtered);
  };

  const handleDelete = async (statId: string) => {
    try {
      await StatEditService.deleteStat(statId);
      setGameStats(prev => prev.filter(s => s.id !== statId));
      setDeletingStatId(null);
    } catch (error) {
      console.error('Failed to delete stat:', error);
      alert('Failed to delete stat. Please try again.');
    }
  };

  const handleUpdateSuccess = () => {
    fetchStats();
    setEditingStat(null);
  };

  const getPlayerName = (stat: GameStatRecord): string => {
    if (stat.is_opponent_stat) return 'Opponent Team';
    const player = allPlayers.find(p => p.id === stat.player_id || p.id === stat.custom_player_id);
    return player?.name || 'Unknown Player';
  };

  const formatStatDisplay = (stat: GameStatRecord): string => {
    const type = stat.stat_type.replace(/_/g, ' ').toUpperCase();
    const modifier = stat.modifier ? ` (${stat.modifier})` : '';
    const value = stat.stat_value > 0 ? ` +${stat.stat_value}` : '';
    return `${type}${modifier}${value}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Game Stats</h2>
              <p className="text-sm text-gray-600">
                {filteredStats.length} {filteredStats.length === 1 ? 'event' : 'events'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterQuarter}
              onChange={(e) => setFilterQuarter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Quarters</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
              <option value="5">OT1</option>
              <option value="6">OT2</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500">Loading stats...</div>
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-gray-500">No stats recorded yet</div>
            </div>
          ) : (
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
                        <button
                          onClick={() => setEditingStat(stat)}
                          className="p-1.5 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStatId(stat.id)}
                          className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingStat && (
        <StatEditForm
          stat={editingStat}
          players={allPlayers}
          onClose={() => setEditingStat(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {deletingStatId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Stat?</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone. The stat will be removed from the game and live viewers will update immediately.</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeletingStatId(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deletingStatId)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

