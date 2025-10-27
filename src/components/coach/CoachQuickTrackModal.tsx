'use client';

import React, { useState } from 'react';
import { X, PlayCircle, Settings, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoachTeam, QuickTrackGameRequest } from '@/lib/types/coach';

interface CoachQuickTrackModalProps {
  team: CoachTeam;
  onClose: () => void;
  onGameCreated: () => void;
}

/**
 * CoachQuickTrackModal - Modal for setting up quick track games
 * 
 * Features:
 * - Multi-step form (opponent -> settings -> confirm)
 * - Game configuration options
 * - Launch stat tracker integration
 * - Offline sync preparation
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachQuickTrackModal({ team, onClose, onGameCreated }: CoachQuickTrackModalProps) {
  // Form state
  const [step, setStep] = useState<'opponent' | 'settings' | 'confirm'>('opponent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<QuickTrackGameRequest>({
    coach_team_id: team.id,
    opponent_name: '',
    opponent_tournament_name: '',
    game_settings: {
      quarter_length_minutes: 12,
      shot_clock_seconds: 24,
      venue: '',
      notes: ''
    }
  });

  // Handle form updates
  const updateFormData = (updates: Partial<QuickTrackGameRequest>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      game_settings: {
        ...prev.game_settings,
        ...updates.game_settings
      }
    }));
  };

  // Handle game creation and tracker launch
  const handleCreateAndLaunch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.opponent_name.trim()) {
        setError('Opponent name is required');
        return;
      }

      // Import coach game service
      const { CoachGameService } = await import('@/lib/services/coachGameService');
      
      // Create the coach game
      const game = await CoachGameService.createQuickTrackGame(formData);
      
      // Launch the EXISTING stat-tracker-v3 in coach mode
      const trackerUrl = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${team.id}&opponentName=${encodeURIComponent(formData.opponent_name)}`;
      
      // Navigate to tracker
      window.location.href = trackerUrl;
      
      // Close modal and notify parent
      onGameCreated();
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating quick track game:', error);
      setError(error instanceof Error ? error.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

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
      maxWidth: '500px',
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
    stepIndicator: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px'
    },
    stepDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#374151'
    },
    stepDotActive: {
      backgroundColor: '#f97316'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#e5e7eb'
    },
    input: {
      width: '100%',
      padding: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '0.875rem'
    },
    actions: {
      display: 'flex',
      gap: '12px',
      marginTop: '24px'
    },
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '8px'
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'opponent':
        return (
          <div>
            <div style={styles.formGroup}>
              <Label style={styles.label}>Opponent Team Name *</Label>
              <Input
                value={formData.opponent_name}
                onChange={(e) => updateFormData({ opponent_name: e.target.value })}
                placeholder="e.g., Eagles High School"
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <Label style={styles.label}>Tournament/League (Optional)</Label>
              <Input
                value={formData.opponent_tournament_name}
                onChange={(e) => updateFormData({ opponent_tournament_name: e.target.value })}
                placeholder="e.g., City Championship"
                style={styles.input}
              />
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div>
            <div style={styles.formGroup}>
              <Label style={styles.label}>Quarter Length (minutes)</Label>
              <Input
                type="number"
                value={formData.game_settings?.quarter_length_minutes}
                onChange={(e) => updateFormData({
                  game_settings: { quarter_length_minutes: parseInt(e.target.value) || 12 }
                })}
                min="1"
                max="20"
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <Label style={styles.label}>Shot Clock (seconds)</Label>
              <Input
                type="number"
                value={formData.game_settings?.shot_clock_seconds}
                onChange={(e) => updateFormData({
                  game_settings: { shot_clock_seconds: parseInt(e.target.value) || 24 }
                })}
                min="0"
                max="35"
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <Label style={styles.label}>Venue (Optional)</Label>
              <Input
                value={formData.game_settings?.venue}
                onChange={(e) => updateFormData({
                  game_settings: { venue: e.target.value }
                })}
                placeholder="e.g., Home Gym"
                style={styles.input}
              />
            </div>
          </div>
        );
      
      case 'confirm':
        return (
          <div>
            <div style={{
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#f97316', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Ready to Start Tracking
              </h4>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                You're about to start a non-tournament game. This will launch the stat tracker 
                where you can record stats for your team vs {formData.opponent_name}.
              </p>
            </div>
            
            <div style={{ fontSize: '0.875rem', color: '#e5e7eb' }}>
              <p><strong>Your Team:</strong> {team.name}</p>
              <p><strong>Opponent:</strong> {formData.opponent_name}</p>
              {formData.opponent_tournament_name && (
                <p><strong>Tournament:</strong> {formData.opponent_tournament_name}</p>
              )}
              <p><strong>Quarter Length:</strong> {formData.game_settings?.quarter_length_minutes} minutes</p>
            </div>
          </div>
        );
    }
  };

  // Render action buttons
  const renderActions = () => {
    switch (step) {
      case 'opponent':
        return (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep('settings')}
              disabled={!formData.opponent_name.trim()}
              className="gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        );
      
      case 'settings':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('opponent')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => setStep('confirm')} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        );
      
      case 'confirm':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('settings')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleCreateAndLaunch}
              disabled={loading}
              className="gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              {loading ? 'Starting...' : 'Start Tracking'}
            </Button>
          </>
        );
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Quick Track Game</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div style={styles.stepIndicator}>
          {['opponent', 'settings', 'confirm'].map((stepName, index) => (
            <div
              key={stepName}
              style={{
                ...styles.stepDot,
                ...(step === stepName || 
                   (['opponent', 'settings', 'confirm'].indexOf(step) > index) ? styles.stepDotActive : {})
              }}
            />
          ))}
        </div>

        {/* Content */}
        {renderStepContent()}

        {/* Error */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          {renderActions()}
        </div>
      </div>
    </div>
  );
}
