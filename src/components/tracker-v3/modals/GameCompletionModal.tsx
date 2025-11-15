/**
 * GameCompletionModal - Final Game Completion with Awards Selection
 * 
 * PURPOSE: Modal shown before game completion to select awards
 * - Shows winning team stats (reuses TeamStatsTab)
 * - Two award selection sections with auto-suggest
 * - Blocks completion until both awards selected
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TeamStatsTab } from '@/app/game-viewer/[gameId]/components/TeamStatsTab';
import { AwardSelectionSection } from './AwardSelectionSection';
import { AwardSuggestionService } from '@/lib/services/awardSuggestionService';
import { GameAwardsService } from '@/lib/services/gameAwardsService';
import { TeamStatsService, PlayerStats } from '@/lib/services/teamStatsService';
import { TeamServiceV3 } from '@/lib/services/teamServiceV3';
import { Loader2 } from 'lucide-react';

export interface GameCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (awards: { playerOfTheGameId: string; hustlePlayerId: string }) => Promise<void>;
  gameId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
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
  teamBScore
}: GameCompletionModalProps) {
  const [selectedPlayerOfGame, setSelectedPlayerOfGame] = useState<string | null>(null);
  const [selectedHustlePlayer, setSelectedHustlePlayer] = useState<string | null>(null);
  const [suggestedPlayerOfGame, setSuggestedPlayerOfGame] = useState<string | null>(null);
  const [suggestedHustlePlayer, setSuggestedHustlePlayer] = useState<string | null>(null);
  const [winningTeamPlayers, setWinningTeamPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const winningTeamId = teamAScore > teamBScore ? teamAId : teamBId;
  const winningTeamName = teamAScore > teamBScore ? teamAName : teamBName;

  // Load winning team players and auto-suggest on open
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setSelectedPlayerOfGame(null);
      setSelectedHustlePlayer(null);
      setSuggestedPlayerOfGame(null);
      setSuggestedHustlePlayer(null);
      setWinningTeamPlayers([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch winning team roster and stats
        const teamRoster = await TeamServiceV3.getTeamPlayersWithSubstitutions(winningTeamId, gameId);
        const playerIds = teamRoster.map(p => p.id);
        const playerStats = await TeamStatsService.aggregatePlayerStats(gameId, winningTeamId, playerIds);
        
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
      await onComplete({
        playerOfTheGameId: selectedPlayerOfGame,
        hustlePlayerId: selectedHustlePlayer
      });
      onClose();
    } catch (error) {
      console.error('Failed to complete game:', error);
      alert('Failed to complete game. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const canComplete = selectedPlayerOfGame && selectedHustlePlayer;

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

