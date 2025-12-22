'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Users, Search, Filter, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CoachTeam } from '@/lib/types/coach';
import { CoachTeamCard } from './CoachTeamCard';
import { CreateCoachTeamModal } from './CreateCoachTeamModal';
import { UpgradeModal } from '@/components/subscription';
import { useSubscription } from '@/hooks/useSubscription';

interface CoachTeamsSectionProps {
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
  userId: string; // Coach ID for team creation
  onTeamUpdate: () => void;
}

/**
 * CoachTeamsSection - Teams management section
 * 
 * Features:
 * - Teams grid display
 * - Search and filtering
 * - Create team functionality
 * - Team management actions
 * 
 * Follows .cursorrules: <200 lines, UI component only
 */
export function CoachTeamsSection({ teams, loading, error, userId, onTeamUpdate }: CoachTeamsSectionProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  
  // Subscription gatekeeping
  const { tier: subscriptionTier, refetch: refetchSubscription } = useSubscription('coach');
  const FREE_TEAM_LIMIT = 1;

  // Handle checkout success - refetch subscription when returning from Stripe
  useEffect(() => {
    const checkoutParam = searchParams.get('checkout');
    if (checkoutParam === 'success') {
      console.log('✅ Checkout success detected, refreshing subscription...');
      setCheckoutSuccess(true);
      refetchSubscription();
      
      // Clear the query param after a short delay
      setTimeout(() => {
        router.replace('/dashboard/coach?section=teams', { scroll: false });
        setCheckoutSuccess(false);
      }, 3000);
    }
  }, [searchParams, refetchSubscription, router]);

  // Filter teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVisibility = visibilityFilter === 'all' || team.visibility === visibilityFilter;
    
    return matchesSearch && matchesVisibility;
  });

  // Handle create team with subscription check
  const handleCreateTeam = () => {
    const isFreeTier = subscriptionTier === 'free';
    const atLimit = isFreeTier && teams.length >= FREE_TEAM_LIMIT;
    
    if (atLimit) {
      setShowUpgradeModal(true);
    } else {
      setShowCreateTeam(true);
    }
  };

  // Handle team created
  const handleTeamCreated = () => {
    setShowCreateTeam(false);
    onTeamUpdate();
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6 mt-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2">Error Loading Teams</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            <Button onClick={onTeamUpdate} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 mt-6">
        {/* Checkout Success Banner */}
        {checkoutSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Payment Successful!</p>
              <p className="text-sm text-green-700">Your subscription is now active. Enjoy unlimited access!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">My Teams</CardTitle>
            <Button onClick={handleCreateTeam} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </CardHeader>
          <CardContent>
            {/* Stats */}
            {teams.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                <Badge variant="outline">Total: {teams.length}</Badge>
                <Badge variant="outline">Public: {teams.filter(t => t.visibility === 'public').length}</Badge>
                <Badge variant="outline">Private: {teams.filter(t => t.visibility === 'private').length}</Badge>
                <Badge variant="outline">Games: {teams.reduce((sum, t) => sum + (t.games_count || 0), 0)}</Badge>
              </div>
            )}

            {/* Filters */}
            {teams.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6 items-center">
                <Input
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-[200px] max-w-sm"
                />
                
                <div className="flex gap-2">
                  {['all', 'public', 'private'].map((filter) => (
                    <Button
                      key={filter}
                      variant={visibilityFilter === filter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVisibilityFilter(filter as any)}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Teams Grid - Stale-while-revalidate: Only show skeleton on initial load */}
            {loading && teams.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-8 bg-muted rounded mb-2"></div>
                      <div className="h-12 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTeams.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {filteredTeams.map((team) => (
                  <CoachTeamCard
                    key={team.id}
                    team={team}
                    onUpdate={onTeamUpdate}
                  />
                ))}
              </div>
            ) : teams.length > 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No teams match your search</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Try adjusting your search terms or filters
                </p>
                <Button onClick={() => { setSearchTerm(''); setVisibilityFilter('all'); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Create your first team to start tracking games and managing your roster
                </p>
                <Button onClick={handleCreateTeam} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Team
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <CreateCoachTeamModal
          userId={userId}
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {/* Subscription Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        role="coach"
        currentTier={subscriptionTier}
        triggerReason={`You've reached your free limit of ${FREE_TEAM_LIMIT} team. Upgrade for unlimited teams.`}
      />
    </>
  );
}
