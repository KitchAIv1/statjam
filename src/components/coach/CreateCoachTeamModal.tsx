'use client';

import React, { useState } from 'react';
import { X, Users, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Create Team
          </DialogTitle>
          <DialogDescription>
            Create a new team to track games and manage your roster. You can change these settings later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name *</Label>
            <Input
              id="team-name"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="e.g., Eagles U16"
            />
          </div>
          
          {/* Level */}
          <div className="space-y-2">
            <Label htmlFor="level">Level (Optional)</Label>
            <Input
              id="level"
              value={formData.level}
              onChange={(e) => updateFormData({ level: e.target.value })}
              placeholder="e.g., High School, Youth, College"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={formData.location?.city || ''}
                onChange={(e) => updateFormData({ location: { city: e.target.value } })}
                placeholder="City"
              />
              <Input
                value={formData.location?.region || ''}
                onChange={(e) => updateFormData({ location: { region: e.target.value } })}
                placeholder="State/Region"
              />
              <Input
                value={formData.location?.country || ''}
                onChange={(e) => updateFormData({ location: { country: e.target.value } })}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'private' | 'public') => updateFormData({ visibility: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private - Only you can see</SelectItem>
                <SelectItem value="public">Public - Organizers can discover</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.visibility === 'public' 
                ? 'Organizers can find and import this team' 
                : 'Only you and assigned stat admins can see this team'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={loading || !formData.name.trim()}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
