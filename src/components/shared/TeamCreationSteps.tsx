/**
 * Team Creation Steps
 * 
 * Purpose: Step content components for TeamCreationModal
 * Extracted to follow .cursorrules modular design
 * Follows .cursorrules: <200 lines, single responsibility (step rendering only)
 * 
 * @module TeamCreationSteps
 */

'use client';

import React from 'react';
import { Users, UserPlus, Check } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IPlayerManagementService, GenericPlayer } from '@/lib/types/playerManagement';
import { PlayerSelectionList } from './PlayerSelectionList';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { TeamColorPicker } from '@/components/ui/TeamColorPicker';
import { UsePhotoUploadReturn } from '@/hooks/usePhotoUpload';
import { Tournament } from '@/lib/types/tournament';

type Step = 'info' | 'players' | 'confirm';

interface StepIndicatorProps {
  currentStep: Step;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps: Step[] = ['info', 'players', 'confirm'];
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, index) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep === s
                ? 'bg-primary text-primary-foreground'
                : index < currentIndex
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < currentIndex ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 2 && (
            <div className={`w-12 h-0.5 ${
              index < currentIndex
                ? 'bg-green-500'
                : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

interface TeamInfoStepProps {
  teamName: string;
  coachName: string;
  onTeamNameChange: (value: string) => void;
  onCoachNameChange: (value: string) => void;
  logoUpload?: UsePhotoUploadReturn; // Optional logo upload hook
  tournament?: Tournament | null; // Tournament data to check for divisions
  selectedDivision?: string;
  onDivisionChange?: (value: string) => void;
  // Team branding colors
  primaryColor?: string;
  secondaryColor?: string;
  onColorChange?: (field: 'primary_color' | 'secondary_color' | 'accent_color', value: string) => void;
}

export function TeamInfoStep({
  teamName,
  coachName,
  onTeamNameChange,
  onCoachNameChange,
  logoUpload,
  tournament,
  selectedDivision,
  onDivisionChange,
  primaryColor,
  secondaryColor,
  onColorChange
}: TeamInfoStepProps) {
  // Generate division options based on tournament settings
  const divisionOptions = React.useMemo(() => {
    if (!tournament?.has_divisions) return [];
    
    // Use custom names if available, otherwise generate A, B, C, etc.
    if (tournament.division_names && tournament.division_names.length > 0) {
      return tournament.division_names;
    }
    
    // Generate default names (A, B, C, etc.)
    const count = tournament.division_count || 2;
    return Array.from({ length: count }, (_, i) => 
      String.fromCharCode(65 + i)
    );
  }, [tournament]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Team Information</h3>
      </div>

      {/* Team Logo Upload */}
      {logoUpload && (
        <div className="space-y-2">
          <Label>Team Logo (Optional)</Label>
          <PhotoUploadField
            label="Upload Team Logo"
            value={logoUpload.previewUrl || null}
            previewUrl={logoUpload.previewUrl}
            uploading={logoUpload.uploading}
            progress={logoUpload.progress}
            error={logoUpload.error}
            onFileSelect={logoUpload.handleFileSelect}
            onRemove={logoUpload.clearPreview}
            onClearError={logoUpload.clearError}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name *</Label>
        <Input
          id="team-name"
          placeholder="e.g., Warriors, Lakers, Bulls"
          value={teamName}
          onChange={(e) => onTeamNameChange(e.target.value)}
          required
        />
      </div>

      {/* Division Selector (only if tournament uses divisions) */}
      {tournament?.has_divisions && divisionOptions.length > 0 && onDivisionChange && (
        <div className="space-y-2">
          <Label htmlFor="team-division">Division *</Label>
          <Select value={selectedDivision || ''} onValueChange={onDivisionChange}>
            <SelectTrigger id="team-division">
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              {divisionOptions.map((div) => (
                <SelectItem key={div} value={div}>
                  Division {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select which division this team belongs to
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="coach-name">Coach Name (Optional)</Label>
        <Input
          id="coach-name"
          placeholder="e.g., John Smith"
          value={coachName}
          onChange={(e) => onCoachNameChange(e.target.value)}
        />
      </div>

      {/* Team Colors */}
      {onColorChange && (
        <div className="border-t pt-4">
          <TeamColorPicker
            primaryColor={primaryColor || '#111827'}
            secondaryColor={secondaryColor || '#999999'}
            onChange={onColorChange}
          />
        </div>
      )}
    </div>
  );
}

interface AddPlayersStepProps {
  teamId: string;
  tournamentId: string; // For filtering players already in tournament
  service: IPlayerManagementService;
  selectedPlayers: GenericPlayer[];
  onPlayerAdd: (player: GenericPlayer) => void;
  onPlayerRemove: (player: GenericPlayer) => void;
}

export function AddPlayersStep({
  teamId,
  tournamentId,
  service,
  selectedPlayers,
  onPlayerAdd,
  onPlayerRemove
}: AddPlayersStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Add Players (Optional)</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {selectedPlayers.length} selected
        </span>
      </div>

      <PlayerSelectionList
        teamId={teamId}
        tournamentId={tournamentId}
        service={service}
        onPlayerAdd={onPlayerAdd}
        onPlayerRemove={onPlayerRemove}
        showCustomPlayerOption={false}
        deferPersistence={true}
        initialSelectedPlayers={selectedPlayers}
      />
    </div>
  );
}

interface ConfirmStepProps {
  teamName: string;
  coachName: string;
  selectedPlayers: GenericPlayer[];
}

export function ConfirmStep({
  teamName,
  coachName,
  selectedPlayers
}: ConfirmStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Check className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Confirm & Create</h3>
      </div>

      <div className="bg-muted p-4 rounded-lg space-y-3">
        <div>
          <span className="text-sm text-muted-foreground">Team Name:</span>
          <p className="font-semibold">{teamName}</p>
        </div>
        {coachName && (
          <div>
            <span className="text-sm text-muted-foreground">Coach:</span>
            <p className="font-semibold">{coachName}</p>
          </div>
        )}
        <div>
          <span className="text-sm text-muted-foreground">Players:</span>
          <p className="font-semibold">
            {selectedPlayers.length === 0
              ? 'No players (can add later)'
              : `${selectedPlayers.length} player${selectedPlayers.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
}

