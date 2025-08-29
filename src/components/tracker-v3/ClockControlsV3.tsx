'use client';

import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Edit3, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

interface ClockControlsV3Props {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetCustomTime?: (minutes: number, seconds: number) => void; // NEW: Manual time setting
}

export function ClockControlsV3({
  minutes,
  seconds,
  isRunning,
  onStart,
  onStop,
  onReset,
  onSetCustomTime
}: ClockControlsV3Props) {
  // NEW: Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editSeconds, setEditSeconds] = useState(seconds);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // NEW: Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    } else {
      // Enter edit mode - initialize with current values
      setEditMinutes(minutes);
      setEditSeconds(seconds);
    }
    setIsEditMode(!isEditMode);
  };

  // NEW: Handle custom time set
  const handleSetCustomTime = () => {
    if (onSetCustomTime) {
      onSetCustomTime(editMinutes, editSeconds);
    }
    setIsEditMode(false);
  };

  return (
    <Card style={{ 
      background: 'var(--dashboard-card)', 
      borderColor: 'var(--dashboard-border)',
      borderWidth: '1px'
    }}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2" style={{ color: 'var(--dashboard-text-primary)' }}>
          <Clock className="w-5 h-5 text-orange-500" />
          Game Clock
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Clock Display */}
        <div className="text-center">
          {isEditMode ? (
            // NEW: Edit Mode - Input fields
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <label className="text-xs mb-1" style={{ color: 'var(--dashboard-text-secondary)' }}>
                    Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                    className="w-20 text-center text-2xl font-bold"
                    style={{ 
                      background: 'var(--dashboard-card)',
                      borderColor: 'var(--dashboard-border)',
                      color: 'var(--dashboard-text-primary)'
                    }}
                  />
                </div>
                <span className="text-4xl font-bold" style={{ color: 'var(--dashboard-text-primary)' }}>:</span>
                <div className="flex flex-col items-center">
                  <label className="text-xs mb-1" style={{ color: 'var(--dashboard-text-secondary)' }}>
                    Seconds
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={editSeconds}
                    onChange={(e) => setEditSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-20 text-center text-2xl font-bold"
                    style={{ 
                      background: 'var(--dashboard-card)',
                      borderColor: 'var(--dashboard-border)',
                      color: 'var(--dashboard-text-primary)'
                    }}
                  />
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--dashboard-text-secondary)' }}>
                Set Custom Time
              </p>
            </div>
          ) : (
            // Normal Mode - Clock display
            <>
              <div 
                className="text-6xl font-bold font-mono tracking-wider"
                style={{ 
                  color: isRunning ? 'var(--dashboard-primary)' : 'var(--dashboard-text-primary)',
                  textShadow: isRunning ? '0 0 20px rgba(249, 115, 22, 0.5)' : 'none'
                }}
              >
                {formatTime(minutes, seconds)}
              </div>
              <p 
                className="text-sm mt-2 font-medium"
                style={{ color: 'var(--dashboard-text-secondary)' }}
              >
                {isRunning ? 'Clock Running' : 'Clock Stopped'}
              </p>
            </>
          )}
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {isEditMode ? (
            // NEW: Edit Mode Buttons
            <>
              <Button
                onClick={handleSetCustomTime}
                size="lg"
                className="flex flex-col gap-1 h-16 bg-green-500 hover:bg-green-600 text-white"
                disabled={!onSetCustomTime}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs">Set Time</span>
              </Button>

              <Button
                onClick={handleEditToggle}
                size="lg"
                variant="outline"
                className="flex flex-col gap-1 h-16 hover:bg-red-500/10 hover:border-red-500"
              >
                <X className="w-5 h-5" />
                <span className="text-xs">Cancel</span>
              </Button>

              <Button
                onClick={onReset}
                size="lg"
                variant="outline"
                className="flex flex-col gap-1 h-16 hover:bg-orange-500/10 hover:border-orange-500"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-xs">Reset</span>
              </Button>
            </>
          ) : (
            // Normal Mode Buttons
            <>
              <Button
                onClick={isRunning ? onStop : onStart}
                size="lg"
                className={`flex flex-col gap-1 h-16 ${
                  isRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span className="text-xs">
                  {isRunning ? 'Stop' : 'Start'}
                </span>
              </Button>

              <Button
                onClick={onReset}
                size="lg"
                variant="outline"
                className="flex flex-col gap-1 h-16 hover:bg-orange-500/10 hover:border-orange-500"
              >
                <RotateCcw className="w-5 h-5" />
                <span className="text-xs">Reset</span>
              </Button>

              <Button
                onClick={handleEditToggle}
                size="lg"
                variant="outline"
                className="flex flex-col gap-1 h-16 hover:bg-blue-500/10 hover:border-blue-500"
                disabled={!onSetCustomTime}
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-xs">Edit</span>
              </Button>
            </>
          )}
        </div>

        {/* Time Indicators */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs" style={{ color: 'var(--dashboard-text-secondary)' }}>Minutes</p>
            <p className="text-lg font-bold" style={{ color: 'var(--dashboard-text-primary)' }}>{minutes}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--dashboard-text-secondary)' }}>Seconds</p>
            <p className="text-lg font-bold" style={{ color: 'var(--dashboard-text-primary)' }}>{seconds}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--dashboard-text-secondary)' }}>Total</p>
            <p className="text-lg font-bold" style={{ color: 'var(--dashboard-text-primary)' }}>
              {(minutes * 60 + seconds)}s
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}