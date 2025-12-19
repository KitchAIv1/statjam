'use client';

import { useState, useCallback } from 'react';
import { TeamService } from '@/lib/services/tournamentService';

interface StatAdmin {
  id: string;
  name: string;
  email: string;
}

export function useTournamentStatAdmins(tournamentId: string) {
  const [statAdmins, setStatAdmins] = useState<StatAdmin[]>([]);
  const [assignedStatAdmins, setAssignedStatAdmins] = useState<string[]>([]);
  const [loadingStatAdmins, setLoadingStatAdmins] = useState(false);

  const loadStatAdmins = useCallback(async () => {
    setLoadingStatAdmins(true);
    try {
      const admins = await TeamService.getStatAdmins();
      setStatAdmins(admins);
      
      const dbAssignments = await TeamService.getTournamentStatAdmins(tournamentId);
      if (dbAssignments.length > 0) {
        setAssignedStatAdmins(dbAssignments.map(a => a.stat_admin_id));
      }
    } catch (error) {
      console.error('Failed to load stat admins:', error);
    } finally {
      setLoadingStatAdmins(false);
    }
  }, [tournamentId]);

  const handleToggleStatAdmin = useCallback((adminId: string) => {
    setAssignedStatAdmins(prev => 
      prev.includes(adminId)
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  }, []);

  const saveStatAdminAssignments = useCallback(async () => {
    await TeamService.updateTournamentStatAdmins(tournamentId, assignedStatAdmins);
  }, [tournamentId, assignedStatAdmins]);

  return {
    statAdmins,
    assignedStatAdmins,
    loadingStatAdmins,
    loadStatAdmins,
    handleToggleStatAdmin,
    saveStatAdminAssignments,
  };
}
