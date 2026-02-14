"use client";

import { use, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePublicPlayerProfile } from '@/hooks/usePublicPlayerProfile';
import { PlayerProfileHero } from '@/components/player-profile/PlayerProfileHero';
import { PlayerProfileStats } from '@/components/player-profile/PlayerProfileStats';
import { PlayerProfileGameLog } from '@/components/player-profile/PlayerProfileGameLog';
import { PlayerProfileCareerHighs } from '@/components/player-profile/PlayerProfileCareerHighs';
import { PlayerProfileAwards } from '@/components/player-profile/PlayerProfileAwards';
import { PlayerProfileRecruitment } from '@/components/player-profile/PlayerProfileRecruitment';
import { NavigationHeader } from '@/components/NavigationHeader';
import { SocialFooter } from '@/components/shared/SocialFooter';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Public Player Profile Page
 * 
 * URL: /player/[id]
 * Theme: Cream background with dark accents
 * Only visible for regular/claimed players (not custom players)
 * 
 * Follows .cursorrules: Page component, delegates to child components
 */
export default function PlayerProfilePage({ params }: PageProps) {
  const { id: playerId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile, loading, error, notFound, redirectTo } = usePublicPlayerProfile(playerId);
  
  // ═══════════════════════════════════════════════════════════════
  // CLAIMED PROFILE REDIRECT
  // If this is a claimed custom player, redirect to the new user ID
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (redirectTo) {
      console.log('🔄 PlayerProfilePage: Redirecting claimed profile to:', redirectTo);
      // Preserve any query params (like tournament filter)
      const queryString = searchParams.toString();
      const targetUrl = queryString ? `/player/${redirectTo}?${queryString}` : `/player/${redirectTo}`;
      router.replace(targetUrl);
    }
  }, [redirectTo, router, searchParams]);
  
  // Tournament context from URL (?tournament=TournamentName)
  const tournamentFromUrl = searchParams.get('tournament');
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  
  // Filter games by selected tournament
  const filteredGames = useMemo(() => {
    if (!profile?.allGames) return [];
    const activeTournament = selectedTournament || tournamentFromUrl;
    if (!activeTournament) return profile.allGames;
    return profile.allGames.filter(g => g.tournamentName === activeTournament);
  }, [profile?.allGames, selectedTournament, tournamentFromUrl]);

  // Show loading while redirecting to claimed profile
  if (redirectTo || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationHeader minimal />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <PlayerProfileSkeleton />
        </main>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationHeader minimal />
        <main className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {notFound ? 'Player Not Found' : 'Error Loading Profile'}
          </h1>
          <p className="text-gray-600">
            {notFound 
              ? 'This player profile is not available or does not exist.'
              : 'Something went wrong. Please try again later.'}
          </p>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationHeader minimal />
      
      <main className="pb-16 pt-20">
        {/* Hero Section with Career Stats */}
        <PlayerProfileHero
          identity={profile.identity}
          careerStats={profile.careerStats}
          gamesPlayed={profile.gamesPlayed}
        />

        {/* Main Content */}
        <div className="container mx-auto px-4 max-w-5xl mt-6 space-y-4">
          {/* Bio Section */}
          {profile.identity.bio && (
            <section className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-1 h-full min-h-[40px] bg-gray-900 rounded-full" />
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">About</h2>
                  <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{profile.identity.bio}&rdquo;</p>
                </div>
              </div>
            </section>
          )}

          {/* Tournament Stats - Light Card */}
          {profile.tournamentStats && profile.tournamentStats.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <PlayerProfileStats
                tournamentStats={profile.tournamentStats}
                variant="light"
                initialTournament={tournamentFromUrl || undefined}
                onTournamentChange={setSelectedTournament}
              />
            </section>
          )}

          {/* Game Log - Filtered by selected tournament */}
          <PlayerProfileGameLog
            games={filteredGames}
            tournamentName={selectedTournament || tournamentFromUrl || undefined}
          />

          {/* Career Highs & Awards - Side by Side or Full Width */}
          {(() => {
            const ch = profile.careerHighs;
            const hasCareerHighs = ch.points > 0 || ch.rebounds > 0 || ch.assists > 0 || 
                                   ch.blocks > 0 || ch.steals > 0 || ch.threes > 0;
            const hasAwards = profile.awards && profile.awards.length > 0;
            
            if (!hasCareerHighs && !hasAwards) return null;
            
            // Both exist - side by side
            if (hasCareerHighs && hasAwards) {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PlayerProfileCareerHighs careerHighs={profile.careerHighs} />
                  <PlayerProfileAwards awards={profile.awards || []} />
                </div>
              );
            }
            
            // Only one exists - full width but constrained
            return (
              <div className="max-w-md">
                {hasCareerHighs && <PlayerProfileCareerHighs careerHighs={profile.careerHighs} />}
                {hasAwards && <PlayerProfileAwards awards={profile.awards || []} />}
              </div>
            );
          })()}

          {/* Recruitment Section - Light Card */}
          {profile.identity.isRecruitable && (
            <section className="mt-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <PlayerProfileRecruitment
                recruitmentNote={profile.identity.recruitmentNote}
                contactEmail={profile.identity.contactEmail}
                variant="light"
              />
            </section>
          )}
        </div>
      </main>

      <SocialFooter />
    </div>
  );
}

function PlayerProfileSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Skeleton className="w-32 h-40 rounded-lg bg-gray-200" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-48 bg-gray-200" />
          <Skeleton className="h-5 w-32 bg-gray-200" />
          <div className="flex gap-4 mt-4">
            <Skeleton className="h-12 w-16 bg-gray-200" />
            <Skeleton className="h-12 w-16 bg-gray-200" />
            <Skeleton className="h-12 w-16 bg-gray-200" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-16 bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

