/**
 * GameCompletionModal - Final Game Completion with Awards Selection
 * 
 * PURPOSE: Modal shown before game completion to select awards
 * - Shows winning team stats (reuses TeamStatsTab)
 * - Two award selection sections with auto-suggest
 * - Blocks completion until both awards selected
 * - ✅ SUPPORTS CUSTOM PLAYERS (Nov 2025)
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, PlayCircle, Home, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TeamStatsTab } from '@/app/game-viewer/[gameId]/components/TeamStatsTab';
import { AwardSelectionSection } from './AwardSelectionSection';
import { CoachFinalScoreSection } from './CoachFinalScoreSection';
import { AwardSuggestionService } from '@/lib/services/awardSuggestionService';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { TeamStatsService, PlayerStats } from '@/lib/services/teamStatsService';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { Loader2 } from 'lucide-react';

// ✅ Updated interface to include custom player flags and coach mode
export interface GameCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (awards: { 
    playerOfTheGameId: string; 
    hustlePlayerId: string;
    isPlayerOfGameCustom?: boolean;
    isHustlePlayerCustom?: boolean;
    finalOpponentScore?: number;  // ✅ Coach mode: final opponent score
  }) => Promise<void>;
  gameId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  isCoachGame?: boolean;  // ✅ Coach mode flag
  opponentName?: string;  // ✅ Coach mode: opponent name
  onTrackAnother?: () => void;  // ✅ Quick restart: callback to start new game
}

export function GameCompletionModal({
  isOpen,
  onClose,
  onComplete,
  gameId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  isCoachGame = false,
  opponentName = 'Opponent',
  onTrackAnother
}: GameCompletionModalProps) {
  const [selectedPlayerOfGame, setSelectedPlayerOfGame] = useState<string | null>(null);
  const [selectedHustlePlayer, setSelectedHustlePlayer] = useState<string | null>(null);
  const [suggestedPlayerOfGame, setSuggestedPlayerOfGame] = useState<string | null>(null);
  const [suggestedHustlePlayer, setSuggestedHustlePlayer] = useState<string | null>(null);
  const [winningTeamPlayers, setWinningTeamPlayers] = useState<PlayerStats[]>([]);
  // ✅ NEW: Store roster with custom player info
  const [rosterWithCustomInfo, setRosterWithCustomInfo] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // ✅ Success state for quick actions
  // ✅ Coach mode: editable opponent score
  const [finalOpponentScore, setFinalOpponentScore] = useState<number>(teamBScore);

  // For coach mode, team A is always the coach's team
  const winningTeamId = isCoachGame ? teamAId : (teamAScore > teamBScore ? teamAId : teamBId);
  const winningTeamName = isCoachGame ? teamAName : (teamAScore > teamBScore ? teamAName : teamBName);

  // Load winning team players and auto-suggest on open
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setSelectedPlayerOfGame(null);
      setSelectedHustlePlayer(null);
      setSuggestedPlayerOfGame(null);
      setSuggestedHustlePlayer(null);
      setWinningTeamPlayers([]);
      setRosterWithCustomInfo(new Map());
      setFinalOpponentScore(teamBScore); // Reset to current opponent score
      setShowSuccess(false); // Reset success state
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch winning team roster and stats
        const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(winningTeamId, gameId);
        const playerIds = teamRoster.map(p => p.id);
        const playerStats = await TeamStatsService.aggregatePlayerStats(gameId, winningTeamId, playerIds);
        
        // ✅ Build map of player ID → is_custom_player
        const customInfoMap = new Map<string, boolean>();
        teamRoster.forEach(player => {
          customInfoMap.set(player.id, player.is_custom_player === true);
        });
        setRosterWithCustomInfo(customInfoMap);
        
        setWinningTeamPlayers(playerStats);

        // Auto-suggest awards
        setSuggesting(true);
        const suggestions = await AwardSuggestionService.suggestBothAwards(gameId, winningTeamId);
        
        if (suggestions.playerOfTheGame) {
          setSuggestedPlayerOfGame(suggestions.playerOfTheGame.playerId);
          setSelectedPlayerOfGame(suggestions.playerOfTheGame.playerId);
        }
        
        if (suggestions.hustlePlayer) {
          setSuggestedHustlePlayer(suggestions.hustlePlayer.playerId);
          setSelectedHustlePlayer(suggestions.hustlePlayer.playerId);
        }
      } catch (error) {
        console.error('Failed to load award data:', error);
      } finally {
        setLoading(false);
        setSuggesting(false);
      }
    };

    loadData();
  }, [isOpen, gameId, winningTeamId]);

  const handleComplete = async () => {
    if (!selectedPlayerOfGame || !selectedHustlePlayer) {
      return;
    }

    setSaving(true);
    try {
      // ✅ Look up if selected players are custom
      const isPlayerOfGameCustom = rosterWithCustomInfo.get(selectedPlayerOfGame) || false;
      const isHustlePlayerCustom = rosterWithCustomInfo.get(selectedHustlePlayer) || false;
      
      console.log('🏆 GameCompletionModal: Completing with awards', {
        playerOfGame: selectedPlayerOfGame,
        isPlayerOfGameCustom,
        hustlePlayer: selectedHustlePlayer,
        isHustlePlayerCustom,
        ...(isCoachGame && { finalOpponentScore })
      });

      await onComplete({
        playerOfTheGameId: selectedPlayerOfGame,
        hustlePlayerId: selectedHustlePlayer,
        isPlayerOfGameCustom,
        isHustlePlayerCustom,
        ...(isCoachGame && { finalOpponentScore })
      });
      
      // ✅ Show success state with quick actions (coach mode only)
      if (isCoachGame && onTrackAnother) {
        setShowSuccess(true);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to complete game:', error);
      alert('Failed to complete game. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const canComplete = selectedPlayerOfGame && selectedHustlePlayer;

  // ✅ Success state with quick actions (coach mode)
  if (showSuccess && isCoachGame) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          {/* Success Header */}
          <div className="text-center pt-8 pb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <Trophy className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Game Complete!</h2>
            <p className="text-green-200 text-sm mt-1">
              {teamAName} vs {opponentName}
            </p>
            <p className="text-white font-bold text-xl mt-2">
              {teamAScore} - {finalOpponentScore}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="px-6 pb-8">
            <p className="text-center text-green-200 text-sm mb-6">
              What would you like to do next?
            </p>
            
            <div className="space-y-3">
              {onTrackAnother && (
                <button
                  onClick={onTrackAnother}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  Track Another Game
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20"
              >
                <Home className="w-5 h-5" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Game</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select awards for {winningTeamName} (Winner)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* ✅ Coach Mode: Final Score Section */}
              {isCoachGame && (
                <CoachFinalScoreSection
                  teamName={teamAName}
                  teamScore={teamAScore}
                  opponentName={opponentName}
                  opponentScore={finalOpponentScore}
                  onOpponentScoreChange={setFinalOpponentScore}
                />
              )}

              {/* Winning Team Stats */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-purple-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">{winningTeamName} Statistics</h3>
                </div>
                <div className="bg-gray-900">
                  <TeamStatsTab
                    gameId={gameId}
                    teamId={winningTeamId}
                    teamName={winningTeamName}
                  />
                </div>
              </div>

              {/* Award Selections */}
              <div className="grid md:grid-cols-2 gap-6">
                <AwardSelectionSection
                  awardType="player_of_the_game"
                  players={winningTeamPlayers}
                  selectedPlayerId={selectedPlayerOfGame}
                  suggestedPlayerId={suggestedPlayerOfGame}
                  onSelect={setSelectedPlayerOfGame}
                  teamName={winningTeamName}
                />

                <AwardSelectionSection
                  awardType="hustle_player"
                  players={winningTeamPlayers}
                  selectedPlayerId={selectedHustlePlayer}
                  suggestedPlayerId={suggestedHustlePlayer}
                  onSelect={setSelectedHustlePlayer}
                  teamName={winningTeamName}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={!canComplete || saving || loading}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete Game
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

