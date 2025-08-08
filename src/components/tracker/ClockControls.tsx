'use client';

import React from 'react';

export interface ClockControlsProps {
  isRunning: boolean;
  clockLabel: string; // e.g., 12:00
  quarter: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const ClockControls: React.FC<ClockControlsProps> = ({
  isRunning,
  clockLabel,
  quarter,
  onStart,
  onStop,
  onReset
}) => {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <div className="px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700">
        <span className="text-sm text-gray-400 mr-2">Q{quarter}</span>
        <span className="text-2xl font-bold tabular-nums">{clockLabel}</span>
      </div>
      {isRunning ? (
        <button onClick={onStop} className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500">Stop</button>
      ) : (
        <button onClick={onStart} className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-500">Start</button>
      )}
      <button onClick={onReset} className="px-4 py-2 rounded-md bg-gray-700 text-white font-semibold hover:bg-gray-600">Reset</button>
    </div>
  );
};

