/**
 * StatFormFields - Shared form field components for stat forms
 * 
 * PURPOSE:
 * - Reusable form fields for StatCreateForm and StatEditForm
 * - Reduces component size by extracting UI elements
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React from 'react';
import { STAT_TYPES, getModifiersForStatType } from '@/lib/constants/statTypes';

interface Player {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  selectedTeam: 'A' | 'B' | 'opponent';
  onSelect: (team: 'A' | 'B' | 'opponent') => void;
  teamAName: string;
  teamBName: string;
  isCoachMode: boolean;
}

export function TeamSelector({ selectedTeam, onSelect, teamAName, teamBName, isCoachMode }: TeamSelectorProps) {
  const buttonClass = (isActive: boolean, isOpp?: boolean) => 
    `flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? (isOpp ? 'bg-orange-500 text-white' : 'bg-purple-600 text-white')
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Team</label>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSelect('A')} className={buttonClass(selectedTeam === 'A')}>
          {teamAName}
        </button>
        {isCoachMode ? (
          <button type="button" onClick={() => onSelect('opponent')} className={buttonClass(selectedTeam === 'opponent', true)}>
            Opponent
          </button>
        ) : (
          <button type="button" onClick={() => onSelect('B')} className={buttonClass(selectedTeam === 'B')}>
            {teamBName}
          </button>
        )}
      </div>
    </div>
  );
}

interface PlayerSelectorProps {
  playerId: string;
  onSelect: (id: string) => void;
  players: Player[];
}

export function PlayerSelector({ playerId, onSelect, players }: PlayerSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Player</label>
      <select
        value={playerId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="">Select player...</option>
        {players.map(player => (
          <option key={player.id} value={player.id}>{player.name}</option>
        ))}
      </select>
    </div>
  );
}

interface StatTypeSelectorProps {
  statType: string;
  onSelect: (type: string) => void;
}

export function StatTypeSelector({ statType, onSelect }: StatTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Stat Type</label>
      <select
        value={statType}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {STAT_TYPES.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </div>
  );
}

interface ModifierSelectorProps {
  modifier: string;
  onSelect: (mod: string) => void;
  statType: string;
}

export function ModifierSelector({ modifier, onSelect, statType }: ModifierSelectorProps) {
  const modifiers = getModifiersForStatType(statType);
  if (modifiers.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Outcome</label>
      <select
        value={modifier}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {modifiers.map(mod => (
          <option key={mod} value={mod}>{mod.replace(/_/g, ' ').toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}

interface GameTimeInputsProps {
  quarter: number;
  minutes: number;
  seconds: number;
  onQuarterChange: (q: number) => void;
  onMinutesChange: (m: number) => void;
  onSecondsChange: (s: number) => void;
}

export function GameTimeInputs({ quarter, minutes, seconds, onQuarterChange, onMinutesChange, onSecondsChange }: GameTimeInputsProps) {
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter</label>
        <select value={quarter} onChange={(e) => onQuarterChange(parseInt(e.target.value))} className={inputClass}>
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
          <option value="5">OT1</option>
          <option value="6">OT2</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Min</label>
        <input type="number" min="0" max="12" value={minutes} onChange={(e) => onMinutesChange(parseInt(e.target.value) || 0)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sec</label>
        <input type="number" min="0" max="59" value={seconds} onChange={(e) => onSecondsChange(parseInt(e.target.value) || 0)} className={inputClass} />
      </div>
    </div>
  );
}
