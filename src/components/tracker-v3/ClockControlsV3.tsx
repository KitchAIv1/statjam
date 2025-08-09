'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

interface ClockControlsV3Props {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ClockControlsV3({
  minutes,
  seconds,
  isRunning,
  onStart,
  onStop,
  onReset
}: ClockControlsV3Props) {
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
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
            onClick={() => {/* TODO: Add quarter controls */}}
            size="lg"
            variant="outline"
            className="flex flex-col gap-1 h-16 hover:bg-orange-500/10 hover:border-orange-500"
          >
            <span className="text-lg font-bold">Q</span>
            <span className="text-xs">Quarter</span>
          </Button>
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