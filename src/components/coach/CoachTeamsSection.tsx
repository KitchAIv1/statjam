'use client';

import React, { useState } from 'react';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CoachTeam } from '@/lib/types/coach';
import { CoachTeamCard } from './CoachTeamCard';
import { CreateCoachTeamModal } from './CreateCoachTeamModal';

interface CoachTeamsSectionProps {
  teams: CoachTeam[];
  loading: boolean;
  error: string | null;
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
export function CoachTeamsSection({ teams, loading, error, onTeamUpdate }: CoachTeamsSectionProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  // Filter teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVisibility = visibilityFilter === 'all' || team.visibility === visibilityFilter;
    
    return matchesSearch && matchesVisibility;
  });

  // Handle create team
  const handleCreateTeam = () => {
    setShowCreateTeam(true);
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

            {/* Teams Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          onClose={() => setShowCreateTeam(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </>
  );
}
