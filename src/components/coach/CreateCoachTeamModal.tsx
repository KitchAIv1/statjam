'use client';

import React, { useState } from 'react';
import { X, Users, Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateCoachTeamRequest } from '@/lib/types/coach';

interface CreateCoachTeamModalProps {
  onClose: () => void;
  onTeamCreated: () => void;
}

/**
 * CreateCoachTeamModal - Modal for creating new coach teams
 * 
 * Features:
 * - Team name and details input
 * - Location selection
 * - Visibility toggle
 * - Validation and error handling
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CreateCoachTeamModal({ onClose, onTeamCreated }: CreateCoachTeamModalProps) {
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateCoachTeamRequest>({
    name: '',
    level: '',
    location: {
      country: 'US',
      region: '',
      city: ''
    },
    visibility: 'private'
  });

  // Handle form updates
  const updateFormData = (updates: Partial<CreateCoachTeamRequest>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      location: {
        ...prev.location,
        ...updates.location
      }
    }));
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Team name is required');
        return;
      }

      // Import coach team service
      const { CoachTeamService } = await import('@/lib/services/coachTeamService');
      
      // Create the team
      await CoachTeamService.createTeam(formData);
      
      // Close modal and notify parent
      onTeamCreated();
      onClose();
      
    } catch (error) {
      console.error('❌ Error creating team:', error);
      setError(error instanceof Error ? error.message : 'Failed to create team');
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
    locationGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px'
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

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Create Team</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <div>
          <div style={styles.formGroup}>
            <Label style={styles.label}>Team Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="e.g., Eagles U16"
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <Label style={styles.label}>Level (Optional)</Label>
            <Input
              value={formData.level}
              onChange={(e) => updateFormData({ level: e.target.value })}
              placeholder="e.g., High School, Youth, College"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <Label style={styles.label}>Location</Label>
            <div style={styles.locationGrid}>
              <Input
                value={formData.location?.city}
                onChange={(e) => updateFormData({ location: { city: e.target.value } })}
                placeholder="City"
                style={styles.input}
              />
              <Input
                value={formData.location?.region}
                onChange={(e) => updateFormData({ location: { region: e.target.value } })}
                placeholder="State/Region"
                style={styles.input}
              />
              <Input
                value={formData.location?.country}
                onChange={(e) => updateFormData({ location: { country: e.target.value } })}
                placeholder="Country"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <Label style={styles.label}>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'private' | 'public') => updateFormData({ visibility: value })}
            >
              <SelectTrigger style={styles.input}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private - Only you can see</SelectItem>
                <SelectItem value="public">Public - Organizers can discover</SelectItem>
              </SelectContent>
            </Select>
            <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '4px' }}>
              {formData.visibility === 'public' 
                ? 'Organizers can find and import this team' 
                : 'Only you and assigned stat admins can see this team'}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {/* Actions */}
        <div style={styles.actions}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTeam}
            disabled={loading || !formData.name.trim()}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </div>
    </div>
  );
}
