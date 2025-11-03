'use client';

import AuthPageV2 from '@/components/auth/AuthPageV2';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'signup' or 'signin'
  const initialMode = mode === 'signup' ? 'signup' : 'signin';

  return <AuthPageV2 initialMode={initialMode} />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}