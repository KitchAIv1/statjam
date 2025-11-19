'use client';

import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { PlayerJerseyService } from '@/lib/services/playerJerseyService';
import { notify } from '@/lib/services/notificationService';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface EditableJerseyNumberProps {
  player: Player;
  onUpdate: (playerId: string, updatedPlayer: Player) => void;
}

export function EditableJerseyNumber({ player, onUpdate }: EditableJerseyNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [jerseyValue, setJerseyValue] = useState<string>(player.jerseyNumber?.toString() || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditStart = () => {
    setIsEditing(true);
    setJerseyValue(player.jerseyNumber?.toString() || '');
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setJerseyValue(player.jerseyNumber?.toString() || '');
  };

  const handleSave = async () => {
    if (!jerseyValue.trim()) {
      notify.error('Invalid Jersey Number', 'Jersey number cannot be empty');
      handleEditCancel();
      return;
    }

    const numValue = parseInt(jerseyValue, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 999) {
      notify.error('Invalid Jersey Number', 'Jersey number must be between 0 and 999');
      handleEditCancel();
      return;
    }

    setIsUpdating(true);
    
    try {
      const isCustomPlayer = player.is_custom_player === true || player.id.startsWith('custom-');
      const result = await PlayerJerseyService.updateJerseyNumber(player.id, numValue, isCustomPlayer);

      if (result.success) {
        const updatedPlayer: Player = { ...player, jerseyNumber: numValue };
        onUpdate(player.id, updatedPlayer);
        notify.success('Jersey Updated', `Jersey number updated to #${numValue}`);
        setIsEditing(false);
      } else {
        notify.error('Update Failed', result.message || 'Failed to update jersey number');
      }
    } catch (error) {
      console.error('❌ Error updating jersey:', error);
      notify.error('Update Failed', 'An error occurred while updating jersey number');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isEditing) {
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md relative">
        <input
          type="text"
          value={jerseyValue}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || (/^\d+$/.test(value) && value.length <= 3)) {
              const num = parseInt(value, 10);
              if (value === '' || (num >= 0 && num <= 999)) {
                setJerseyValue(value);
              }
            }
          }}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleEditCancel();
            }
          }}
          autoFocus
          className="w-8 h-8 text-center text-white font-black text-sm bg-transparent border-none outline-none"
          placeholder="?"
          maxLength={3}
          disabled={isUpdating}
        />
      </div>
    );
  }

  return (
    <div 
      className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md cursor-pointer hover:from-blue-400 hover:to-blue-600 transition-all group relative"
      onClick={(e) => {
        e.stopPropagation();
        handleEditStart();
      }}
      title="Click to edit jersey number"
    >
      #{player.jerseyNumber || '?'}
      <Edit2 className="w-3 h-3 absolute -top-1 -right-1 opacity-70 group-hover:opacity-100 bg-blue-500 rounded-full p-0.5 transition-opacity" />
    </div>
  );
}

