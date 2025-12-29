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
import { ShotLocationEditor } from './ShotLocationEditor';
import { STAT_TYPES, getModifiersForStatType } from '@/lib/constants/statTypes';
import { VideoStatService, ClockSyncConfig } from '@/lib/services/videoStatService';

interface Player {
  id: string;
  name: string;
  is_custom_player?: boolean;
}

interface StatEditFormProps {
  stat: GameStatRecord;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
  /** Optional: For video-tracked games, auto-sync video_timestamp_ms when game clock is edited */
  clockSyncConfig?: ClockSyncConfig | null;
}

export function StatEditForm({
  stat,
  players,
  onClose,
  onSuccess,
  clockSyncConfig
}: StatEditFormProps) {
  const [playerId, setPlayerId] = useState(stat.player_id || stat.custom_player_id || '');
  const [statType, setStatType] = useState(stat.stat_type);
  const [modifier, setModifier] = useState(stat.modifier || '');
  const [quarter, setQuarter] = useState(stat.quarter);
  const [minutes, setMinutes] = useState(stat.game_time_minutes);
  const [seconds, setSeconds] = useState(stat.game_time_seconds);
  const [value, setValue] = useState(stat.stat_value); // For game-level stats
  const [saving, setSaving] = useState(false);
  
  // ✅ Shot location state (for field_goal/three_pointer)
  const [shotLocationX, setShotLocationX] = useState<number | null>(stat.shot_location_x ?? null);
  const [shotLocationY, setShotLocationY] = useState<number | null>(stat.shot_location_y ?? null);
  const [shotZone, setShotZone] = useState<string | null>(stat.shot_zone ?? null);
  
  const isGameLevelStat = stat.is_game_level_stat || false;
  const isShotStat = statType === 'field_goal' || statType === 'three_pointer';

  // Use shared constants for stat types and modifiers (aligned with DB constraints)
  const getModifiers = (type: string): string[] => {
    const modifiers = getModifiersForStatType(type);
    return modifiers.length > 0 ? [...modifiers] : [];
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Handle timeout events (read-only, can only be deleted)
      if (stat.stat_type === 'timeout') {
        alert('Timeout events cannot be edited. Use Delete to remove them.');
        setSaving(false);
        return;
      }

      // Handle game-level stats (fouls/timeouts) - removed, no longer using synthetic entries
      if (isGameLevelStat) {
        const updates: any = {};
        if (stat.game_level_type === 'team_fouls') {
          if (stat.team_side === 'A') {
            updates.team_a_fouls = value;
          } else {
            updates.team_b_fouls = value;
          }
        } else if (stat.game_level_type === 'team_timeouts') {
          if (stat.team_side === 'A') {
            updates.team_a_timeouts_remaining = value;
          } else {
            updates.team_b_timeouts_remaining = value;
          }
        }
        
        await StatEditService.updateGameLevelStat(stat.game_id, updates);
        onSuccess();
        return;
      }

      // Regular stat update
      // Determine if this is regular player or custom player (TWO CHECKS: ID prefix OR flag)
      const selectedPlayerData = players.find(p => p.id === playerId);
      const isCustomPlayer = playerId.startsWith('custom-') || 
                            (selectedPlayerData && selectedPlayerData.is_custom_player === true) ||
                            // Fallback: if original stat was custom and player unchanged, preserve it
                            (stat.custom_player_id !== null && stat.custom_player_id === playerId);
      
      const updates: Partial<GameStatRecord> = {
        player_id: isCustomPlayer ? null : playerId,
        custom_player_id: isCustomPlayer ? playerId : null,
        stat_type: statType,
        modifier: modifier || null,
        quarter,
        game_time_minutes: minutes,
        game_time_seconds: seconds,
        // ✅ Include shot location for field_goal/three_pointer
        ...(isShotStat && {
          shot_location_x: shotLocationX,
          shot_location_y: shotLocationY,
          shot_zone: shotZone
        })
      };

      // ✅ Auto-sync video_timestamp_ms when game clock is edited (for video-tracked games)
      if (clockSyncConfig) {
        const newVideoTimestampMs = VideoStatService.calculateVideoTimestamp(
          clockSyncConfig,
          quarter,
          minutes,
          seconds
        );
        (updates as any).video_timestamp_ms = Math.round(newVideoTimestampMs);
        console.log(`🎬 StatEditForm: Auto-synced video_timestamp_ms to ${newVideoTimestampMs}ms`);
      }

      console.log('📝 StatEditForm: Sending update:', JSON.stringify({
        id: stat.id,
        game_time_minutes: updates.game_time_minutes,
        game_time_seconds: updates.game_time_seconds,
        video_timestamp_ms: (updates as any).video_timestamp_ms,
      }));
      
      await StatEditService.updateStat(stat.id, updates);
      console.log('✅ StatEditForm: Calling onSuccess callback');
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
          
          {/* Timeout events: Read-only display */}
          {stat.stat_type === 'timeout' ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">Timeout events cannot be edited.</p>
              <p className="text-xs text-gray-500">Use Delete to remove this timeout event.</p>
            </div>
          ) : isGameLevelStat ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {stat.game_level_type === 'team_fouls' ? 'Team Fouls' : 'Timeouts Remaining'}
              </label>
              <input
                type="number"
                min="0"
                max={stat.game_level_type === 'team_timeouts' ? "10" : "20"}
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {stat.team_side === 'A' ? 'Team A' : 'Team B'} - {stat.game_level_type === 'team_fouls' ? 'Total team fouls' : 'Timeouts remaining'}
              </p>
            </div>
          ) : (
            <>
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
                const newModifiers = getModifiers(e.target.value);
                if (newModifiers.length > 0) {
                  setModifier(newModifiers[0]);
                } else {
                  setModifier('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {STAT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Modifier */}
          {getModifiers(statType).length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Outcome
              </label>
              <select
                value={modifier}
                onChange={(e) => setModifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {getModifiers(statType).map(mod => (
                  <option key={mod} value={mod}>
                    {mod.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ✅ Shot Location Editor (for field_goal/three_pointer only) */}
          {isShotStat && (
            <ShotLocationEditor
              locationX={shotLocationX}
              locationY={shotLocationY}
              zone={shotZone}
              onLocationChange={(x, y, zone) => {
                setShotLocationX(x);
                setShotLocationY(y);
                setShotZone(zone);
              }}
            />
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
            </>
          )}
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

