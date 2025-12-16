/**
 * StatCreateForm - Create New Stat Form
 * 
 * PURPOSE:
 * - Create a new stat entry via Edit Stats modal
 * - Allows coaches to add missing stats without SQL
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatEditService } from '@/lib/services/statEditService';
import { ShotLocationEditor } from './ShotLocationEditor';
import { calculateStatValue } from '@/lib/utils/statValueCalculator';
import { getModifiersForStatType } from '@/lib/constants/statTypes';
import { TeamSelector, PlayerSelector, StatTypeSelector, ModifierSelector, GameTimeInputs } from './StatFormFields';

interface Player {
  id: string;
  name: string;
  is_custom_player?: boolean;
}

interface StatCreateFormProps {
  gameId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  isCoachMode?: boolean;
  initialQuarter?: number;
  initialMinutes?: number;
  initialSeconds?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function StatCreateForm({
  gameId, teamAId, teamBId, teamAName, teamBName, teamAPlayers, teamBPlayers, isCoachMode = false,
  initialQuarter = 1, initialMinutes = 10, initialSeconds = 0, onClose, onSuccess
}: StatCreateFormProps) {
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | 'opponent'>('A');
  const [playerId, setPlayerId] = useState('');
  const [statType, setStatType] = useState('field_goal');
  const [modifier, setModifier] = useState('made');
  const [quarter, setQuarter] = useState(initialQuarter);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [saving, setSaving] = useState(false);
  const [shotLocationX, setShotLocationX] = useState<number | null>(null);
  const [shotLocationY, setShotLocationY] = useState<number | null>(null);
  const [shotZone, setShotZone] = useState<string | null>(null);

  const isShotStat = statType === 'field_goal' || statType === 'three_pointer';
  
  const availablePlayers = useMemo(() => {
    if (selectedTeam === 'A') return teamAPlayers;
    if (selectedTeam === 'B') return teamBPlayers;
    return [];
  }, [selectedTeam, teamAPlayers, teamBPlayers]);

  const handleTeamSelect = (team: 'A' | 'B' | 'opponent') => {
    setSelectedTeam(team);
    setPlayerId('');
  };

  const handleStatTypeChange = (newType: string) => {
    setStatType(newType);
    const newModifiers = getModifiersForStatType(newType);
    setModifier(newModifiers[0] || '');
  };

  const handleSave = async () => {
    if (selectedTeam !== 'opponent' && !playerId) {
      alert('Please select a player');
      return;
    }

    try {
      setSaving(true);
      const isOpponentStat = selectedTeam === 'opponent';
      const teamId = selectedTeam === 'A' ? teamAId : selectedTeam === 'B' ? teamBId : teamAId;
      const selectedPlayer = availablePlayers.find(p => p.id === playerId);
      const isCustomPlayer = selectedPlayer?.is_custom_player || playerId.startsWith('custom-');
      const statValue = calculateStatValue(statType, modifier);

      await StatEditService.createStat({
        gameId,
        teamId,
        playerId: isCustomPlayer ? undefined : (playerId || undefined),
        customPlayerId: isCustomPlayer ? playerId : undefined,
        statType,
        modifier: modifier || null,
        statValue,
        quarter,
        gameTimeMinutes: minutes,
        gameTimeSeconds: seconds,
        isOpponentStat,
        shotLocationX: isShotStat ? shotLocationX : null,
        shotLocationY: isShotStat ? shotLocationY : null,
        shotZone: isShotStat ? shotZone : null
      });

      onSuccess();
    } catch (error) {
      console.error('❌ StatCreateForm: Failed to create stat:', error);
      alert('Failed to create stat. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add New Stat</h3>
            <p className="text-sm text-gray-600">Manually add a missed stat entry</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <TeamSelector
            selectedTeam={selectedTeam}
            onSelect={handleTeamSelect}
            teamAName={teamAName}
            teamBName={teamBName}
            isCoachMode={isCoachMode}
          />

          {selectedTeam !== 'opponent' && (
            <PlayerSelector playerId={playerId} onSelect={setPlayerId} players={availablePlayers} />
          )}

          <StatTypeSelector statType={statType} onSelect={handleStatTypeChange} />
          <ModifierSelector modifier={modifier} onSelect={setModifier} statType={statType} />

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

          <GameTimeInputs
            quarter={quarter}
            minutes={minutes}
            seconds={seconds}
            onQuarterChange={setQuarter}
            onMinutesChange={setMinutes}
            onSecondsChange={setSeconds}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <Button onClick={onClose} variant="secondary" className="flex-1" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
            disabled={saving || (selectedTeam !== 'opponent' && !playerId)}
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Creating...' : 'Add Stat'}
          </Button>
        </div>
      </div>
    </div>
  );
}
