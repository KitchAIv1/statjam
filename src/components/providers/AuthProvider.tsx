'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      console.log('🔧 AuthProvider: Initializing auth store...');
      initialize();
    }
  }, [initialize, initialized]);

  return <>{children}</>;
}