/**
 * CoachTeamsList - Teams overview component
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */

'use client';

import { Users, Gamepad2, Calendar, Mail } from 'lucide-react';
import { CoachTeam } from '@/lib/services/coachUsageService';

interface CoachTeamsListProps {
  teams: CoachTeam[];
}

export function CoachTeamsList({ teams }: CoachTeamsListProps) {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Coach Teams (Recent)
        </h3>
      </div>

      {/* Teams List */}
      <div className="divide-y divide-gray-100">
        {teams.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No teams created yet. Create a team in coach mode!
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900">
                  {team.name}
                </span>
              </div>
              
              {/* Coach Email */}
              {team.coachEmail && (
                <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                  <Mail className="w-3 h-3" />
                  <a href={`mailto:${team.coachEmail}`} className="hover:underline">
                    {team.coachEmail}
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team.playerCount} players
                </span>
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" />
                  {team.gamesPlayed} games
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(team.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

