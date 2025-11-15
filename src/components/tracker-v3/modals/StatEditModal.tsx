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
import { X, Edit, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatEditService, GameStatRecord } from '@/lib/services/statEditService';
import { StatEditForm } from './StatEditForm';
import { StatEditTable } from './StatEditTable';
import { TeamStatsTabLight } from './TeamStatsTabLight';
import { cache, CacheKeys } from '@/lib/utils/cache';

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
  teamAId?: string;
  teamBId?: string;
  teamAName?: string;
  teamBName?: string;
}

export function StatEditModal({
  isOpen,
  onClose,
  gameId,
  teamAPlayers,
  teamBPlayers,
  teamAId,
  teamBId,
  teamAName = 'Team A',
  teamBName = 'Team B'
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
    const stat = gameStats.find(s => s.id === statId);
    
    // Handle timeout events (from game_timeouts table)
    if (stat?.stat_type === 'timeout') {
      // Extract the actual timeout ID from the synthetic ID
      const actualTimeoutId = statId.replace('timeout_', '');
      try {
        const accessToken = localStorage.getItem('sb-access-token');
        if (!accessToken) {
          throw new Error('Not authenticated');
        }

        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/game_timeouts?id=eq.${actualTimeoutId}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete timeout: ${response.status}`);
        }

        // Refresh stats after deletion
        fetchStats();
        setDeletingStatId(null);
        
        // ✅ Invalidate team stats cache
        if (teamAId) cache.delete(CacheKeys.teamStats(gameId, teamAId));
        if (teamBId) cache.delete(CacheKeys.teamStats(gameId, teamBId));
      } catch (error) {
        console.error('Failed to delete timeout:', error);
        alert('Failed to delete timeout. Please try again.');
        setDeletingStatId(null);
      }
      return;
    }

    // Regular stat deletion
    try {
      await StatEditService.deleteStat(statId);
      setGameStats(prev => prev.filter(s => s.id !== statId));
      setDeletingStatId(null);
      
      // ✅ Invalidate team stats cache for both teams
      if (teamAId) {
        cache.delete(CacheKeys.teamStats(gameId, teamAId));
      }
      if (teamBId) {
        cache.delete(CacheKeys.teamStats(gameId, teamBId));
      }
    } catch (error) {
      console.error('Failed to delete stat:', error);
      alert('Failed to delete stat. Please try again.');
    }
  };

  const handleUpdateSuccess = () => {
    fetchStats();
    setEditingStat(null);
    
    // ✅ Invalidate team stats cache for both teams after edit
    if (teamAId) {
      cache.delete(CacheKeys.teamStats(gameId, teamAId));
    }
    if (teamBId) {
      cache.delete(CacheKeys.teamStats(gameId, teamBId));
    }
  };

  const getPlayerName = (stat: GameStatRecord): string => {
    // Handle timeout events (team-level events)
    if (stat.stat_type === 'timeout') {
      return stat.team_side === 'A' ? teamAName : teamBName;
    }
    
    if (stat.is_opponent_stat) return 'Opponent Team';
    const player = allPlayers.find(p => p.id === stat.player_id || p.id === stat.custom_player_id);
    return player?.name || 'Unknown Player';
  };

  const formatStatDisplay = (stat: GameStatRecord): string => {
    // Handle timeout events (from game_timeouts table)
    if (stat.stat_type === 'timeout') {
      const timeoutType = stat.modifier === '30_second' ? '30-SECOND' : 'FULL';
      return `TIMEOUT (${timeoutType})`;
    }
    
    // ✅ FIX: Show "SHOOTING FOUL" clearly for shooting fouls
    if (stat.stat_type === 'foul' && stat.modifier === 'shooting') {
      const value = stat.stat_value > 0 ? ` +${stat.stat_value}` : '';
      return `SHOOTING FOUL${value}`;
    }
    
    // ✅ FIX: Show rebound type clearly (OFFENSIVE/DEFENSIVE)
    if (stat.stat_type === 'rebound') {
      const reboundType = stat.modifier?.toLowerCase();
      if (reboundType === 'offensive') {
        return 'REBOUND (OFFENSIVE)';
      } else if (reboundType === 'defensive') {
        return 'REBOUND (DEFENSIVE)';
      } else {
        // Fallback if modifier is missing or invalid
        return 'REBOUND (UNKNOWN)';
      }
    }
    
    const type = stat.stat_type.replace(/_/g, ' ').toUpperCase();
    const modifier = stat.modifier ? ` (${stat.modifier.toUpperCase()})` : '';
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

        {/* Tabs */}
        <Tabs defaultValue="stats" className="flex flex-col flex-1 min-h-0">
          <div className="border-b border-gray-200 bg-gray-50 px-4">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-3"
              >
                Stats
              </TabsTrigger>
              {teamAId && (
                <TabsTrigger 
                  value="teamA" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-3"
                >
                  {teamAName}
                </TabsTrigger>
              )}
              {teamBId && (
                <TabsTrigger 
                  value="teamB" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none border-b-2 border-transparent px-4 py-3"
                >
                  {teamBName}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Stats Tab */}
          <TabsContent value="stats" className="flex-1 overflow-y-auto mt-0">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
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
              <StatEditTable
                filteredStats={filteredStats}
                loading={loading}
                allPlayers={allPlayers}
                onEdit={setEditingStat}
                onDelete={setDeletingStatId}
                getPlayerName={getPlayerName}
                formatStatDisplay={formatStatDisplay}
              />
            </div>
          </TabsContent>

          {/* Team A Tab */}
          {teamAId && (
            <TabsContent value="teamA" className="flex-1 overflow-y-auto mt-0">
              <TeamStatsTabLight
                gameId={gameId}
                teamId={teamAId}
                teamName={teamAName}
              />
            </TabsContent>
          )}

          {/* Team B Tab */}
          {teamBId && (
            <TabsContent value="teamB" className="flex-1 overflow-y-auto mt-0">
              <TeamStatsTabLight
                gameId={gameId}
                teamId={teamBId}
                teamName={teamBName}
              />
            </TabsContent>
          )}
        </Tabs>
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

