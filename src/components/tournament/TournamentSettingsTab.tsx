'use client';

import React, { useEffect } from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Trophy, Shield, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { TournamentGeneralSettings } from './TournamentGeneralSettings';
import { TournamentStatAdminSettings } from './TournamentStatAdminSettings';
import { TournamentDangerZone } from './TournamentDangerZone';

interface LogoUploadState {
  previewUrl: string | null;
  uploading: boolean;
  error: string | null;
  handleFileSelect: (file: File) => void;
  clearPreview: () => void;
}

interface StatAdminManager {
  statAdmins: { id: string; name: string; email: string }[];
  assignedStatAdmins: string[];
  loadingStatAdmins: boolean;
  loadStatAdmins: () => Promise<void>;
  handleToggleStatAdmin: (adminId: string) => void;
}

interface TournamentSettingsTabProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
  logoUpload: LogoUploadState;
  statAdminManager: StatAdminManager;
  saving: boolean;
  onSave: () => void;
  onDeleteClick: () => void;
  teamDistribution?: { division: string; count: number }[];
}

export function TournamentSettingsTab({
  tournament,
  onUpdate,
  logoUpload,
  statAdminManager,
  saving,
  onSave,
  onDeleteClick,
  teamDistribution,
}: TournamentSettingsTabProps) {
  // Load stat admins when component mounts
  useEffect(() => {
    statAdminManager.loadStatAdmins();
  }, []);

  return (
    <div className="mt-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Trophy className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="stat-admin" className="gap-2">
            <Shield className="w-4 h-4" />
            Stat Admin
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <TournamentGeneralSettings
            tournament={tournament}
            onUpdate={onUpdate}
            logoUpload={logoUpload}
            teamDistribution={teamDistribution}
          />
          <SaveButton saving={saving} onSave={onSave} />
        </TabsContent>

        <TabsContent value="stat-admin" className="space-y-4">
          <TournamentStatAdminSettings
            statAdmins={statAdminManager.statAdmins}
            assignedStatAdmins={statAdminManager.assignedStatAdmins}
            loadingStatAdmins={statAdminManager.loadingStatAdmins}
            onToggleStatAdmin={statAdminManager.handleToggleStatAdmin}
          />
          <SaveButton saving={saving} onSave={onSave} />
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <TournamentDangerZone onDeleteClick={onDeleteClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SaveButton({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-4">
      <Button onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
