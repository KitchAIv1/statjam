'use client';

/**
 * TeamsStrip - Horizontal scrollable team cards container
 * 
 * Displays compact team cards in a horizontal strip with scroll.
 * Includes "Add Team" CTA at the end.
 * 
 * Follows .cursorrules: <100 lines, UI only, single responsibility
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CoachTeam } from '@/lib/types/coach';
import { CompactTeamCard } from './CompactTeamCard';

interface TeamsStripProps {
  teams: CoachTeam[];
  loading: boolean;
  hasVideoAccess: boolean;
  onQuickTrack: (team: CoachTeam) => void;
  onVideoTrack: (team: CoachTeam) => void;
  onManage: (team: CoachTeam) => void;
  onAnalytics: (team: CoachTeam) => void;
  onJoinTournament: (team: CoachTeam) => void;
  onViewGames: (team: CoachTeam) => void;
  onSeasons: (team: CoachTeam) => void;
  onCreateTeam: () => void;
}

export function TeamsStrip({
  teams,
  loading,
  hasVideoAccess,
  onQuickTrack,
  onVideoTrack,
  onManage,
  onAnalytics,
  onJoinTournament,
  onViewGames,
  onSeasons,
  onCreateTeam,
}: TeamsStripProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-600" />
          My Teams
          {!loading && <span className="text-xs font-normal text-gray-400">({teams.length})</span>}
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCreateTeam} 
          className="h-6 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Team
        </Button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[160px] h-[140px] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mb-3">No teams yet</p>
          <Button onClick={onCreateTeam} size="sm" className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Create First Team
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {teams.map((team) => (
            <CompactTeamCard
              key={team.id}
              team={team}
              hasVideoAccess={hasVideoAccess}
              onQuickTrack={onQuickTrack}
              onVideoTrack={onVideoTrack}
              onManage={onManage}
              onAnalytics={onAnalytics}
              onJoinTournament={onJoinTournament}
              onViewGames={onViewGames}
              onSeasons={onSeasons}
            />
          ))}
          
          {/* Add Team CTA Card */}
          <div 
            onClick={onCreateTeam}
            className="flex-shrink-0 w-[160px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
              <Plus className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-500">Add Team</span>
          </div>
        </div>
      )}
    </div>
  );
}

