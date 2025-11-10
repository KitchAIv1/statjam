// ============================================================================
// USE STAT ADMIN PROFILE HOOK
// ============================================================================
// Purpose: Custom hook for stat admin profile data and actions
// Follows .cursorrules: <100 lines, single responsibility
// ============================================================================

import { useState, useEffect } from 'react';
import { StatAdminProfile, ProfileUpdateRequest } from '@/lib/types/profile';
import { ProfileService } from '@/lib/services/profileService';

interface UseStatAdminProfileReturn {
  profileData: StatAdminProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: ProfileUpdateRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export function useStatAdminProfile(userId: string): UseStatAdminProfileReturn {
  const [profileData, setProfileData] = useState<StatAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedProfile = await ProfileService.getStatAdminProfile(userId);
      
      if (fetchedProfile) {
        setProfileData(fetchedProfile);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('❌ Error fetching stat admin profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile with optimistic updates
  const updateProfile = async (updates: ProfileUpdateRequest): Promise<boolean> => {
    try {
      // ⚡ OPTIMIZATION: Update local state immediately (optimistic update)
      if (profileData) {
        setProfileData({
          ...profileData,
          name: updates.name || profileData.name,
          bio: updates.bio,
          location: updates.location,
          socialLinks: updates.socialLinks,
          profilePhotoUrl: updates.profilePhotoUrl
          // Note: Stats remain unchanged - no need to re-fetch
        });
      }

      // Save to database in background
      const success = await ProfileService.updateProfile(userId, updates);
      
      if (!success) {
        // Rollback on failure - re-fetch to get correct data
        await fetchProfile();
      }
      
      return success;
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      // Rollback on error
      await fetchProfile();
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

