// ============================================================================
// USE ORGANIZER PROFILE HOOK
// ============================================================================
// Purpose: Custom hook for organizer profile data and actions
// Follows .cursorrules: <100 lines, single responsibility
// ============================================================================

import { useState, useEffect } from 'react';
import { OrganizerProfile, ProfileUpdateRequest } from '@/lib/types/profile';
import { ProfileService } from '@/lib/services/profileService';

interface UseOrganizerProfileReturn {
  profileData: OrganizerProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: ProfileUpdateRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export function useOrganizerProfile(userId: string): UseOrganizerProfileReturn {
  const [profileData, setProfileData] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedProfile = await ProfileService.getOrganizerProfile(userId);
      
      if (fetchedProfile) {
        setProfileData(fetchedProfile);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('❌ Error fetching organizer profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: ProfileUpdateRequest): Promise<boolean> => {
    try {
      const success = await ProfileService.updateProfile(userId, updates);
      
      if (success) {
        // Refresh profile data after update
        await fetchProfile();
      }
      
      return success;
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      return false;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    await fetchProfile();
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  return {
    profileData,
    loading,
    error,
    updateProfile,
    refreshProfile
  };
}

