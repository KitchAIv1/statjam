/**
 * Organizer Service
 * 
 * Purpose: Business logic for fetching organizer data
 * Follows .cursorrules: <200 lines, single responsibility
 */

import { ProfileService } from './profileService';
import { cache } from '@/lib/utils/cache';

export interface OrganizerBasicInfo {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  bio?: string;
}

/**
 * Get basic organizer information
 */
export async function getOrganizerBasicInfo(organizerId: string): Promise<OrganizerBasicInfo | null> {
  if (!organizerId) return null;

  const cacheKey = `organizer:${organizerId}`;
  const cached = cache.get<OrganizerBasicInfo>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const profile = await ProfileService.getOrganizerProfile(organizerId);
    if (!profile) return null;

    const basicInfo: OrganizerBasicInfo = {
      id: profile.id,
      name: profile.name || 'Unknown Organizer',
      profilePhotoUrl: profile.profilePhotoUrl,
      bio: profile.bio
    };

    cache.set(cacheKey, basicInfo, 15); // 15 minutes
    return basicInfo;
  } catch (error) {
    console.error('Error fetching organizer info:', error);
    return null;
  }
}

