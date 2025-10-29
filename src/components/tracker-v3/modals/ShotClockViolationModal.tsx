'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * ShotClockViolationModal - Alert when shot clock reaches 0
 * 
 * PURPOSE:
 * - Appears when shot clock reaches 0 during active play
 * - Auto-pauses game clock to prevent continued play
 * - Allows recording violation as turnover
 * - Can be dismissed if clock error occurred
 * 
 * NBA RULE:
 * - Team must attempt a shot within 24 seconds (NBA) or 30 seconds (NCAA)
 * - Violation results in turnover and possession change
 * - Shot clock resets to 24s for opponent
 * 
 * PHASE: Clock Automation Enhancement
 */

interface ShotClockViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordViolation: (teamId: string) => void;
  teamWithPossession: string;
  teamName: string;
  autoDismissSeconds?: number; // Optional auto-dismiss timer (default: 10s)
}

export function ShotClockViolationModal({
  isOpen,
  onClose,
  onRecordViolation,
  teamWithPossession,
  teamName,
  autoDismissSeconds = 10
}: ShotClockViolationModalProps) {
  const [countdown, setCountdown] = useState(autoDismissSeconds);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoDismissSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose(); // Auto-dismiss
          return autoDismissSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoDismissSeconds, onClose]);

  if (!isOpen) return null;

  const handleRecordViolation = () => {
    onRecordViolation(teamWithPossession);
    onClose();
  };

  const handleDismiss = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200"
        style={{
          animation: 'pulse 1s ease-in-out infinite'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-500 to-orange-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Shot Clock Violation</h2>
              <p className="text-sm text-white/90 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Game clock auto-paused
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Violation Details */}
          <div className="text-center space-y-2">
            <div className="text-6xl font-bold text-red-500 animate-pulse">
              00
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {teamName}
            </p>
            <p className="text-sm text-gray-600">
              Failed to attempt a shot within the shot clock time limit
            </p>
          </div>

          {/* Rule Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>NBA Rule:</strong> A team must attempt a field goal within 24 seconds of gaining possession. 
              Violation results in a turnover and possession change.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="py-3 text-base font-semibold hover:bg-gray-100"
            >
              Dismiss
            </Button>
            <Button
              onClick={handleRecordViolation}
              className="py-3 text-base font-semibold bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
            >
              Record Violation
            </Button>
          </div>

          {/* Auto-dismiss countdown */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Auto-dismiss in {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

