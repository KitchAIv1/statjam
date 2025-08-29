'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Edit3, Check, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface ShotClockV3Props {
  seconds: number;
  isRunning: boolean;
  isVisible: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: (seconds?: number) => void;
  onSetTime?: (seconds: number) => void; // Manual time setting
}

export function ShotClockV3({
  seconds,
  isRunning,
  isVisible,
  onStart,
  onStop,
  onReset,
  onSetTime
}: ShotClockV3Props) {
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSeconds, setEditSeconds] = useState(seconds);

  // Don't render if shot clock is disabled
  if (!isVisible) {
    return null;
  }

  const formatTime = (secs: number) => {
    return secs.toString().padStart(2, '0');
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to current value
      setEditSeconds(seconds);
    } else {
      // Enter edit mode - initialize with current value
      setEditSeconds(seconds);
    }
    setIsEditMode(!isEditMode);
  };

  // Handle custom time set
  const handleSetCustomTime = () => {
    if (onSetTime) {
      onSetTime(editSeconds);
    }
    setIsEditMode(false);
  };

  // Get display color based on time remaining
  const getDisplayColor = () => {
    if (seconds <= 5) return 'text-red-500'; // Red for urgency
    if (seconds <= 10) return 'text-orange-500'; // Orange for warning
    return isRunning ? 'text-green-500' : 'text-gray-500'; // Green when running, gray when stopped
  };

  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: seconds <= 5 ? '#ef4444' : 'var(--dashboard-border)',
      borderWidth: '2px',
      boxShadow: seconds <= 5 ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none'
    }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm" style={{ color: 'var(--dashboard-text-primary)' }}>
          <Clock className="w-4 h-4 text-orange-500" />
          Shot Clock
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Shot Clock Display */}
        <div className="text-center">
          {isEditMode ? (
            // Edit Mode - Input field
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="35"
                value={editSeconds}
                onChange={(e) => setEditSeconds(Math.max(0, Math.min(35, parseInt(e.target.value) || 0)))}
                className="w-20 mx-auto text-center text-2xl font-bold"
                style={{ 
                  background: 'var(--dashboard-card)',
                  borderColor: 'var(--dashboard-border)',
                  color: 'var(--dashboard-text-primary)'
                }}
              />
              <p className="text-xs" style={{ color: 'var(--dashboard-text-secondary)' }}>
                Set Seconds (0-35)
              </p>
            </div>
          ) : (
            // Normal Mode - Clock display
            <>
              <div 
                className={`text-4xl font-bold font-mono tracking-wider ${getDisplayColor()}`}
                style={{ 
                  textShadow: seconds <= 5 ? '0 0 15px rgba(239, 68, 68, 0.8)' : 'none'
                }}
              >
                {formatTime(seconds)}
              </div>
              <p 
                className="text-xs mt-1 font-medium"
                style={{ color: 'var(--dashboard-text-secondary)' }}
              >
                {isRunning ? 'Running' : 'Stopped'}
              </p>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {isEditMode ? (
            // Edit Mode Buttons
            <>
              <Button
                onClick={handleSetCustomTime}
                size="sm"
                className="flex flex-col gap-1 h-12 bg-green-500 hover:bg-green-600 text-white"
                disabled={!onSetTime}
              >
                <Check className="w-3 h-3" />
                <span className="text-xs">Set</span>
              </Button>

              <Button
                onClick={handleEditToggle}
                size="sm"
                variant="outline"
                className="flex flex-col gap-1 h-12 hover:bg-red-500/10 hover:border-red-500"
              >
                <X className="w-3 h-3" />
                <span className="text-xs">Cancel</span>
              </Button>
            </>
          ) : (
            // Normal Mode Buttons
            <>
              <Button
                onClick={isRunning ? onStop : onStart}
                size="sm"
                className={`flex flex-col gap-1 h-12 ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span className="text-xs">
                  {isRunning ? 'Stop' : 'Start'}
                </span>
              </Button>

              <Button
                onClick={handleEditToggle}
                size="sm"
                variant="outline"
                className="flex flex-col gap-1 h-12 hover:bg-blue-500/10 hover:border-blue-500"
                disabled={!onSetTime}
              >
                <Edit3 className="w-3 h-3" />
                <span className="text-xs">Edit</span>
              </Button>
            </>
          )}
        </div>

        {/* Quick Reset Buttons */}
        <div className="grid grid-cols-3 gap-1">
          <Button
            onClick={() => onReset(24)}
            size="sm"
            variant="outline"
            className="text-xs py-1 hover:bg-orange-500/10 hover:border-orange-500"
          >
            24s
          </Button>
          <Button
            onClick={() => onReset(14)}
            size="sm"
            variant="outline"
            className="text-xs py-1 hover:bg-orange-500/10 hover:border-orange-500"
          >
            14s
          </Button>
          <Button
            onClick={() => onReset()}
            size="sm"
            variant="outline"
            className="text-xs py-1 hover:bg-gray-500/10 hover:border-gray-500"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>

        {/* Status Indicator */}
        {seconds <= 5 && isRunning && (
          <div className="text-center">
            <div className="text-xs font-bold text-red-500 animate-pulse">
              ⚠️ SHOT CLOCK VIOLATION WARNING
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
