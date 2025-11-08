/**
 * Team Creation Modal (Multi-Step)
 * 
 * Purpose: Reusable multi-step modal for creating teams with players
 * Follows CoachQuickTrackModal pattern for consistency
 * Follows .cursorrules: <200 lines, single responsibility (team creation flow)
 * 
 * @module TeamCreationModal
 */

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IPlayerManagementService, GenericPlayer } from '@/lib/types/playerManagement';
import { StepIndicator, TeamInfoStep, AddPlayersStep, ConfirmStep } from './TeamCreationSteps';

interface TeamCreationModalProps {
  tournamentId: string;
  service: IPlayerManagementService;
  onClose: () => void;
  onTeamCreated: (team: any) => void;
}

type Step = 'info' | 'players' | 'confirm';

/**
 * TeamCreationModal - Multi-step team creation flow
 * 
 * Steps:
 * 1. Team Info (name, coach)
 * 2. Add Players (optional, using PlayerSelectionList)
 * 3. Confirm & Create
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function TeamCreationModal({
  tournamentId,
  service,
  onClose,
  onTeamCreated
}: TeamCreationModalProps) {
  const [step, setStep] = useState<Step>('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [teamName, setTeamName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<GenericPlayer[]>([]);
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);

  // Handle team info submission
  const handleTeamInfoNext = () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }
    setError(null);
    setStep('players');
  };

  // Handle player add/remove
  const handlePlayerAdd = (player: GenericPlayer) => {
    setSelectedPlayers(prev => [...prev, player]);
  };

  const handlePlayerRemove = (player: GenericPlayer) => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
  };

  // Handle final creation
  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import TeamService dynamically
      const { TeamService } = await import('@/lib/services/tournamentService');
      
      // Create team
      const newTeam = await TeamService.createTeam({
        name: teamName.trim(),
        coach: coachName.trim() || undefined,
        tournamentId: tournamentId,
      });

      setCreatedTeamId(newTeam.id);

      // If players were selected, add them to the team
      if (selectedPlayers.length > 0) {
        for (const player of selectedPlayers) {
          await service.addPlayerToTeam({
            team_id: newTeam.id,
            player_id: player.id,
          });
        }
      }

      // Success - notify parent
      onTeamCreated(newTeam);
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating team:', error);
      setError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };


  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <TeamInfoStep
            teamName={teamName}
            coachName={coachName}
            onTeamNameChange={setTeamName}
            onCoachNameChange={setCoachName}
          />
        );

      case 'players':
        return (
          <AddPlayersStep
            teamId={createdTeamId || 'temp'}
            tournamentId={tournamentId}
            service={service}
            selectedPlayers={selectedPlayers}
            onPlayerAdd={handlePlayerAdd}
            onPlayerRemove={handlePlayerRemove}
          />
        );

      case 'confirm':
        return (
          <ConfirmStep
            teamName={teamName}
            coachName={coachName}
            selectedPlayers={selectedPlayers}
          />
        );
    }
  };

  // Render actions
  const renderActions = () => (
    <div className="flex gap-3 mt-6">
      {step !== 'info' && (
        <Button
          variant="outline"
          onClick={() => {
            if (step === 'players') setStep('info');
            if (step === 'confirm') setStep('players');
          }}
          disabled={loading}
        >
          Back
        </Button>
      )}
      
      <Button
        variant="outline"
        onClick={onClose}
        disabled={loading}
        className="flex-1"
      >
        Cancel
      </Button>

      <Button
        onClick={() => {
          if (step === 'info') handleTeamInfoNext();
          if (step === 'players') setStep('confirm');
          if (step === 'confirm') handleCreate();
        }}
        disabled={loading || (step === 'info' && !teamName.trim())}
        className="flex-1"
      >
        {loading ? 'Creating...' : step === 'confirm' ? 'Create Team' : 'Next'}
      </Button>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {renderStepContent()}
        {renderActions()}
      </DialogContent>
    </Dialog>
  );
}

