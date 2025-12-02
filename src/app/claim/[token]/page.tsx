'use client';

/**
 * Player Claim Page
 * 
 * Allows custom players to claim their profile and become full StatJam users.
 * URL: /claim/[token]
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayerClaim } from '@/hooks/usePlayerClaim';
import { ClaimPreviewCard } from './ClaimPreviewCard';
import { ClaimSignUpForm } from './ClaimSignUpForm';
import { Loader2, CheckCircle, XCircle, Copy, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ClaimPage() {
  const params = useParams();
  const token = params.token as string;
  
  const { 
    status, 
    preview, 
    errorMessage, 
    isAuthenticated,
    userRole,
    userName,
    handleClaim,
    handleSignUpSuccess,
    setError
  } = usePlayerClaim(token);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-orange-500">STAT</span>JAM
          </h1>
          <p className="text-gray-400">Claim Your Player Profile</p>
        </div>

        {/* Content based on status */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {status === 'loading' && <LoadingState />}
          {status === 'invalid' && <InvalidState message={errorMessage} />}
          {status === 'valid' && preview && (
            <ValidState
              preview={preview}
              isAuthenticated={isAuthenticated}
              userRole={userRole}
              userName={userName}
              claimToken={token}
              onClaim={handleClaim}
              onSignUpSuccess={handleSignUpSuccess}
              onError={setError}
            />
          )}
          {status === 'claiming' && <ClaimingState />}
          {status === 'success' && <SuccessState playerName={preview?.name} />}
          {status === 'error' && <ErrorState message={errorMessage} onRetry={handleClaim} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATE COMPONENTS (kept small, single responsibility)
// ═══════════════════════════════════════════════════════════════

function LoadingState() {
  return (
    <div className="p-8 text-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-300">Validating claim link...</p>
    </div>
  );
}

function InvalidState({ message }: { message: string | null }) {
  return (
    <div className="p-8 text-center">
      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Invalid Link</h2>
      <p className="text-gray-400 mb-6">{message || 'This claim link is invalid or has expired.'}</p>
      <Link
        href="/"
        className="inline-block px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
      >
        Go Home
      </Link>
    </div>
  );
}

interface ValidStateProps {
  preview: NonNullable<ReturnType<typeof usePlayerClaim>['preview']>;
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  claimToken: string;
  onClaim: () => void;
  onSignUpSuccess: (userId: string) => void;
  onError: (message: string) => void;
}

function ValidState({ 
  preview, 
  isAuthenticated, 
  userRole, 
  userName, 
  claimToken, 
  onClaim, 
  onSignUpSuccess, 
  onError 
}: ValidStateProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleError = (message: string) => {
    setFormError(message);
    onError(message);
  };

  // Check if logged-in user is a coach/organizer (not the intended player)
  const isCoachOrOrganizer = isAuthenticated && (userRole === 'coach' || userRole === 'organizer');
  const claimUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/claim/${claimToken}` 
    : `/claim/${claimToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="p-6">
      <ClaimPreviewCard preview={preview} />
      
      <div className="mt-6">
        {isCoachOrOrganizer ? (
          // Coach/Organizer View: Show share instructions
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm text-center">
                You&apos;re logged in as <span className="font-semibold text-white">{userName || userRole}</span>.
              </p>
              <p className="text-gray-400 text-sm text-center mt-2">
                Share this link with <span className="font-semibold text-orange-400">{preview.name}</span> so they can create their account and claim their profile.
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-green-400" />
                  Link Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Claim Link
                </>
              )}
            </button>
          </div>
        ) : isAuthenticated ? (
          // Authenticated Player View: Can claim directly
          <button
            onClick={onClaim}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition"
          >
            Claim This Profile
          </button>
        ) : (
          // Not Authenticated: Show sign-up form
          <div className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
                {formError}
              </div>
            )}
            <ClaimSignUpForm
              playerName={preview.name}
              onSuccess={onSignUpSuccess}
              onError={handleError}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ClaimingState() {
  return (
    <div className="p-8 text-center">
      <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
      <p className="text-gray-300">Claiming your profile...</p>
      <p className="text-gray-500 text-sm mt-2">Transferring stats and awards</p>
    </div>
  );
}

function SuccessState({ playerName }: { playerName?: string }) {
  return (
    <div className="p-8 text-center">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Profile Claimed!</h2>
      <p className="text-gray-400 mb-2">
        Welcome to StatJam{playerName ? `, ${playerName}` : ''}!
      </p>
      <p className="text-gray-500 text-sm">Redirecting to your dashboard...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="p-8 text-center">
      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Claim Failed</h2>
      <p className="text-gray-400 mb-6">{message || 'Something went wrong. Please try again.'}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
      >
        Try Again
      </button>
    </div>
  );
}

