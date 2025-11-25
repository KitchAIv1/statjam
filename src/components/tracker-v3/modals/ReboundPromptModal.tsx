'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * ReboundPromptModal - Prompt for rebound after missed shot
 * 
 * PURPOSE:
 * - Appears after missed field goal, 3-pointer, or free throw
 * - Allows user to select which player got the rebound
 * - Distinguishes between offensive and defensive rebounds
 * - Links rebound to miss via sequence_id
 * - Optional (can skip if no rebound)
 * 
 * PHASE 4: Play Sequences & Event Linking
 */

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  teamId: string;
}

interface ReboundPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (playerId: string, reboundType: 'offensive' | 'defensive') => void;
  onSkip: () => void;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  teamAId: string; // ✅ FIX: Add actual team IDs for proper comparison
  teamBId: string; // ✅ FIX: Add actual team IDs for proper comparison
  teamAName: string; // ✅ UI FIX: Add team names for display
  teamBName: string; // ✅ UI FIX: Add team names for display
  shooterTeamId: string;
  shooterName: string;
  shotType: string;
}

export function ReboundPromptModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onSkip,
  teamAPlayers,
  teamBPlayers,
  teamAId, // ✅ FIX: Add actual team IDs
  teamBId, // ✅ FIX: Add actual team IDs
  teamAName, // ✅ UI FIX: Team names for display
  teamBName, // ✅ UI FIX: Team names for display
  shooterTeamId,
  shooterName,
  shotType
}: ReboundPromptModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [reboundType, setReboundType] = useState<'offensive' | 'defensive' | null>(null);

  // ✅ FIX: Reset state when modal opens/closes to prevent stale data
  useEffect(() => {
    if (isOpen) {
      // Reset when modal opens
      setSelectedPlayerId(null);
      setReboundType(null);
      
      // 🔍 DEBUG: Log modal props when it opens
      console.log('🔍 [REBOUND MODAL OPEN]', {
        shooterTeamId,
        shooterName,
        shotType,
        teamAId,
        teamBId,
        teamAPlayersCount: teamAPlayers.length,
        teamBPlayersCount: teamBPlayers.length
      });
    }
  }, [isOpen, shooterTeamId, shooterName, shotType, teamAId, teamBId, teamAPlayers, teamBPlayers]);

  if (!isOpen) return null;

  const handlePlayerSelect = (playerId: string, playerTeamId: string) => {
    setSelectedPlayerId(playerId);
    
    // ✅ FIX: Determine rebound type based on which team array the player belongs to
    // Check if player is in teamA or teamB arrays
    const isTeamAPlayer = teamAPlayers.some(p => p.id === playerId);
    const isTeamBPlayer = teamBPlayers.some(p => p.id === playerId);
    
    // Get the actual team ID based on which array the player is in
    let actualPlayerTeamId: string | null = null;
    if (isTeamAPlayer) {
      actualPlayerTeamId = teamAId; // ✅ Use the actual teamAId prop
    } else if (isTeamBPlayer) {
      actualPlayerTeamId = teamBId; // ✅ Use the actual teamBId prop
    } else {
      // Fallback (shouldn't happen, but just in case)
      console.warn('⚠️ Player not found in either team array, using fallback');
      actualPlayerTeamId = playerTeamId;
    }
    
    // ✅ FIX: Compare actual team IDs (offensive = same team as shooter, defensive = different team)
    const isOffensiveRebound = actualPlayerTeamId === shooterTeamId;
    const determinedReboundType = isOffensiveRebound ? 'offensive' : 'defensive';
    setReboundType(determinedReboundType);
    
    // ✅ AUTO-SAVE: Auto-save immediately when player is selected (reboundType already determined)
    onSelectPlayer(playerId, determinedReboundType);
    setSelectedPlayerId(null);
    setReboundType(null);
    
    // 🔍 DEBUG: Log for troubleshooting
    console.log('🔍 [REBOUND DEBUG]', {
      playerId,
      isTeamAPlayer,
      isTeamBPlayer,
      actualPlayerTeamId,
      shooterTeamId,
      teamAId,
      teamBId,
      isOffensiveRebound,
      reboundType: determinedReboundType
    });
  };

  const handleSkip = () => {
    onSkip();
    setSelectedPlayerId(null);
    setReboundType(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedPlayerId(null);
    setReboundType(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
        style={{
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Rebound?</h2>
              <p className="text-sm text-gray-600">
                {shooterName} missed {shotType}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Player Lists (Two Columns) */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
        >
          <p className="text-sm text-gray-600 mb-4">
            Who got the rebound?
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Players */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {teamAName} (On Court) {teamAId === shooterTeamId ? '(Offense)' : '(Defense)'}
              </h3>
              <div className="space-y-2">
                {teamAPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id, player.teamId)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedPlayerId === player.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedPlayerId === player.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          #{player.jerseyNumber ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {player.name}
                        </span>
                      </div>
                      {selectedPlayerId === player.id && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Team B Players */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {teamBName} (On Court) {teamBId === shooterTeamId ? '(Offense)' : '(Defense)'}
              </h3>
              <div className="space-y-2">
                {teamBPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id, player.teamId)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedPlayerId === player.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            selectedPlayerId === player.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          #{player.jerseyNumber ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {player.name}
                        </span>
                      </div>
                      {selectedPlayerId === player.id && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rebound Type Indicator */}
          {reboundType && selectedPlayerId && (
            <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-sm font-medium text-orange-900">
                {reboundType === 'offensive' 
                  ? `⚡ Offensive Rebound (${teamAPlayers.some(p => p.id === selectedPlayerId) ? teamAName : teamBName})`
                  : `🛡️ Defensive Rebound (${teamAPlayers.some(p => p.id === selectedPlayerId) ? teamAName : teamBName})`
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions - Only Skip button (auto-save on selection) */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 py-3 text-base font-semibold"
          >
            No Rebound
          </Button>
        </div>
      </div>
    </div>
  );
}

