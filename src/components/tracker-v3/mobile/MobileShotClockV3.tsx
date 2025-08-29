'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface MobileShotClockV3Props {
  seconds: number;
  isRunning: boolean;
  isVisible: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: (seconds?: number) => void;
  onSetTime?: (seconds: number) => void;
}

export function MobileShotClockV3({
  seconds,
  isRunning,
  isVisible,
  onStart,
  onStop,
  onReset,
  onSetTime
}: MobileShotClockV3Props) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSeconds, setEditSeconds] = useState(seconds);

  // Don't render if shot clock is disabled
  if (!isVisible) {
    return null;
  }

  const formatTime = (secs: number) => {
    return secs.toString().padStart(2, '0');
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      setEditSeconds(seconds);
    } else {
      setEditSeconds(seconds);
    }
    setIsEditMode(!isEditMode);
  };

  const handleSetCustomTime = () => {
    if (onSetTime) {
      onSetTime(editSeconds);
    }
    setIsEditMode(false);
  };

  const getDisplayColor = () => {
    if (seconds <= 5) return 'text-red-500';
    if (seconds <= 10) return 'text-orange-500';
    return isRunning ? 'text-green-500' : 'text-gray-400';
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg p-3 border-2"
      style={{
        borderColor: seconds <= 5 ? '#ef4444' : '#374151',
        boxShadow: seconds <= 5 ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-300">Shot Clock</span>
        {seconds <= 5 && isRunning && (
          <span className="text-xs font-bold text-red-500 animate-pulse">⚠️</span>
        )}
      </div>

      {/* Display */}
      <div className="text-center mb-3">
        {isEditMode ? (
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              min="0"
              max="35"
              value={editSeconds}
              onChange={(e) => setEditSeconds(Math.max(0, Math.min(35, parseInt(e.target.value) || 0)))}
              className="w-16 h-8 text-center text-lg font-bold bg-gray-700 border-gray-600 text-white"
            />
            <span className="text-gray-400 text-sm">sec</span>
          </div>
        ) : (
          <div 
            className={`text-3xl font-bold font-mono ${getDisplayColor()}`}
            style={{ 
              textShadow: seconds <= 5 ? '0 0 10px rgba(239, 68, 68, 0.8)' : 'none'
            }}
          >
            {formatTime(seconds)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {isEditMode ? (
          // Edit Mode Controls
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleSetCustomTime}
              size="sm"
              className="h-8 text-xs bg-green-500 hover:bg-green-600 text-white"
              disabled={!onSetTime}
            >
              <Check className="w-3 h-3 mr-1" />
              Set
            </Button>
            <Button
              onClick={handleEditToggle}
              size="sm"
              variant="outline"
              className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
        ) : (
          // Normal Mode Controls
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={isRunning ? onStop : onStart}
                size="sm"
                className={`h-8 text-xs ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                {isRunning ? 'Stop' : 'Start'}
              </Button>
              <Button
                onClick={handleEditToggle}
                size="sm"
                variant="outline"
                className="h-8 text-xs border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                disabled={!onSetTime}
              >
                <Edit3 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
            
            {/* Quick Reset */}
            <div className="grid grid-cols-3 gap-1">
              <Button
                onClick={() => onReset(24)}
                size="sm"
                variant="outline"
                className="h-6 text-xs py-0 border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-500"
              >
                24s
              </Button>
              <Button
                onClick={() => onReset(14)}
                size="sm"
                variant="outline"
                className="h-6 text-xs py-0 border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-500"
              >
                14s
              </Button>
              <Button
                onClick={() => onReset()}
                size="sm"
                variant="outline"
                className="h-6 text-xs py-0 border-gray-600 text-gray-400 hover:border-gray-500"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
