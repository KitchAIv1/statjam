'use client';

/**
 * GameClockEditModal - Quick edit modal for game clock
 * 
 * Allows stat admins to manually adjust the game clock
 * during video tracking to correct sync issues.
 * 
 * @module GameClockEditModal
 */

import React, { useState, useEffect } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface GameClockEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuarter: number;
  currentMinutes: number;
  currentSeconds: number;
  isOvertime: boolean;
  quarterLength: number;
  onSave: (quarter: number, minutes: number, seconds: number, isOvertime: boolean) => void;
}

export function GameClockEditModal({
  isOpen,
  onClose,
  currentQuarter,
  currentMinutes,
  currentSeconds,
  isOvertime,
  quarterLength,
  onSave,
}: GameClockEditModalProps) {
  const [quarter, setQuarter] = useState(currentQuarter);
  const [minutes, setMinutes] = useState(currentMinutes);
  const [seconds, setSeconds] = useState(currentSeconds);
  const [overtime, setOvertime] = useState(isOvertime);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuarter(currentQuarter);
      setMinutes(currentMinutes);
      setSeconds(currentSeconds);
      setOvertime(isOvertime);
    }
  }, [isOpen, currentQuarter, currentMinutes, currentSeconds, isOvertime]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(quarter, minutes, seconds, overtime);
  };

  // Quarter options
  const quarterOptions = overtime
    ? [1, 2, 3] // OT periods
    : [1, 2, 3, 4]; // Regular quarters

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Edit Game Clock</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Period Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOvertime(false);
                setQuarter(Math.min(quarter, 4));
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                !overtime
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => {
                setOvertime(true);
                setQuarter(Math.min(quarter, 3));
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                overtime
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Overtime
            </button>
          </div>

          {/* Quarter/Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {overtime ? 'Overtime Period' : 'Quarter'}
            </label>
            <div className="flex gap-2">
              {quarterOptions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuarter(q)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    quarter === q
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {overtime ? `OT${q}` : `Q${q}`}
                </button>
              ))}
            </div>
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Remaining
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max={quarterLength}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, Math.min(quarterLength, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 text-center mt-1">Minutes</p>
              </div>
              <span className="text-3xl font-bold text-gray-400">:</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 text-center text-2xl font-mono font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 text-center mt-1">Seconds</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Preview</p>
            <p className="text-2xl font-mono font-bold text-orange-600">
              {overtime ? `OT${quarter}` : `Q${quarter}`} {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Clock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

