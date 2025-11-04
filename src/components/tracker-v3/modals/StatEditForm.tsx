/**
 * StatEditForm - Inline Edit Form for Individual Stats
 * 
 * PURPOSE:
 * - Edit specific stat properties (player, type, modifier, time)
 * - Inline form modal (secondary modal over StatEditModal)
 * - Validation and error handling
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatEditService, GameStatRecord } from '@/lib/services/statEditService';

interface Player {
  id: string;
  name: string;
}

interface StatEditFormProps {
  stat: GameStatRecord;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export function StatEditForm({
  stat,
  players,
  onClose,
  onSuccess
}: StatEditFormProps) {
  const [playerId, setPlayerId] = useState(stat.player_id || stat.custom_player_id || '');
  const [statType, setStatType] = useState(stat.stat_type);
  const [modifier, setModifier] = useState(stat.modifier || '');
  const [quarter, setQuarter] = useState(stat.quarter);
  const [minutes, setMinutes] = useState(stat.game_time_minutes);
  const [seconds, setSeconds] = useState(stat.game_time_seconds);
  const [saving, setSaving] = useState(false);

  const statTypes = [
    { value: 'field_goal', label: '2PT Field Goal' },
    { value: 'three_pointer', label: '3PT Shot' },
    { value: 'free_throw', label: 'Free Throw' },
    { value: 'rebound', label: 'Rebound' },
    { value: 'assist', label: 'Assist' },
    { value: 'steal', label: 'Steal' },
    { value: 'block', label: 'Block' },
    { value: 'turnover', label: 'Turnover' },
    { value: 'foul', label: 'Foul' }
  ];

  const getModifiersForType = (type: string): string[] => {
    switch (type) {
      case 'field_goal':
      case 'three_pointer':
      case 'free_throw':
        return ['made', 'missed'];
      case 'rebound':
        return ['offensive', 'defensive'];
      case 'foul':
        return ['personal', 'technical', 'flagrant', 'offensive', 'shooting'];
      case 'turnover':
        return ['bad_pass', 'travel', 'offensive_foul', 'lost_ball'];
      default:
        return [''];
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Determine if this is regular player or custom player
      const isCustomPlayer = !players.find(p => p.id === playerId && !p.id.startsWith('custom-'));
      
      const updates: Partial<GameStatRecord> = {
        player_id: isCustomPlayer ? null : playerId,
        custom_player_id: isCustomPlayer ? playerId : null,
        stat_type: statType,
        modifier: modifier || null,
        quarter,
        game_time_minutes: minutes,
        game_time_seconds: seconds
      };

      await StatEditService.updateStat(stat.id, updates);
      onSuccess();
    } catch (error) {
      console.error('Failed to update stat:', error);
      alert('Failed to update stat. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Stat</h3>
            <p className="text-sm text-gray-600">Make corrections to recorded stat</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          
          {/* Player Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Player
            </label>
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stat Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stat Type
            </label>
            <select
              value={statType}
              onChange={(e) => {
                setStatType(e.target.value);
                // Reset modifier when type changes
                const newModifiers = getModifiersForType(e.target.value);
                if (newModifiers.length > 0) {
                  setModifier(newModifiers[0]);
                } else {
                  setModifier('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {statTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Modifier */}
          {getModifiersForType(statType).length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Outcome
              </label>
              <select
                value={modifier}
                onChange={(e) => setModifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {getModifiersForType(statType).map(mod => (
                  <option key={mod} value={mod}>
                    {mod.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter and Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quarter
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
                <option value="5">OT1</option>
                <option value="6">OT2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Min
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sec
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

