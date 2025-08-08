'use client';

import React from 'react';

export interface ClockControlsProps {
  isRunning: boolean;
  clockLabel: string; // e.g., 12:00
  quarter: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onPrevQuarter?: () => void;
  onNextQuarter?: () => void;
}

export const ClockControls: React.FC<ClockControlsProps> = ({
  isRunning,
  clockLabel,
  quarter,
  onStart,
  onStop,
  onReset,
  onPrevQuarter,
  onNextQuarter
}) => {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <button disabled={!onPrevQuarter} onClick={onPrevQuarter} className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 border border-gray-700">←</button>
        <div className="px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 text-center">
          <div className="text-sm text-gray-400">{quarter <= 4 ? `Q${quarter}` : `OT${quarter - 4}`}</div>
          <div className="text-2xl font-bold tabular-nums">{clockLabel}</div>
          <div className="text-[10px] text-gray-500 font-semibold">{isRunning ? 'RUNNING' : 'STOPPED'}</div>
        </div>
        <button disabled={!onNextQuarter} onClick={onNextQuarter} className="px-2 py-1 rounded-md bg-gray-800 text-gray-200 border border-gray-700">→</button>
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

