import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  userRole: 'organizer' | 'stat_admin' | 'player' | 'fan' | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setUserRole: (role: 'organizer' | 'stat_admin' | 'player' | 'fan' | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  userRole: null,
  
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  setUserRole: (userRole) => set({ userRole }),
  
  initialize: async () => {
    try {
      set({ loading: true });
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth session error:', error);
        set({ user: null, userRole: null });
      } else if (session?.user) {
        set({ user: session.user });
        // TODO: Fetch user role from database
        // For now, default to 'organizer' for demo
        set({ userRole: 'organizer' });
      } else {
        set({ user: null, userRole: null });
      }
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set({ user: session.user });
          // TODO: Fetch user role from database
          set({ userRole: 'organizer' });
        } else {
          set({ user: null, userRole: null });
        }
        set({ loading: false });
      });
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, userRole: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  
  logout: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    set({ user: null, userRole: null, loading: false });
  }
}));