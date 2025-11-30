/**
 * CoachFinalScoreSection - Final score display for coach mode
 * 
 * Shows home team score (read-only) and editable opponent score
 * Used in GameCompletionModal for coach mode games
 */

'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface CoachFinalScoreSectionProps {
  teamName: string;
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  onOpponentScoreChange: (score: number) => void;
}

export function CoachFinalScoreSection({
  teamName,
  teamScore,
  opponentName,
  opponentScore,
  onOpponentScoreChange
}: CoachFinalScoreSectionProps) {
  // Local state for raw input (allows empty string while typing)
  const [inputValue, setInputValue] = useState(String(opponentScore));

  // Sync with parent when opponentScore changes externally
  useEffect(() => {
    setInputValue(String(opponentScore));
  }, [opponentScore]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow empty or valid number input
    if (raw === '' || /^\d{0,3}$/.test(raw)) {
      setInputValue(raw);
      // Update parent immediately if valid number
      if (raw !== '') {
        onOpponentScoreChange(parseInt(raw, 10));
      }
    }
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid number (default to 0 if empty)
    const num = parseInt(inputValue, 10);
    const validScore = isNaN(num) ? 0 : Math.max(0, Math.min(999, num));
    setInputValue(String(validScore));
    onOpponentScoreChange(validScore);
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-orange-500" />
        Final Score
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {/* Home Team Score (Read-only) */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">{teamName}</div>
          <div className="text-3xl font-bold text-gray-900">{teamScore}</div>
          <div className="text-xs text-green-600 mt-1">✓ From tracked stats</div>
        </div>
        {/* Opponent Score (Editable) */}
        <div className="bg-white rounded-lg p-4 border border-orange-300">
          <div className="text-sm text-gray-500 mb-1">{opponentName}</div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className="text-3xl font-bold text-orange-600 w-full bg-transparent border-none outline-none focus:ring-0 p-0"
            placeholder="0"
          />
          <div className="text-xs text-orange-600 mt-1">✏️ Edit if needed</div>
        </div>
      </div>
    </div>
  );
}

