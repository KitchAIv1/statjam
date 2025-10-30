/**
 * Custom Player Form (Generic/Shared)
 * 
 * Purpose: Reusable form for creating team-specific custom players
 * Uses service injection for Coach/Organizer flexibility
 * Follows .cursorrules: <200 lines, single responsibility (form only)
 * 
 * @module CustomPlayerForm
 */

'use client';

import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IPlayerManagementService, GenericPlayer } from '@/lib/types/playerManagement';

interface CustomPlayerFormProps {
  teamId: string;
  service: IPlayerManagementService;
  onPlayerCreated: (player: GenericPlayer) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * CustomPlayerForm - Form for team-specific player creation
 * 
 * Features:
 * - Custom player creation (name, jersey, position)
 * - Validation for required fields
 * - Service injection pattern
 * - Integration with player selection flow
 * 
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CustomPlayerForm({ 
  teamId, 
  service,
  onPlayerCreated, 
  onCancel, 
  className = '' 
}: CustomPlayerFormProps) {
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: undefined as number | undefined,
    position: undefined as string | undefined
  });

  // Handle form updates
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.name.trim()) {
        setError('Player name is required');
        return;
      }

      // Create custom player via service
      const response = await service.createCustomPlayer({
        team_id: teamId,
        name: formData.name.trim(),
        jersey_number: formData.jersey_number,
        position: formData.position
      });
      
      if (response.success && response.data) {
        onPlayerCreated(response.data);
      } else {
        setError(response.message || response.error || 'Failed to create player');
      }
      
    } catch (error) {
      console.error('❌ Error creating custom player:', error);
      setError(error instanceof Error ? error.message : 'Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <UserPlus className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Create Custom Player</h3>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player Name */}
        <div className="space-y-2">
          <Label htmlFor="player-name">Player Name *</Label>
          <Input
            id="player-name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., John Smith"
            required
          />
        </div>

        {/* Jersey Number */}
        <div className="space-y-2">
          <Label htmlFor="jersey-number">Jersey Number (Optional)</Label>
          <Input
            id="jersey-number"
            type="number"
            min="0"
            max="99"
            value={formData.jersey_number || ''}
            onChange={(e) => updateFormData({ 
              jersey_number: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="e.g., 23"
          />
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label>Position (Optional)</Label>
          <Select
            value={formData.position || 'none'}
            onValueChange={(value) => updateFormData({ position: value === 'none' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Position</SelectItem>
              <SelectItem value="PG">Point Guard (PG)</SelectItem>
              <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
              <SelectItem value="SF">Small Forward (SF)</SelectItem>
              <SelectItem value="PF">Power Forward (PF)</SelectItem>
              <SelectItem value="C">Center (C)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Player'}
          </Button>
        </div>
      </form>

      {/* Info Note */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Note:</strong> Custom players are team-specific and won't have StatJam profiles or premium features. 
        They can still participate in games and stat tracking. For full features, invite players to create StatJam accounts.
      </div>
    </div>
  );
}

