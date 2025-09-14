import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { safeSupabase } from '@/lib/supabaseClient';
import { UserService, UserProfile } from '@/lib/services/userService';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  userRole: 'organizer' | 'stat_admin' | 'player' | 'fan' | 'admin' | null;
  subscription?: any;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setUserRole: (role: 'organizer' | 'stat_admin' | 'player' | 'fan' | 'admin' | null) => void;
  forceComplete: () => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: false,
  initialized: false,
  userRole: null,
  subscription: null,
  
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setUserRole: (userRole) => set({ userRole }),
  
  // Emergency function to force auth to complete
  forceComplete: () => {
    console.log('🚨 Auth Store: Force completing initialization');
    set({ 
      user: null, 
      userProfile: null, 
      userRole: null, 
      loading: false, 
      initialized: true 
    });
  },
  
  initialize: async () => {
    try {
      console.log('🔧 Auth Store: Starting initialization...');
      
      // Quick session check with timeout - don't block UI
      const sessionCheck = async () => {
        try {
          const { data: { session } } = await safeSupabase().auth.getSession();
          if (session?.user) {
            console.log('🔧 Auth Store: Initial session found');
            
            // Check if email is confirmed
            if (!session.user.email_confirmed_at) {
              console.log('🔧 Auth Store: Email not confirmed in initial session');
              return false;
            }
            
            // Fetch role from database users table
            try {
              const userProfile = await UserService.getUserProfile(true);
              const role = userProfile?.role || 'player';
              console.log('🔧 Auth Store: Fetched role from database:', role);
              
              set({ 
                user: session.user, 
                userProfile,
                userRole: role, 
                loading: false, 
                initialized: true 
              });
            } catch (error) {
              console.error('🔧 Auth Store: Failed to fetch user profile, using fallback');
              const role = session.user.user_metadata?.role || 'player';
              set({ 
                user: session.user, 
                userRole: role, 
                loading: false, 
                initialized: true 
              });
            }
            return true;
          }
        } catch (error) {
          console.log('🔧 Auth Store: Session check failed');
        }
        return false;
      };

      // Try session check with 1 second timeout
      const sessionFound = await Promise.race([
        sessionCheck(),
        new Promise(resolve => setTimeout(() => resolve(false), 1000))
      ]);

      if (!sessionFound) {
        console.log('🔧 Auth Store: No session or timeout, setting up listener');
        set({ loading: false, initialized: true });
      }
      
      // Set up auth listener for future changes
      const { data: { subscription } } = safeSupabase().auth.onAuthStateChange(async (event, session) => {
        console.log('🔧 Auth Store: Auth state changed:', { event, hasSession: !!session });
        
        if (session?.user) {
          console.log('🔧 Auth Store: User found:', session.user.email);
          
          // Check if email is confirmed
          if (!session.user.email_confirmed_at) {
            console.log('🔧 Auth Store: Email not confirmed, keeping user logged out');
            set({ 
              user: null, 
              userProfile: null, 
              userRole: null, 
              loading: false, 
              initialized: true 
            });
            return;
          }
          
          // Fetch role from database users table
          try {
            const userProfile = await UserService.getUserProfile(true);
            const role = userProfile?.role || 'player';
            console.log('🔧 Auth Store: Auth state change - fetched role from database:', role);
            
            set({ 
              user: session.user, 
              userProfile,
              userRole: role, 
              loading: false, 
              initialized: true 
            });
          } catch (error) {
            console.error('🔧 Auth Store: Failed to fetch user profile on auth change, using fallback');
            const role = session.user.user_metadata?.role || 'player';
            set({ 
              user: session.user, 
              userRole: role, 
              loading: false, 
              initialized: true 
            });
          }
        } else {
          console.log('🔧 Auth Store: No user session');
          set({ 
            user: null, 
            userProfile: null, 
            userRole: null, 
            loading: false, 
            initialized: true 
          });
        }
      });
      
      set({ subscription });
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        user: null, 
        userProfile: null, 
        userRole: null, 
        loading: false, 
        initialized: true 
      });
    }
  },
  
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      console.log('Refreshing user profile...');
      const profile = await UserService.getUserProfile();
      if (profile) {
        set({ userProfile: profile, userRole: profile.role });
        console.log('Profile refreshed successfully:', profile.role);
      } else {
        console.log('Profile refresh failed - using auth metadata');
        const role = user.user_metadata?.role || 'player';
        set({ userRole: role });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
  
  logout: async () => {
    // Clean up subscription
    const { subscription } = get();
    if (subscription) {
      subscription.unsubscribe();
    }
    
    const { error } = await safeSupabase().auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    
    // Clear user state immediately without setting loading: true
    set({ user: null, userProfile: null, userRole: null, loading: false, subscription: null });
  }
}));