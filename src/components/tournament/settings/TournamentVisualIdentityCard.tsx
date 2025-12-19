'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';

interface LogoUploadState {
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  handleFileSelect: (file: File) => void;
  clearPreview: () => void;
}

interface TournamentVisualIdentityCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
  logoUpload: LogoUploadState;
}

export function TournamentVisualIdentityCard({ 
  tournament, 
  onUpdate, 
  logoUpload 
}: TournamentVisualIdentityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-primary" />
          Visual Identity
        </CardTitle>
        <CardDescription className="text-xs">Tournament logo and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <Label className="text-sm">Tournament Logo</Label>
        <PhotoUploadField
          label="Upload Logo"
          value={tournament.logo || null}
          previewUrl={logoUpload.previewUrl}
          uploading={logoUpload.uploading}
          error={logoUpload.error}
          aspectRatio="square"
          onFileSelect={logoUpload.handleFileSelect}
          onRemove={() => {
            logoUpload.clearPreview();
            onUpdate({ logo: '' });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Square image recommended (min 256x256px, max 5MB)
        </p>
      </CardContent>
    </Card>
  );
}
