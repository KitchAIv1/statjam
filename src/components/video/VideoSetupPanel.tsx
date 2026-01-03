'use client';

/**
 * VideoSetupPanel - Pre-flight setup for video tracking
 * 
 * Displays game details, score input, and player roster with editable jerseys.
 * User completes setup before uploading video.
 * 
 * Theme: Warm cream (matches coach dashboard)
 * Layout: Inline sections (not modal-like)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { EditableJerseyNumber } from '@/components/tracker-v3/EditableJerseyNumber';
import { 
  Video, Users, Trophy, Calendar, ArrowRight, Loader2, AlertCircle
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface GameData {
  id: string;
  opponent_name?: string;
  game_date?: string;
  venue?: string;
  home_score?: number;
  away_score?: number;
  team_a_name?: string;
}

interface VideoSetupPanelProps {
  gameData: GameData;
  teamPlayers: Player[];
  onPlayersUpdate: (players: Player[]) => void;
  onSetupComplete: () => void;
  onGameDataUpdate?: (data: Partial<GameData>) => void;
  /** Optional callback to save score - if not provided, skips saving */
  onSaveScore?: (gameId: string, homeScore?: number, awayScore?: number) => Promise<void>;
}

export function VideoSetupPanel({
  gameData,
  teamPlayers,
  onPlayersUpdate,
  onSetupComplete,
  onGameDataUpdate,
  onSaveScore,
}: VideoSetupPanelProps) {
  const [homeScore, setHomeScore] = useState<string>(gameData.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState<string>(gameData.away_score?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handlePlayerUpdate = (playerId: string, updatedPlayer: Player) => {
    const updated = teamPlayers.map(p => 
      p.id === playerId ? updatedPlayer : p
    );
    onPlayersUpdate(updated);
  };

  const handleContinue = async () => {
    setSaveError(null);

    // Validate final score is entered (mandatory for tracking)
    const homeScoreNum = homeScore ? parseInt(homeScore, 10) : 0;
    const awayScoreNum = awayScore ? parseInt(awayScore, 10) : 0;
    
    if (homeScoreNum === 0 && awayScoreNum === 0) {
      setSaveError('Please enter the final score. Both teams cannot have 0 points for video tracking.');
      return;
    }

    setIsSaving(true);

    try {
      // Save score if callback provided
      if (onSaveScore) {
        await onSaveScore(gameData.id, homeScoreNum, awayScoreNum);
        onGameDataUpdate?.({ home_score: homeScoreNum, away_score: awayScoreNum });
      }

      onSetupComplete();
    } catch (error) {
      console.error('Error saving game data:', error);
      setSaveError('Failed to save game data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Video Tracking Setup</h2>
        <p className="text-muted-foreground mt-2">
          Review game details and player jerseys before uploading video
        </p>
      </div>

      {/* Game Details Card */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
          <div className="flex items-center gap-2 text-orange-700">
            <Trophy className="w-4 h-4" />
            <span className="font-semibold text-sm">Game Details</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Your Team</span>
              <p className="text-foreground font-semibold mt-1">{gameData.team_a_name || 'My Team'}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Opponent</span>
              <p className="text-foreground font-semibold mt-1">{gameData.opponent_name || 'Opponent'}</p>
            </div>
          </div>
          
          {gameData.game_date && (
            <div className="flex items-center gap-2 text-muted-foreground mt-4 pt-4 border-t border-gray-100">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{new Date(gameData.game_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Score Input Card - REQUIRED */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">Final Score</span>
            </div>
            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
              Required
            </span>
          </div>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-muted-foreground text-center mb-4">
            Enter the final score for accurate stat tracking
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <label className="block text-xs font-medium text-foreground mb-2">
                {gameData.team_a_name || 'Your Team'}
              </label>
              <Input
                type="number"
                min="0"
                max="999"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-24 h-14 text-center text-2xl font-bold border-2 border-orange-200 
                           focus:border-orange-500 focus:ring-orange-500 bg-orange-50/50"
                placeholder="--"
              />
            </div>
            
            <span className="text-2xl font-bold text-muted-foreground mt-6">vs</span>
            
            <div className="text-center">
              <label className="block text-xs font-medium text-foreground mb-2">
                {gameData.opponent_name || 'Opponent'}
              </label>
              <Input
                type="number"
                min="0"
                max="999"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-24 h-14 text-center text-2xl font-bold border-2 border-orange-200 
                           focus:border-orange-500 focus:ring-orange-500 bg-orange-50/50"
                placeholder="--"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Player Roster Card */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
          <div className="flex items-center gap-2 text-orange-700">
            <Users className="w-4 h-4" />
            <span className="font-semibold text-sm">Player Roster - Click to Edit Jersey</span>
          </div>
        </div>
        
        <div className="p-4">
          {teamPlayers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No players found. Add players to your team first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {teamPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg 
                             border border-gray-100 hover:border-orange-200 transition-colors"
                >
                  <EditableJerseyNumber
                    player={player}
                    onUpdate={handlePlayerUpdate}
                  />
                  <span className="text-foreground text-xs font-medium text-center truncate w-full">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm text-center">
          {saveError}
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={isSaving}
        className="w-full gap-2 h-12 text-base"
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
        {isSaving ? 'Saving...' : 'Continue to Upload Video'}
      </Button>
    </div>
  );
}
