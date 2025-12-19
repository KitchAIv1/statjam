'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tournament } from '@/lib/types/tournament';
import { TournamentService } from '@/lib/services/tournamentService';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useTournamentStatAdmins } from '@/hooks/useTournamentStatAdmins';
import { notify } from '@/lib/services/notificationService';
import { invalidateOrganizerDashboard, invalidateOrganizerTournaments } from '@/lib/utils/cache';

interface UseTournamentSettingsProps {
  tournament: Tournament | null;
  tournamentId: string;
  userId: string | undefined;
  onTournamentUpdate: (tournament: Tournament) => void;
}

export function useTournamentSettings({
  tournament,
  tournamentId,
  userId,
  onTournamentUpdate,
}: UseTournamentSettingsProps) {
  const [editedTournament, setEditedTournament] = useState<Tournament | null>(tournament);
  const [saving, setSaving] = useState(false);

  // Stat admin management (delegated hook)
  const statAdminManager = useTournamentStatAdmins(tournamentId);

  // Sync edited tournament when source changes
  useEffect(() => {
    if (tournament) {
      setEditedTournament(tournament);
    }
  }, [tournament]);

  // Photo upload hook
  const logoUpload = usePhotoUpload({
    userId: userId || '',
    photoType: 'tournament_logo',
    tournamentId: editedTournament?.id || tournamentId,
    currentPhotoUrl: editedTournament?.logo || null,
    onSuccess: (url) => {
      if (editedTournament) {
        setEditedTournament({ ...editedTournament, logo: url });
      }
    },
  });

  // Save all settings
  const handleSaveSettings = useCallback(async () => {
    if (!editedTournament) return;
    
    setSaving(true);
    try {
      await TournamentService.updateTournament({
        id: editedTournament.id,
        name: editedTournament.name,
        description: editedTournament.description,
        status: editedTournament.status,
        startDate: editedTournament.startDate,
        endDate: editedTournament.endDate,
        maxTeams: editedTournament.maxTeams,
        tournamentType: editedTournament.tournamentType,
        logo: editedTournament.logo,
        venue: editedTournament.venue,
        country: editedTournament.country,
        has_divisions: editedTournament.has_divisions,
        division_count: editedTournament.division_count,
        division_names: editedTournament.division_names,
      });

      await statAdminManager.saveStatAdminAssignments();
      
      onTournamentUpdate(editedTournament);
      
      if (userId) {
        invalidateOrganizerDashboard(userId);
        invalidateOrganizerTournaments(userId);
      }
      
      notify.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      notify.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [editedTournament, userId, onTournamentUpdate, statAdminManager]);

  return {
    editedTournament,
    setEditedTournament,
    saving,
    logoUpload,
    statAdminManager,
    handleSaveSettings,
  };
}
