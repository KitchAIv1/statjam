'use client';

import React from 'react';
import { SubstitutionModalHeader } from './SubstitutionModalHeader';
import { SubstitutionPlayerGrid } from './SubstitutionPlayerGrid';
import { SubstitutionModalActions } from './SubstitutionModalActions';
import { useSubstitutionModalV2 } from '@/hooks/useSubstitutionModalV2';
import { SubstitutionPreview } from './SubstitutionPreview';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionModalV4Props {
  isOpen: boolean;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
  teamAOnCourt: Player[];
  teamABench: Player[];
  teamBOnCourt: Player[];
  teamBBench: Player[];
  onConfirm: (substitutions: Array<{ playerOutId: string; playerInId: string }>) => void;
  onPlayerUpdate?: (playerId: string, updatedPlayer: Player) => void;
  initialTeam?: 'teamA' | 'teamB' | null;
}

export function SubstitutionModalV4({
  isOpen,
  onClose,
  teamAName,
  teamBName,
  teamAOnCourt,
  teamABench,
  teamBOnCourt,
  teamBBench,
  onConfirm,
  onPlayerUpdate,
  initialTeam = null
}: SubstitutionModalV4Props) {
  const {
    multiSelectMode,
    setMultiSelectMode,
    selectedPlayersOut,
    setSelectedPlayersOut,
    selectedPlayersIn,
    setSelectedPlayersIn,
    previewSubstitutions,
    setPreviewSubstitutions,
    activeTeam,
    handleOnCourtPlayerClick,
    handleBenchPlayerClick,
    handleDeselectOnCourt,
    handleDeselectBench,
    handleConfirm,
    handleTeamSwitch,
    getCurrentTeamPlayers
  } = useSubstitutionModalV2({
    isOpen,
    teamAOnCourt,
    teamABench,
    teamBOnCourt,
    teamBBench,
    initialTeam
  });

  if (!isOpen) return null;

  const { onCourt, bench } = getCurrentTeamPlayers();
  const currentTeamName = activeTeam === 'teamA' ? teamAName : teamBName;

  const handleJerseyUpdate = (playerId: string, updatedPlayer: Player) => {
    onPlayerUpdate?.(playerId, updatedPlayer);
  };

  const handleConfirmWrapper = () => {
    handleConfirm(onConfirm, onClose);
  };

  // Combine selections for display
  const allSelectedPlayers = new Set([...selectedPlayersOut, ...selectedPlayersIn]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className="relative w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col rounded-xl border shadow-2xl"
        style={{ 
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          borderWidth: '2px'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0">
          <SubstitutionModalHeader
            onClose={onClose}
            multiSelectMode={multiSelectMode}
            isMultiSelectEnabled={true}
            onMultiSelectToggle={(enabled) => {
              setMultiSelectMode(enabled);
              if (!enabled) {
                // Clear selections when disabling multi-select
                setSelectedPlayersOut(new Set());
                setSelectedPlayersIn(new Set());
                setPreviewSubstitutions(new Map());
              }
            }}
            selectedCount={selectedPlayersOut.size}
            onSelectAllBench={() => {
              // Not applicable in new flow
            }}
            onDeselectAll={() => {
              setSelectedPlayersOut(new Set());
              setSelectedPlayersIn(new Set());
              setPreviewSubstitutions(new Map());
            }}
          />

          {/* Team Selector */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-700">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Select Team:</span>
              <button
                onClick={() => handleTeamSwitch('teamA')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTeam === 'teamA'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {teamAName}
              </button>
              <button
                onClick={() => handleTeamSwitch('teamB')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTeam === 'teamB'
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {teamBName}
              </button>
            </div>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-6 space-y-6 min-h-0">
          {/* Instructions */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-white">
              {multiSelectMode ? 'Select Multiple Players' : 'Select Players to Substitute'}
            </h3>
            <p className="text-sm text-gray-300">
              {multiSelectMode 
                ? `Select ${selectedPlayersOut.size > 0 ? selectedPlayersOut.size : 'on-court'} on-court player(s), then select matching bench player(s)`
                : 'Click an on-court player, then click a bench player to preview substitution'}
            </p>
            {multiSelectMode && selectedPlayersOut.size > 0 && selectedPlayersIn.size !== selectedPlayersOut.size && (
              <p className="text-sm text-yellow-400 mt-2 font-semibold">
                ⚠️ Select {selectedPlayersOut.size - selectedPlayersIn.size} more bench player(s) to match
              </p>
            )}
          </div>

          {/* Preview Section */}
          {previewSubstitutions.size > 0 && (
            <SubstitutionPreview
              previewSubstitutions={previewSubstitutions}
              onCourtPlayers={onCourt}
              benchPlayers={bench}
              onRemove={handleDeselectOnCourt}
            />
          )}

          {/* Player Lists - Side by Side */}
          <SubstitutionPlayerGrid
            onCourtPlayers={onCourt}
            benchPlayers={bench}
            selectedPlayers={allSelectedPlayers}
            selectedPlayersOut={selectedPlayersOut}
            selectedPlayersIn={selectedPlayersIn}
            multiSelectMode={multiSelectMode}
            onCourtPlayerSelect={handleOnCourtPlayerClick}
            onBenchPlayerSelect={handleBenchPlayerClick}
            onCourtPlayerDeselect={handleDeselectOnCourt}
            onBenchPlayerDeselect={handleDeselectBench}
            onJerseyUpdate={handleJerseyUpdate}
          />
        </div>

        {/* Actions - Fixed */}
        <div className="flex-shrink-0 border-t-2 border-slate-700 pt-4 px-6 pb-6 space-y-3">
          <SubstitutionModalActions
            currentStep="player-in-selection"
            multiSelectMode={multiSelectMode}
            selectedPlayersInCount={selectedPlayersIn.size}
            onBack={() => {
              // No back button needed in new flow
            }}
            onConfirm={handleConfirmWrapper}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}

