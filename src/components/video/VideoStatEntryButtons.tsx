'use client';

/**
 * VideoStatEntryButtons - Stat entry buttons for bottom section
 * 
 * Displays stat buttons in 2 rows as per new layout design.
 * Row 1: Mode toggles (Court/Manual) + Scoring buttons
 * Row 2: Other stats (AST, REB, STL, BLK, TO, FOUL) + Shot Tracker button
 * 
 * @module VideoStatEntryButtons
 */

import React, { useState } from 'react';
import { Target, Grid3X3, Zap, Hand } from 'lucide-react';
import { ShotTrackerContainer } from '@/components/tracker-v3/shot-tracker/ShotTrackerContainer';
import type { ShotLocationData } from '@/lib/types/shotTracker';

interface VideoStatEntryButtonsProps {
  onStatRecord: (statType: string, modifier?: string, locationData?: ShotLocationData) => void;
  onInitiateTurnover: () => void;
  onInitiateFoul: () => void;
  onInitiateRebound: () => void;
  disabled?: boolean;
  selectedPlayerId: string | null;
  selectedTeamId: string;
  teamAId: string;
  playerName?: string;
  jerseyNumber?: string | number;
  isManualMode: boolean;
  onToggleManualMode: () => void;
}

export function VideoStatEntryButtons({
  onStatRecord,
  onInitiateTurnover,
  onInitiateFoul,
  onInitiateRebound,
  disabled = false,
  selectedPlayerId,
  selectedTeamId,
  teamAId,
  playerName = 'Unknown',
  jerseyNumber,
  isManualMode,
  onToggleManualMode,
}: VideoStatEntryButtonsProps) {
  const [showShotTrackerModal, setShowShotTrackerModal] = useState(false);
  const [inputMode, setInputMode] = useState<'classic' | 'shot_tracker'>('classic');

  const handleStatClick = (statType: string, modifier?: string) => {
    if (disabled) return;
    
    if (statType === 'turnover') {
      onInitiateTurnover();
    } else if (statType === 'foul') {
      onInitiateFoul();
    } else if (statType === 'rebound') {
      onInitiateRebound();
    } else {
      onStatRecord(statType, modifier);
    }
  };

  const handleStatRecordWithLocation = async (
    statType: string,
    modifier: string,
    locationData?: ShotLocationData
  ): Promise<void> => {
    onStatRecord(statType, modifier, locationData);
  };

  return (
    <>
      <div className="flex flex-col gap-3 p-4">
        {/* Row 1: Mode Toggles Only */}
        <div className="flex items-center gap-2">
          {/* Court/Buttons Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setInputMode('classic')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                inputMode === 'classic'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Classic button mode"
            >
              <Grid3X3 className="w-3 h-3" />
              <span>Buttons</span>
            </button>
            <button
              type="button"
              onClick={() => setShowShotTrackerModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              title="Open shot tracker modal"
            >
              <Target className="w-3 h-3" />
              <span>Court</span>
            </button>
          </div>
          
          {/* Manual Mode Toggle */}
          <button
            type="button"
            onClick={onToggleManualMode}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all
              ${isManualMode 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }
            `}
            title={isManualMode 
              ? 'Manual Mode: No auto-prompts' 
              : 'Auto Mode: Prompts for assists, rebounds'
            }
          >
            {isManualMode ? (
              <>
                <Hand className="w-3.5 h-3.5" />
                Manual
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Auto
              </>
            )}
          </button>
        </div>

        {/* Row 2: "Made" Buttons + Other Stats (First Half) - Aligned */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatClick('field_goal', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            2PT Made
          </button>
          <button
            onClick={() => handleStatClick('three_pointer', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            3PT Made
          </button>
          <button
            onClick={() => handleStatClick('free_throw', 'made')}
            disabled={disabled}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            FT Made
          </button>
          <button
            onClick={() => handleStatClick('assist')}
            disabled={disabled}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            AST
          </button>
          <button
            onClick={() => handleStatClick('rebound')}
            disabled={disabled}
            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            REB
          </button>
          <button
            onClick={() => handleStatClick('steal')}
            disabled={disabled}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            STL
          </button>
        </div>

        {/* Row 3: "Missed" Buttons + Other Stats (Second Half) - Aligned */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatClick('field_goal', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-red-400 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            2PT Miss
          </button>
          <button
            onClick={() => handleStatClick('three_pointer', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            3PT Miss
          </button>
          <button
            onClick={() => handleStatClick('free_throw', 'missed')}
            disabled={disabled}
            className="px-3 py-2 bg-rose-400 hover:bg-rose-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            FT Miss
          </button>
          <button
            onClick={() => handleStatClick('block')}
            disabled={disabled}
            className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            BLK
          </button>
          <button
            onClick={() => handleStatClick('turnover')}
            disabled={disabled}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            TO
          </button>
          <button
            onClick={() => handleStatClick('foul')}
            disabled={disabled}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 min-w-[100px]"
          >
            FOUL
          </button>
        </div>
      </div>

      {/* Shot Tracker Modal */}
      {showShotTrackerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Shot Tracker</h3>
              <button
                onClick={() => setShowShotTrackerModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                ×
              </button>
            </div>
            <div className="h-[500px]">
              <ShotTrackerContainer
                selectedPlayerId={selectedPlayerId}
                selectedCustomPlayerId={selectedPlayerId?.startsWith('custom-') ? selectedPlayerId : null}
                selectedTeamId={selectedTeamId}
                teamAId={teamAId}
                playerName={playerName}
                jerseyNumber={jerseyNumber}
                onRecordStat={handleStatRecordWithLocation}
                hasPlayerSelected={!!selectedPlayerId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
