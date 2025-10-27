'use client';

import React, { useState } from 'react';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
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

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      gap: '16px'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#ffffff'
    },
    filters: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap' as const
    },
    searchInput: {
      minWidth: '200px'
    },
    filterButton: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'transparent',
      color: '#a1a1aa',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    filterButtonActive: {
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      color: '#f97316'
    },
    teamsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '60px 20px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      backdropFilter: 'blur(10px)'
    },
    emptyIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 24px',
      color: '#6b7280'
    },
    emptyTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px'
    },
    emptyDesc: {
      fontSize: '1rem',
      color: '#a1a1aa',
      marginBottom: '24px',
      maxWidth: '400px',
      margin: '0 auto 24px'
    },
    stats: {
      display: 'flex',
      gap: '24px',
      marginBottom: '24px',
      fontSize: '0.875rem',
      color: '#a1a1aa'
    }
  };

  // Handle create team
  const handleCreateTeam = () => {
    setShowCreateTeam(true);
  };

  // Handle team created
  const handleTeamCreated = () => {
    setShowCreateTeam(false);
    onTeamUpdate();
  };

  // Error state
  if (error) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>⚠️</div>
        <div style={styles.emptyTitle}>Error Loading Teams</div>
        <div style={styles.emptyDesc}>{error}</div>
        <Button onClick={onTeamUpdate} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>My Teams</h2>
          <Button onClick={handleCreateTeam} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>

        {/* Stats */}
        {teams.length > 0 && (
          <div style={styles.stats}>
            <span>Total: {teams.length}</span>
            <span>Public: {teams.filter(t => t.visibility === 'public').length}</span>
            <span>Private: {teams.filter(t => t.visibility === 'private').length}</span>
            <span>Games: {teams.reduce((sum, t) => sum + (t.games_count || 0), 0)}</span>
          </div>
        )}

        {/* Filters */}
        {teams.length > 0 && (
          <div style={styles.filters}>
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              className="gap-2"
            />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'public', 'private'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setVisibilityFilter(filter as any)}
                  style={{
                    ...styles.filterButton,
                    ...(visibilityFilter === filter ? styles.filterButtonActive : {})
                  }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teams Grid */}
        {loading ? (
          <div style={styles.teamsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #333',
                  borderTop: '3px solid #f97316',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          <div style={styles.teamsGrid}>
            {filteredTeams.map((team) => (
              <CoachTeamCard
                key={team.id}
                team={team}
                onUpdate={onTeamUpdate}
              />
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div style={styles.emptyState}>
            <Search style={styles.emptyIcon} />
            <div style={styles.emptyTitle}>No teams match your search</div>
            <div style={styles.emptyDesc}>
              Try adjusting your search terms or filters
            </div>
            <Button onClick={() => { setSearchTerm(''); setVisibilityFilter('all'); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Users style={styles.emptyIcon} />
            <div style={styles.emptyTitle}>No teams yet</div>
            <div style={styles.emptyDesc}>
              Create your first team to start tracking games and managing your roster
            </div>
            <Button onClick={handleCreateTeam} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Team
            </Button>
          </div>
        )}
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
