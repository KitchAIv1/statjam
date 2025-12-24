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
import { X, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import type { PromptType } from '@/hooks/useVideoStatPrompts';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
}

interface VideoInlinePromptProps {
  promptType: PromptType;
  playerName: string;  // Shooter for shots, stealer for steals
  eventResult?: 'made' | 'missed' | 'steal';  // Type of event
  eventDescription: string;  // e.g., "3-pointer made", "Steal"
  players: Player[];  // Players who can be selected
  onSelectPlayer: (playerId: string, index: number) => void;
  onSkip: () => void;
}

export function VideoInlinePrompt({
  promptType,
  playerName,
  eventResult = 'made',
  eventDescription,
  players,
  onSelectPlayer,
  onSkip,
}: VideoInlinePromptProps) {
  // Handle keyboard events for the prompt
  useEffect(() => {
    if (!promptType) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to skip
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
        return;
      }

      // Number keys 1-9, 0 for player selection
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        const index = key === '0' ? 9 : parseInt(key) - 1;
        if (index < players.length) {
          onSelectPlayer(players[index].id, index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptType, players, onSelectPlayer, onSkip]);

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
      default:
        return { label: '', bgColor: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-600', icon: CheckCircle };
    }
  };

  const config = getPromptConfig();
  const Icon = config.icon;

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
        {config.label} Press <kbd className="bg-gray-200 px-1 rounded">1-{Math.min(players.length, 9)}</kbd> or <kbd className="bg-gray-200 px-1 rounded">Esc</kbd>
      </div>

      {/* Quick player list */}
      <div className="flex flex-wrap gap-1">
        {players.slice(0, 5).map((player, idx) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player.id, idx)}
            className="flex items-center gap-1 px-2 py-1 bg-white rounded border hover:bg-gray-50 text-xs"
          >
            <kbd className="bg-gray-100 px-1 rounded text-[10px]">{idx + 1}</kbd>
            <span className="truncate max-w-[60px]">{player.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

