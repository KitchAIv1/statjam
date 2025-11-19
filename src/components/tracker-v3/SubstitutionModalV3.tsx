'use client';

import React from 'react';
import { SubstitutionModalHeader } from './SubstitutionModalHeader';
import { TeamSelectionStep } from './TeamSelectionStep';
import { PlayerOutSelectionStep } from './PlayerOutSelectionStep';
import { PlayerInSelectionStep } from './PlayerInSelectionStep';
import { SubstitutionModalActions } from './SubstitutionModalActions';
import { useSubstitutionModal } from '@/hooks/useSubstitutionModal';

interface Player {
  id: string;
  name: string;
  jerseyNumber?: number;
  is_custom_player?: boolean;
}

interface SubstitutionModalV3Props {
  isOpen: boolean;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
  teamAOnCourt: Player[];
  teamABench: Player[];
  teamBOnCourt: Player[];
  teamBBench: Player[];
  onConfirm: (playerOutId: string, playerInIds: string[]) => void;
  onPlayerUpdate?: (playerId: string, updatedPlayer: Player) => void;
}

type ModalStep = 'team-selection' | 'player-out-selection' | 'player-in-selection';

export function SubstitutionModalV3({
  isOpen,
  onClose,
  teamAName,
  teamBName,
  teamAOnCourt,
  teamABench,
  teamBOnCourt,
  teamBBench,
  onConfirm,
  onPlayerUpdate
}: SubstitutionModalV3Props) {
  const {
    currentStep,
    selectedTeam,
    selectedPlayerOut,
    multiSelectMode,
    setMultiSelectMode,
    selectedPlayersIn,
    setSelectedPlayersIn,
    localPlayers,
    handleTeamSelect,
    handlePlayerOutSelect,
    handlePlayerInClick,
    handleSelectAllBench,
    handleDeselectAll,
    handleConfirm,
    handleBack,
    handleJerseyUpdate: handleJerseyUpdateHook
  } = useSubstitutionModal({
    isOpen,
    teamAOnCourt,
    teamABench,
    teamBOnCourt,
    teamBBench
  });

  if (!isOpen) return null;

  const handleJerseyUpdate = (playerId: string, updatedPlayer: Player) => {
    handleJerseyUpdateHook(playerId, updatedPlayer);
    onPlayerUpdate?.(playerId, updatedPlayer);
  };

  const handlePlayerInClickWrapper = (playerId: string) => {
    // ✅ Just select the player, don't auto-close
    handlePlayerInClick(playerId);
  };

  const handleConfirmWrapper = () => {
    // ✅ Validate and confirm substitution
    handleConfirm(onConfirm, onClose);
  };

  const handleBackWrapper = () => {
    handleBack(teamAOnCourt, teamABench, teamBOnCourt, teamBBench);
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'team-selection':
        return (
          <TeamSelectionStep
            teamAName={teamAName}
            teamBName={teamBName}
            onSelectTeam={handleTeamSelect}
          />
        );
      
      case 'player-out-selection':
        return (
          <PlayerOutSelectionStep
            onCourtPlayers={localPlayers.onCourt}
            benchPlayers={localPlayers.bench}
            selectedPlayerOut={selectedPlayerOut}
            onSelectPlayerOut={handlePlayerOutSelect}
            onJerseyUpdate={handleJerseyUpdate}
          />
        );
      
      case 'player-in-selection':
        const allTeamPlayers = selectedTeam === 'teamA' 
          ? [...teamAOnCourt, ...teamABench]
          : [...teamBOnCourt, ...teamBBench];
        
        return (
          <PlayerInSelectionStep
            onCourtPlayers={localPlayers.onCourt}
            benchPlayers={localPlayers.bench}
            selectedPlayerOut={selectedPlayerOut}
            selectedPlayersIn={selectedPlayersIn}
            multiSelectMode={multiSelectMode}
            allTeamPlayers={allTeamPlayers}
            onPlayerInSelect={handlePlayerInClickWrapper}
            onPlayerInDeselect={(playerId) => {
              setSelectedPlayersIn(prev => {
                const next = new Set(prev);
                next.delete(playerId);
                return next;
              });
            }}
            onJerseyUpdate={handleJerseyUpdate}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className="relative w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden rounded-xl border shadow-2xl"
        style={{ 
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          borderWidth: '2px'
        }}
        onClick={(e) => {
          // ✅ Prevent modal from closing when clicking inside modal content
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <SubstitutionModalHeader
          onClose={onClose}
          multiSelectMode={currentStep === 'player-in-selection' ? multiSelectMode : false}
          isMultiSelectEnabled={currentStep === 'player-in-selection'}
          onMultiSelectToggle={(enabled) => {
            // ✅ Only allow toggle if in correct step
            if (currentStep === 'player-in-selection') {
              setMultiSelectMode(enabled);
              if (!enabled) {
                setSelectedPlayersIn(new Set());
              }
            }
          }}
          selectedCount={selectedPlayersIn.size}
          onSelectAllBench={handleSelectAllBench}
          onDeselectAll={handleDeselectAll}
        />
        
        {/* Content */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-6 pb-6">
          {renderContent()}
        </div>

        {/* Actions */}
        <div className="border-t-2 border-slate-700 pt-4 px-6 pb-6 space-y-3">
          <SubstitutionModalActions
            currentStep={currentStep}
            multiSelectMode={multiSelectMode}
            selectedPlayersInCount={selectedPlayersIn.size}
            onBack={handleBackWrapper}
            onConfirm={handleConfirmWrapper}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
