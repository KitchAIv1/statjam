'use client';

/**
 * VideoInlinePrompt - Non-blocking inline prompt for video stat sequences
 * 
 * Displays assist/rebound/turnover prompts inline without blocking keyboard.
 * User can press number keys to select player or Esc to skip.
 * 
 * @module VideoInlinePrompt
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, XCircle, ArrowRightLeft, Shield } from 'lucide-react';
import type { PromptType } from '@/hooks/useVideoStatPrompts';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface VideoInlinePromptProps {
  promptType: PromptType;
  playerName: string;  // Shooter for shots, stealer for steals, blocker for blocks
  eventResult?: 'made' | 'missed' | 'steal';  // Type of event
  eventDescription: string;  // e.g., "3-pointer made", "Steal", "Block"
  players: Player[];  // Players who can be selected
  onSelectPlayer: (playerId: string, index: number) => void;
  onSelectShotType?: (shotType: 'field_goal' | 'three_pointer') => void;  // For blocked shot
  onSelectReboundType?: (reboundType: 'offensive' | 'defensive') => void;  // For standalone rebound
  onSelectShotMadeMissed?: (made: boolean) => void;  // For shooting foul: was shot made?
  onSkip: () => void;
  // ✅ FIX: Disable buttons when recording to prevent duplicates
  isRecording?: boolean;
}

export function VideoInlinePrompt({
  promptType,
  playerName,
  eventResult = 'made',
  eventDescription,
  players,
  onSelectPlayer,
  onSelectShotType,
  onSelectReboundType,
  onSelectShotMadeMissed,
  onSkip,
  isRecording = false,
}: VideoInlinePromptProps) {
  // Handle keyboard events for the prompt
  useEffect(() => {
    if (!promptType) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ✅ FIX: Block keyboard input when recording to prevent duplicates
      if (isRecording) return;
      
      // Escape to skip
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }

      // For blocked_shot prompt: 2 = 2PT, 3 = 3PT
      if (promptType === 'blocked_shot') {
        if (e.key === '2' && onSelectShotType) {
          e.preventDefault();
          onSelectShotType('field_goal');
          return;
        }
        if (e.key === '3' && onSelectShotType) {
          e.preventDefault();
          onSelectShotType('three_pointer');
          return;
        }
        return; // Don't process other keys for blocked_shot
      }

      // For rebound_type prompt: O = Offensive, D = Defensive
      if (promptType === 'rebound_type') {
        if ((e.key === 'o' || e.key === 'O') && onSelectReboundType) {
          e.preventDefault();
          onSelectReboundType('offensive');
          return;
        }
        if ((e.key === 'd' || e.key === 'D') && onSelectReboundType) {
          e.preventDefault();
          onSelectReboundType('defensive');
          return;
        }
        return; // Don't process other keys for rebound_type
      }

      // For shot_made_missed prompt: Y = Made, N = Missed
      if (promptType === 'shot_made_missed') {
        if ((e.key === 'y' || e.key === 'Y') && onSelectShotMadeMissed) {
          e.preventDefault();
          onSelectShotMadeMissed(true);  // Shot was made (and-1)
          return;
        }
        if ((e.key === 'n' || e.key === 'N') && onSelectShotMadeMissed) {
          e.preventDefault();
          onSelectShotMadeMissed(false);  // Shot was missed
          return;
        }
        return; // Don't process other keys for shot_made_missed
      }

      // Number keys 1-9, 0 for player selection
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        
        // For '0' key, check if opponent exists (always last in array for rebounds)
        if (key === '0') {
          const lastPlayer = players[players.length - 1];
          if (lastPlayer?.id === 'opponent-team') {
            onSelectPlayer(lastPlayer.id, players.length - 1);
          }
          return;
        }
        
        // Keys 1-9 map to indices 0-8
        const index = parseInt(key) - 1;
        if (index < players.length) {
          onSelectPlayer(players[index].id, index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptType, players, onSelectPlayer, onSelectShotType, onSelectReboundType, onSelectShotMadeMissed, onSkip, isRecording]);

  if (!promptType) return null;

  // Determine styling and labels based on prompt type
  const getPromptConfig = () => {
    switch (promptType) {
      case 'assist':
        return { label: 'Assist?', bgColor: 'bg-green-50 border-green-200', iconColor: 'text-green-600', icon: CheckCircle };
      case 'rebound':
        return { label: 'Rebound?', bgColor: 'bg-red-50 border-red-200', iconColor: 'text-red-600', icon: XCircle };
      case 'turnover':
        return { label: 'Turnover by?', bgColor: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600', icon: ArrowRightLeft };
      case 'blocked_shot':
        return { label: 'Shot Type?', bgColor: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600', icon: Shield };
      case 'rebound_type':
        return { label: 'Rebound Type?', bgColor: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', icon: XCircle };
      case 'blocked_shooter':
        return { label: 'Who got blocked?', bgColor: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600', icon: Shield };
      case 'fouled_player':
        return { label: 'Who was fouled?', bgColor: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600', icon: CheckCircle };
      case 'shot_made_missed':
        return { label: 'Was the shot made?', bgColor: 'bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-600', icon: CheckCircle };
      default:
        return { label: '', bgColor: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-600', icon: CheckCircle };
    }
  };

  const config = getPromptConfig();
  const Icon = config.icon;

  // Special UI for shot made/missed selection (shooting fouls)
  if (promptType === 'shot_made_missed') {
    return (
      <div className={`p-3 rounded-lg border ${config.bgColor} animate-pulse`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            <span className="text-sm font-medium">
              Shooting Foul - {playerName}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
            title="Skip (Esc)"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Prompt */}
        <div className="text-xs font-medium text-gray-700 mb-2">
          Was the shot made or missed? Press <kbd className="bg-gray-200 px-1 rounded">Y</kbd> (Made) or <kbd className="bg-gray-200 px-1 rounded">N</kbd> (Missed) or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd>
        </div>

        {/* Made/Missed buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelectShotMadeMissed?.(true)}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-sm font-medium text-green-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}`}
          >
            <CheckCircle className="w-4 h-4" />
            <kbd className="bg-green-100 px-1.5 py-0.5 rounded text-xs">Y</kbd>
            <span>{isRecording ? 'Saving...' : 'Made (And-1)'}</span>
          </button>
          <button
            onClick={() => onSelectShotMadeMissed?.(false)}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200 text-sm font-medium text-red-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
          >
            <XCircle className="w-4 h-4" />
            <kbd className="bg-red-100 px-1.5 py-0.5 rounded text-xs">N</kbd>
            <span>{isRecording ? 'Saving...' : 'Missed'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Special UI for blocked shot type selection
  if (promptType === 'blocked_shot') {
    return (
      <div className={`p-3 rounded-lg border ${config.bgColor} animate-pulse`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            <span className="text-sm font-medium">
              {eventDescription} - {playerName}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
            title="Skip (Esc)"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Prompt */}
        <div className="text-xs font-medium text-gray-700 mb-2">
          What shot was blocked? Press <kbd className="bg-gray-200 px-1 rounded">2</kbd> or <kbd className="bg-gray-200 px-1 rounded">3</kbd> or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd>
        </div>

        {/* Shot type buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelectShotType?.('field_goal')}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 text-sm font-medium text-blue-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
          >
            <kbd className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">2</kbd>
            <span>{isRecording ? 'Saving...' : '2PT'}</span>
          </button>
          <button
            onClick={() => onSelectShotType?.('three_pointer')}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 text-sm font-medium text-green-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-100'}`}
          >
            <kbd className="bg-green-100 px-1.5 py-0.5 rounded text-xs">3</kbd>
            <span>{isRecording ? 'Saving...' : '3PT'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Special UI for standalone rebound type selection (O = Offensive, D = Defensive)
  if (promptType === 'rebound_type') {
    return (
      <div className={`p-3 rounded-lg border ${config.bgColor} animate-pulse`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            <span className="text-sm font-medium">
              Rebound - {playerName}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
            title="Skip (Esc)"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Prompt */}
        <div className="text-xs font-medium text-gray-700 mb-2">
          Rebound type? Press <kbd className="bg-gray-200 px-1 rounded">O</kbd> (Offensive) or <kbd className="bg-gray-200 px-1 rounded">D</kbd> (Defensive) or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd>
        </div>

        {/* Rebound type buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onSelectReboundType?.('offensive')}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-200 text-sm font-medium text-orange-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-100'}`}
          >
            <kbd className="bg-orange-100 px-1.5 py-0.5 rounded text-xs">O</kbd>
            <span>{isRecording ? 'Saving...' : 'Offensive'}</span>
          </button>
          <button
            onClick={() => onSelectReboundType?.('defensive')}
            disabled={isRecording}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 text-sm font-medium text-blue-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100'}`}
          >
            <kbd className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">D</kbd>
            <span>{isRecording ? 'Saving...' : 'Defensive'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} animate-pulse`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
          <span className="text-sm font-medium">
            {eventDescription} - {playerName}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="w-5 h-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
          title="Skip (Esc)"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Prompt */}
      <div className="text-xs font-medium text-gray-700 mb-2">
        {config.label} Press <kbd className="bg-gray-200 px-1 rounded">1-{Math.min(players.length, 9)}</kbd>
        {/* Show 0 hint for opponent in rebound prompts */}
        {promptType === 'rebound' && players.some(p => p.id === 'opponent-team') && (
          <> or <kbd className="bg-gray-200 px-1 rounded">0</kbd> (Opp)</>
        )} or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd>
      </div>

      {/* Quick player list - show first 5 regular players (excluding opponent) */}
      <div className="flex flex-wrap gap-1">
        {isRecording && (
          <div className="w-full text-center text-xs text-orange-600 font-medium py-1">
            Saving...
          </div>
        )}
        {players
          .filter(p => p.id !== 'opponent-team')
          .slice(0, 5)
          .map((player, idx) => (
            <button
              key={player.id}
              onClick={() => {
                // Find the actual index in the original players array
                const actualIdx = players.findIndex(p => p.id === player.id);
                onSelectPlayer(player.id, actualIdx);
              }}
              disabled={isRecording}
              className={`flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
              <kbd className="bg-gray-100 px-1 rounded text-[10px]">{idx + 1}</kbd>
              <span className="truncate max-w-[60px]">{player.name}</span>
            </button>
          ))}
        {/* Show opponent option if it exists (for rebounds in coach mode) - always show with 0 key */}
        {players.some(p => p.id === 'opponent-team') && (
          <button
            key="opponent-team"
            onClick={() => {
              const oppIndex = players.findIndex(p => p.id === 'opponent-team');
              if (oppIndex >= 0) onSelectPlayer('opponent-team', oppIndex);
            }}
            disabled={isRecording}
            className={`flex items-center gap-1 px-2 py-1 bg-red-50 rounded border border-red-200 text-xs text-red-700 ${isRecording ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-100'}`}
          >
            <kbd className="bg-red-100 px-1 rounded text-[10px]">0</kbd>
            <span className="truncate max-w-[60px]">
              {players.find(p => p.id === 'opponent-team')?.name || 'Opponent'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

