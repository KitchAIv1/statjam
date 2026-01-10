// ============================================================================
// USE COACH PROFILE HOOK
// ============================================================================
// Purpose: Custom hook for coach profile data and actions
// ⚡ Optimized with keepPreviousData pattern - no loading flash on return
// Follows .cursorrules: <100 lines, single responsibility
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { CoachProfile, ProfileUpdateRequest } from '@/lib/types/profile';
import { ProfileService } from '@/lib/services/profileService';
import { cache, CacheTTL } from '@/lib/utils/cache';

// Cache key for coach profile
const getProfileCacheKey = (userId: string) => `coach_profile:${userId}`;

interface UseCoachProfileReturn {
  profileData: CoachProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: ProfileUpdateRequest) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

export function useCoachProfile(userId: string): UseCoachProfileReturn {
  // ⚡ Check cache SYNCHRONOUSLY on initial render - prevents spinner flash
  const [profileData, setProfileData] = useState<CoachProfile | null>(() => {
    if (userId) {
      return cache.get<CoachProfile>(getProfileCacheKey(userId));
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if no cached data
    return userId ? !cache.get(getProfileCacheKey(userId)) : true;
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async (skipCache = false) => {
    if (!userId) return;
    
    const cacheKey = getProfileCacheKey(userId);
    const cached = cache.get<CoachProfile>(cacheKey);
    
    // ⚡ Return cached data immediately (unless skipCache)
    if (!skipCache && cached) {
      setProfileData(cached);
      setLoading(false);
      return;
    }

    // ⚡ Only show loading if NO cached data exists
    if (!cached) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const fetchedProfile = await ProfileService.getCoachProfile(userId);
      
      if (fetchedProfile) {
        cache.set(cacheKey, fetchedProfile, CacheTTL.coachDashboard);
        setProfileData(fetchedProfile);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      // ⚡ Keep showing cached data on error
      if (!cached) {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update profile with optimistic updates
  const updateProfile = async (updates: ProfileUpdateRequest): Promise<boolean> => {
    try {
      // ⚡ Optimistic update - update cache and state immediately
      const cacheKey = getProfileCacheKey(userId);
      if (profileData) {
        const updatedProfile = {
          ...profileData,
          name: updates.name,
          bio: updates.bio,
          location: updates.location,
          socialLinks: updates.socialLinks,
          profilePhotoUrl: updates.profilePhotoUrl
        };
        setProfileData(updatedProfile);
        cache.set(cacheKey, updatedProfile, CacheTTL.coachDashboard);
      }

      const success = await ProfileService.updateProfile(userId, updates);
      
      if (!success) {
        await fetchProfile(true); // Skip cache on rollback
      }
      
      return success;
    } catch (err) {
      await fetchProfile(true); // Skip cache on rollback
      return false;
    }
  };

  // Refresh profile data (force skip cache)
  const refreshProfile = async () => {
    await fetchProfile(true);
  };

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId, fetchProfile]);

  return { profileData, loading, error, updateProfile, refreshProfile };
}

