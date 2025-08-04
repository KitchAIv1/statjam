import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserService, UserProfile } from '@/lib/services/userService';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  userRole: 'organizer' | 'stat_admin' | 'player' | 'fan' | null;
  subscription?: any;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setUserRole: (role: 'organizer' | 'stat_admin' | 'player' | 'fan' | null) => void;
  forceComplete: () => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  loading: true,
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
      set({ loading: true, initialized: false });
      
      // Simple approach - just set up the auth listener and let it handle everything
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔧 Auth Store: Auth state changed:', { event, hasSession: !!session });
        
        if (session?.user) {
          console.log('🔧 Auth Store: User found:', session.user.email);
          
          // Get role from metadata immediately for fast loading
          const role = session.user.user_metadata?.role || 'player';
          console.log('🔧 Auth Store: Using role from metadata:', role);
          
          set({ 
            user: session.user, 
            userRole: role, 
            loading: false, 
            initialized: true 
          });
          
          // Try to get profile in background (don't block UI)
          try {
            const profile = await UserService.getUserProfile(true);
            if (profile) {
              console.log('🔧 Auth Store: Profile loaded:', profile.role);
              set({ userProfile: profile, userRole: profile.role });
            }
          } catch (error) {
            console.log('🔧 Auth Store: Profile fetch failed, keeping metadata role');
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
      
      // Get initial session state
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔧 Auth Store: Initial session found');
          const role = session.user.user_metadata?.role || 'player';
          set({ 
            user: session.user, 
            userRole: role, 
            loading: false, 
            initialized: true 
          });
        } else {
          console.log('🔧 Auth Store: No initial session');
          set({ loading: false, initialized: true });
        }
      } catch (sessionError) {
        console.log('🔧 Auth Store: Session check failed, relying on listener');
        set({ loading: false, initialized: true });
      }
      
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
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    
    // Clear user state immediately without setting loading: true
    set({ user: null, userProfile: null, userRole: null, loading: false, subscription: null });
  }
}));