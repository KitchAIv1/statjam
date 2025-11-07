'use client';

import React, { useState, useEffect } from 'react';
import { X, PlayCircle, ArrowRight, ArrowLeft, AlertCircle, Users, Settings, Zap } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoachTeam, QuickTrackGameRequest } from '@/lib/types/coach';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { AutomationFlags, COACH_AUTOMATION_FLAGS } from '@/lib/types/automation';
import { GameServiceV3 } from '@/lib/services/gameServiceV3';

interface CoachQuickTrackModalProps {
  team: CoachTeam;
  onClose: () => void;
  onGameCreated: () => void;
}

/**
 * CoachQuickTrackModal - Modal for setting up quick track games
 * 
 * Features:
 * - Multi-step form (opponent -> settings -> automation -> confirm)
 * - Game configuration options
 * - Automation settings with presets
 * - Launch stat tracker integration
 * - Offline sync preparation
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CoachQuickTrackModal({ team, onClose, onGameCreated }: CoachQuickTrackModalProps) {
  // Form state - ✅ EXTENDED: Added 'automation' step
  const [step, setStep] = useState<'opponent' | 'settings' | 'automation' | 'confirm'>('opponent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NEW: Automation settings state
  const [automationSettings, setAutomationSettings] = useState<AutomationFlags>(COACH_AUTOMATION_FLAGS);
  const [selectedPreset, setSelectedPreset] = useState<'minimal' | 'balanced' | 'full'>('full');
  
  // Player validation state
  const [playerValidation, setPlayerValidation] = useState<{
    isValid: boolean;
    currentCount: number;
    message?: string;
  } | null>(null);
  const [validationLoading, setValidationLoading] = useState(true);

  // Validate players on mount
  useEffect(() => {
    const validatePlayers = async () => {
      try {
        setValidationLoading(true);
        const validation = await CoachPlayerService.validateMinimumPlayers(team.id, 5);
        setPlayerValidation(validation);
        
        if (!validation.isValid) {
          setError(validation.message || 'Validation failed');
        }
      } catch (error) {
        console.error('❌ Error validating players:', error);
        setError('Unable to validate team players');
      } finally {
        setValidationLoading(false);
      }
    };

    validatePlayers();
  }, [team.id]);
  
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

  // ✅ NEW: Handle preset selection
  const handlePresetSelect = (preset: 'minimal' | 'balanced' | 'full') => {
    setSelectedPreset(preset);
    
    switch (preset) {
      case 'minimal':
        setAutomationSettings({
          clock: { enabled: false, autoPause: false, autoReset: false, ftMode: false, madeBasketStop: false },
          possession: { enabled: false, autoFlip: false, persistState: false, jumpBallArrow: false },
          sequences: { enabled: false, promptAssists: false, promptRebounds: false, promptBlocks: false, linkEvents: false, freeThrowSequence: false },
          fouls: { enabled: false, bonusFreeThrows: false, foulOutEnforcement: false, technicalEjection: false },
          undo: { enabled: true, maxHistorySize: 10 }
        });
        break;
      case 'balanced':
        setAutomationSettings({
          clock: { enabled: true, autoPause: true, autoReset: true, ftMode: true, madeBasketStop: false },
          possession: { enabled: true, autoFlip: true, persistState: true, jumpBallArrow: true },
          sequences: { enabled: true, promptAssists: true, promptRebounds: true, promptBlocks: false, linkEvents: true, freeThrowSequence: true },
          fouls: { enabled: true, bonusFreeThrows: true, foulOutEnforcement: false, technicalEjection: false },
          undo: { enabled: true, maxHistorySize: 10 }
        });
        break;
      case 'full':
        setAutomationSettings(COACH_AUTOMATION_FLAGS);
        break;
    }
  };

  // Handle game creation and tracker launch - ✅ EXTENDED: Save automation settings
  const handleCreateAndLaunch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Re-validate players before creating game
      const validation = await CoachPlayerService.validateMinimumPlayers(team.id, 5);
      if (!validation.isValid) {
        setError(validation.message || 'Need at least 5 players to start tracking');
        return;
      }

      // Validate required fields
      if (!formData.opponent_name.trim()) {
        setError('Opponent name is required');
        return;
      }

      // Import coach game service
      const { CoachGameService } = await import('@/lib/services/coachGameService');
      
      // Create the coach game
      const game = await CoachGameService.createQuickTrackGame(formData);
      
      // ✅ NEW: Save automation settings to game
      console.log('💾 Saving automation settings for coach game:', game.id);
      await GameServiceV3.updateGameAutomation(game.id, automationSettings);
      console.log('✅ Automation settings saved successfully');
      
      // Launch the EXISTING stat-tracker-v3 in coach mode
      // ✅ REFINEMENT: No need to pass opponentName - it's stored in the database
      const trackerUrl = `/stat-tracker-v3?gameId=${game.id}&coachMode=true&coachTeamId=${team.id}`;
      
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
      
      // ✅ NEW: Automation step
      case 'automation':
        return (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <Settings style={{ width: '32px', height: '32px', color: '#f97316', margin: '0 auto 8px' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                Automation Settings
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>
                Choose how much automation you want during the game
              </p>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '24px' }}>
              <Label style={{ ...styles.label, marginBottom: '12px' }}>Quick Presets</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {/* Minimal */}
                <button
                  onClick={() => handlePresetSelect('minimal')}
                  style={{
                    padding: '16px 12px',
                    backgroundColor: selectedPreset === 'minimal' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${selectedPreset === 'minimal' ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a1a1aa', marginBottom: '4px' }}>
                    MINIMAL
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Manual</div>
                </button>

                {/* Balanced */}
                <button
                  onClick={() => handlePresetSelect('balanced')}
                  style={{
                    padding: '16px 12px',
                    backgroundColor: selectedPreset === 'balanced' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${selectedPreset === 'balanced' ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a1a1aa', marginBottom: '4px' }}>
                    BALANCED
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Recommended</div>
                </button>

                {/* Full Auto */}
                <button
                  onClick={() => handlePresetSelect('full')}
                  style={{
                    padding: '16px 12px',
                    backgroundColor: selectedPreset === 'full' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${selectedPreset === 'full' ? '#f97316' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                >
                  <Zap style={{ width: '16px', height: '16px', color: '#f97316', margin: '0 auto 4px' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#a1a1aa', marginBottom: '4px' }}>
                    FULL AUTO
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Everything</div>
                </button>
              </div>
            </div>

            {/* Preset Descriptions */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#93c5fd'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#60a5fa' }}>
                What does each preset do?
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Minimal:</strong> Manual control - you manage everything
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Balanced:</strong> Clock + possession + play prompts (recommended)
              </div>
              <div>
                <strong>Full Auto:</strong> Maximum automation for busy coaches
              </div>
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

  // Render action buttons - ✅ EXTENDED: Added automation step navigation
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
            <Button onClick={() => setStep('automation')} className="gap-2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        );
      
      // ✅ NEW: Automation step actions
      case 'automation':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('settings')} className="gap-2">
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
        const canStart = playerValidation?.isValid && !loading && !validationLoading;
        return (
          <>
            <Button variant="outline" onClick={() => setStep('automation')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleCreateAndLaunch}
              disabled={!canStart}
              className="gap-2"
              variant={canStart ? "default" : "secondary"}
            >
              {!playerValidation?.isValid ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Need {5 - (playerValidation?.currentCount || 0)} More Players
                </>
              ) : loading ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Starting...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Start Tracking
                </>
              )}
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

        {/* Step Indicator - ✅ EXTENDED: Added automation step */}
        <div style={styles.stepIndicator}>
          {['opponent', 'settings', 'automation', 'confirm'].map((stepName, index) => (
            <div
              key={stepName}
              style={{
                ...styles.stepDot,
                ...(step === stepName || 
                   (['opponent', 'settings', 'automation', 'confirm'].indexOf(step) > index) ? styles.stepDotActive : {})
              }}
            />
          ))}
        </div>

        {/* Player Validation Warning */}
        {!validationLoading && playerValidation && !playerValidation.isValid && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
            <div>
              <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '500' }}>
                Insufficient Players
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '2px' }}>
                {playerValidation.message} Add more players to continue.
              </div>
            </div>
          </div>
        )}

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
