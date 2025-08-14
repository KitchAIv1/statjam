import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'organizer' | 'player' | 'stat_admin';
  country: string;
  premium_status: boolean;
  profile_image?: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  role: 'organizer' | 'player';
  plan: 'free' | 'premium';
  trial_start?: string;
  trial_end?: string;
  status: 'active' | 'expired';
  created_at: string;
}

// User Business Logic Layer
export class UserService {
  // Get current user profile - lightweight version for auth initialization
  static async getUserProfile(skipRetries = false): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return null;
      }

      // Get user profile from users table (single attempt during auth init)
      let { data: profile, error } = await supabase
        .from('users')
        .select('id, email, role, country, premium_status, profile_image, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        // If user not found and retries are allowed, try once more
        if (error.code === 'PGRST116' && !skipRetries) {
          console.log('User profile not found, will retry with auth metadata fallback');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try one more time
          const { data: retryProfile, error: retryError } = await supabase
            .from('users')
            .select('id, email, role, country, premium_status, profile_image, created_at, updated_at')
            .eq('id', user.id)
            .single();
            
          if (retryError) {
            console.log('Profile still not found after retry - using auth metadata');
            return null;
          }
          
          profile = retryProfile;
        } else {
          console.log('User profile not found - may still be syncing');
          return null;
        }
      }

      if (!profile) {
        console.log('User profile not found - may still be syncing');
        return null;
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        country: profile.country,
        premium_status: profile.premium_status,
        profile_image: profile.profile_image,
        firstName: '', // Not stored in backend users table
        lastName: '', // Not stored in backend users table
        createdAt: profile.created_at,
        updatedAt: profile.updated_at || profile.created_at,
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Get user subscription
  static async getUserSubscription(): Promise<UserSubscription | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error getting user:', authError);
        return null;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found (might be stat_admin)
          return null;
        }
        console.error('Error getting user subscription:', error);
        return null;
      }

      return subscription;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error } = await supabase
        .from('users')
        .update({
          country: updates.country,
          profile_image: updates.profile_image,
          firstName: updates.firstName,
          lastName: updates.lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        country: profile.country,
        premium_status: profile.premium_status,
        profile_image: profile.profile_image,
        firstName: profile.firstName,
        lastName: profile.lastName,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error instanceof Error ? error : new Error('Failed to update profile');
    }
  }
}