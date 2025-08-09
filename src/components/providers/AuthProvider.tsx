'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      console.log('🔧 AuthProvider: Initializing auth store...');
      initialize();
    }
  }, [initialize, initialized]);

  return <>{children}</>;
}