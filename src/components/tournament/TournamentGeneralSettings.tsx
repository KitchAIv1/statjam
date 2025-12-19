'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import {
  TournamentBasicInfoCard,
  TournamentVisualIdentityCard,
  TournamentStructureCard,
  TournamentScheduleCard,
  TournamentLocationCard,
  TournamentDivisionCard,
} from './settings';

interface LogoUploadState {
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  handleFileSelect: (file: File) => void;
  clearPreview: () => void;
}

interface TournamentGeneralSettingsProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
  logoUpload: LogoUploadState;
  teamDistribution?: { division: string; count: number }[];
}

export function TournamentGeneralSettings({
  tournament,
  onUpdate,
  logoUpload,
  teamDistribution,
}: TournamentGeneralSettingsProps) {
  return (
    <div className="space-y-4">
      {/* Basic Info & Logo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TournamentBasicInfoCard tournament={tournament} onUpdate={onUpdate} />
        <TournamentVisualIdentityCard 
          tournament={tournament} 
          onUpdate={onUpdate}
          logoUpload={logoUpload} 
        />
      </div>

      <TournamentStructureCard tournament={tournament} onUpdate={onUpdate} />
      <TournamentScheduleCard tournament={tournament} onUpdate={onUpdate} />
      <TournamentDivisionCard 
        tournament={tournament} 
        onUpdate={onUpdate}
        teamDistribution={teamDistribution}
      />
      <TournamentLocationCard tournament={tournament} onUpdate={onUpdate} />
    </div>
  );
}
