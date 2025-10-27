'use client';

import React, { useState } from 'react';
import { X, Users, Save, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreateCoachTeamRequest, CoachPlayer } from '@/lib/types/coach';
import { CoachPlayerSelectionList } from './CoachPlayerSelectionList';
import { CreateCustomPlayerForm } from './CreateCustomPlayerForm';

interface CreateCoachTeamModalProps {
  onClose: () => void;
  onTeamCreated: () => void;
}

/**
 * CreateCoachTeamModal - 2-step modal for creating coach teams
 * 
 * Features:
 * - Step 1: Team details (name, location, visibility)
 * - Step 2: Player management (add players)
 * - Progress indicator
 * - Option to skip player setup
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CreateCoachTeamModal({ onClose, onTeamCreated }: CreateCoachTeamModalProps) {
  // Step state
  const [currentStep, setCurrentStep] = useState<'details' | 'players'>('details');
  const [createdTeamId, setCreatedTeamId] = useState<string | null>(null);
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedPlayers, setAddedPlayers] = useState<CoachPlayer[]>([]);
  
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

  // Handle team creation (Step 1)
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
      const team = await CoachTeamService.createTeam(formData);
      setCreatedTeamId(team.id);
      
      // Move to player management step
      setCurrentStep('players');
      
    } catch (error) {
      console.error('❌ Error creating team:', error);
      setError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  // Handle player management
  const handlePlayerAdd = (player: CoachPlayer) => {
    setAddedPlayers(prev => [...prev, player]);
  };

  const handlePlayerRemove = (player: CoachPlayer) => {
    setAddedPlayers(prev => prev.filter(p => p.id !== player.id));
  };

  // Handle final completion
  const handleComplete = () => {
    onTeamCreated();
    onClose();
  };

  // Handle skip players
  const handleSkipPlayers = () => {
    onTeamCreated();
    onClose();
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {currentStep === 'details' ? 'Create Team' : 'Add Players'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'details' 
              ? 'Create a new team to track games and manage your roster.'
              : `Add players to "${formData.name}" team. You need at least 5 players to start tracking.`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 ${currentStep === 'details' ? 'text-primary' : 'text-green-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'details' ? 'bg-primary text-white' : 'bg-green-600 text-white'
            }`}>
              {currentStep === 'players' ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Team Details</span>
          </div>
          
          <div className={`flex-1 h-0.5 ${currentStep === 'players' ? 'bg-green-600' : 'bg-muted'}`} />
          
          <div className={`flex items-center gap-2 ${currentStep === 'players' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === 'players' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Add Players</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentStep === 'details' ? (
            /* Step 1: Team Details */
            <div className="space-y-4">
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
            </div>
          ) : (
            /* Step 2: Player Management */
            <div className="space-y-4">
              {/* Added Players Summary */}
              {addedPlayers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {addedPlayers.length} player{addedPlayers.length !== 1 ? 's' : ''} added
                    </span>
                    {addedPlayers.length >= 5 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Ready to track!
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {addedPlayers.map(player => (
                      <Badge key={player.id} variant="outline" className="text-xs">
                        {player.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Selection */}
              {createdTeamId && (
                <CoachPlayerSelectionList
                  teamId={createdTeamId}
                  onPlayerAdd={handlePlayerAdd}
                  onPlayerRemove={handlePlayerRemove}
                />
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {currentStep === 'details' ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={loading || !formData.name.trim()}
                className="flex-1 gap-2"
              >
                {loading ? 'Creating...' : (
                  <>
                    Create & Add Players
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleSkipPlayers} className="flex-1">
                Skip for Now
              </Button>
              <Button
                onClick={handleComplete}
                className="flex-1 gap-2"
                variant={addedPlayers.length >= 5 ? "default" : "secondary"}
              >
                <Check className="w-4 h-4" />
                {addedPlayers.length >= 5 ? 'Complete Setup' : `Finish (${addedPlayers.length}/5)`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
