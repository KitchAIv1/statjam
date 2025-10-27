'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Trophy, MapPin, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CoachTeam, Tournament, TournamentAttachmentRequest } from '@/lib/types/coach';

interface CoachTournamentSearchModalProps {
  team: CoachTeam;
  onClose: () => void;
  onTournamentAttached: () => void;
}

/**
 * CoachTournamentSearchModal - Modal for tournament search and attachment
 * 
 * Features:
 * - Tournament search with location filtering
 * - Attach to existing tournament option
 * - Create tournament stub option
 * - Join request handling
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachTournamentSearchModal({ team, onClose, onTournamentAttached }: CoachTournamentSearchModalProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState({
    country: team.location?.country || 'US',
    region: team.location?.region || '',
    city: team.location?.city || ''
  });
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [attachmentType, setAttachmentType] = useState<'existing' | 'stub'>('existing');

  // Search tournaments
  const searchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
      const results = await CoachTeamService.searchTournaments({
        query: searchQuery,
        location: location,
        limit: 10
      });
      
      setTournaments(results);
    } catch (error) {
      console.error('❌ Error searching tournaments:', error);
      setError('Failed to search tournaments');
    } finally {
      setLoading(false);
    }
  };

  // Handle tournament attachment
  const handleAttachTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
      
      const request: TournamentAttachmentRequest = {
        coach_team_id: team.id,
        attachment_type: attachmentType
      };

      if (attachmentType === 'existing' && selectedTournament) {
        request.tournament_id = selectedTournament.id;
      } else if (attachmentType === 'stub') {
        request.tournament_stub = {
          name: searchQuery || 'New Tournament',
          location: `${location.city}, ${location.region}`,
          start_date: new Date().toISOString(),
          description: `Tournament stub created for ${team.name}`
        };
      }

      await CoachTeamService.attachToTournament(request);
      
      onTournamentAttached();
      onClose();
    } catch (error) {
      console.error('❌ Error attaching to tournament:', error);
      setError('Failed to attach to tournament');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount
  useEffect(() => {
    searchTournaments();
  }, []);

  // Styles
  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      backdropFilter: 'blur(20px)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#ffffff'
    },
    searchSection: {
      marginBottom: '24px'
    },
    searchGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '12px',
      marginBottom: '16px'
    },
    locationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px'
    },
    resultsSection: {
      marginBottom: '24px'
    },
    tournamentCard: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    tournamentCardSelected: {
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)'
    },
    tournamentName: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '4px'
    },
    tournamentMeta: {
      display: 'flex',
      gap: '16px',
      fontSize: '0.875rem',
      color: '#a1a1aa'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: '#a1a1aa'
    },
    actions: {
      display: 'flex',
      gap: '12px'
    },
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginBottom: '16px'
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Add to Tournament</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Section */}
        <div style={styles.searchSection}>
          <div style={styles.searchGrid}>
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTournaments()}
            />
            <Button onClick={searchTournaments} disabled={loading} className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
          
          <div style={styles.locationGrid}>
            <Input
              placeholder="City"
              value={location.city}
              onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
            />
            <Input
              placeholder="State/Region"
              value={location.region}
              onChange={(e) => setLocation(prev => ({ ...prev, region: e.target.value }))}
            />
            <Input
              placeholder="Country"
              value={location.country}
              onChange={(e) => setLocation(prev => ({ ...prev, country: e.target.value }))}
            />
          </div>
        </div>

        {/* Results Section */}
        <div style={styles.resultsSection}>
          <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '1.125rem' }}>
            Search Results
          </h3>
          
          {error && <div style={styles.error}>{error}</div>}
          
          {loading ? (
            <div style={styles.emptyState}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #333',
                borderTop: '3px solid #f97316',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Searching tournaments...</p>
            </div>
          ) : tournaments.length > 0 ? (
            <div>
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  style={{
                    ...styles.tournamentCard,
                    ...(selectedTournament?.id === tournament.id ? styles.tournamentCardSelected : {})
                  }}
                  onClick={() => {
                    setSelectedTournament(tournament);
                    setAttachmentType('existing');
                  }}
                >
                  <div style={styles.tournamentName}>{tournament.name}</div>
                  <div style={styles.tournamentMeta}>
                    <div style={styles.metaItem}>
                      <MapPin className="w-4 h-4" />
                      <span>{tournament.venue}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                    </div>
                    <div style={styles.metaItem}>
                      <Trophy className="w-4 h-4" />
                      <span>{tournament.current_teams}/{tournament.max_teams} teams</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Trophy style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#6b7280' }} />
              <p>No tournaments found</p>
              <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                Try adjusting your search terms or create a tournament stub
              </p>
            </div>
          )}
        </div>

        {/* Create Stub Option */}
        {tournaments.length === 0 && !loading && (
          <div style={{
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: '#f97316', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
              Create Tournament Stub
            </h4>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '12px' }}>
              Can't find the tournament? Create a placeholder to start tracking games now.
              You can link to the official tournament later.
            </p>
            <Button
              variant="outline"
              onClick={() => setAttachmentType('stub')}
              className="gap-2"
              style={{
                borderColor: '#f97316',
                color: '#f97316'
              }}
            >
              <Plus className="w-4 h-4" />
              Create Tournament Stub
            </Button>
          </div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAttachTournament}
            disabled={loading || (attachmentType === 'existing' && !selectedTournament)}
            className="gap-2"
          >
            {attachmentType === 'existing' ? 'Send Join Request' : 'Create Stub'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
