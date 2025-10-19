'use client';

import React, { useState } from 'react';
import { X, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TimeoutModalV3Props {
  isOpen: boolean;
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  onStartTimeout: (teamId: string, type: 'full' | '30_second') => Promise<void>;
  onResume: () => void;
  onCancel: () => void;
  timeoutActive: boolean;
  timeoutSecondsRemaining: number;
  timeoutTeamId: string | null;
}

export function TimeoutModalV3({
  isOpen,
  teamAName,
  teamBName,
  teamAId,
  teamBId,
  onStartTimeout,
  onResume,
  onCancel,
  timeoutActive,
  timeoutSecondsRemaining,
  timeoutTeamId
}: TimeoutModalV3Props) {
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [selectedType, setSelectedType] = useState<'full' | '30_second'>('full');
  const [isStarting, setIsStarting] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (!selectedTeam) return;
    
    setIsStarting(true);
    const teamId = selectedTeam === 'A' ? teamAId : teamBId;
    await onStartTimeout(teamId, selectedType);
    setIsStarting(false);
  };

  const handleResumePlay = () => {
    onResume();
    // Reset for next timeout
    setSelectedTeam(null);
    setSelectedType('full');
  };

  const handleCancel = () => {
    onCancel();
    setSelectedTeam(null);
    setSelectedType('full');
  };

  const currentTeamName = timeoutTeamId === teamAId ? teamAName : teamBName;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Darker during active timeout to prevent interaction */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm ${timeoutActive ? 'bg-black/90' : 'bg-black/80'}`}
        onClick={timeoutActive ? undefined : handleCancel}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md mx-4 overflow-hidden rounded-xl border shadow-2xl"
        style={{ 
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          borderWidth: '2px'
        }}
      >
        {/* Header */}
        <div className="pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Clock className="w-5 h-5 text-orange-500" />
              {timeoutActive ? 'Timeout In Progress' : 'Call Timeout'}
            </h3>
            
            {!timeoutActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 w-8 p-0 hover:bg-red-500/10 hover:border-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          {!timeoutActive ? (
            // SELECTION STATE
            <div className="space-y-6">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Team
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedTeam('A')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTeam === 'A'
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white mb-1">
                        {teamAName}
                      </div>
                      <div className="text-xs text-gray-400">Team A</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTeam('B')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTeam === 'B'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-white mb-1">
                        {teamBName}
                      </div>
                      <div className="text-xs text-gray-400">Team B</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Timeout Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Timeout Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedType('full')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === 'full'
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">60s</div>
                      <div className="text-xs text-gray-400">Full Timeout</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedType('30_second')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === '30_second'
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-800 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">30s</div>
                      <div className="text-xs text-gray-400">Short Timeout</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-12 hover:bg-gray-700 hover:border-gray-500"
                  disabled={isStarting}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleStart}
                  disabled={!selectedTeam || isStarting}
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStarting ? 'Starting...' : 'Start Timeout'}
                </Button>
              </div>
            </div>
          ) : (
            // ACTIVE TIMEOUT STATE
            <div className="space-y-6">
              {/* Timeout Info */}
              <div 
                className="p-6 rounded-xl border-2"
                style={{ 
                  borderColor: '#f97316',
                  background: 'rgba(249, 115, 22, 0.15)'
                }}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-400 mb-1">
                      {currentTeamName}
                    </div>
                    <div className="text-sm text-gray-300">
                      {selectedType === 'full' ? 'Full Timeout (60s)' : '30-Second Timeout'}
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="text-center">
                  <div 
                    className="text-6xl font-bold text-white mb-2 font-mono tracking-wider"
                    style={{ 
                      textShadow: '0 0 20px rgba(249, 115, 22, 0.5)'
                    }}
                  >
                    {formatTime(timeoutSecondsRemaining)}
                  </div>
                  <div className="text-sm text-gray-400">
                    Time Remaining
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                    style={{ 
                      width: `${(timeoutSecondsRemaining / (selectedType === 'full' ? 60 : 30)) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div 
                className="p-4 rounded-lg border"
                style={{ 
                  borderColor: '#475569',
                  background: '#334155'
                }}
              >
                <p className="text-sm text-center text-gray-300">
                  ⏸️ <strong className="text-white">All clocks paused</strong>
                </p>
                <p className="text-xs text-center text-gray-400 mt-2">
                  Stat entry is disabled during timeout
                </p>
              </div>

              {/* Resume Button */}
              <Button
                onClick={handleResumePlay}
                className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-bold text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume Play
              </Button>

              {/* Auto-resume warning if time expires */}
              {timeoutSecondsRemaining <= 5 && (
                <div className="text-center">
                  <p className="text-xs text-yellow-400 animate-pulse">
                    ⚠️ Timeout ending soon - Resume play manually
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

