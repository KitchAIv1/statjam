'use client';

import React, { useState } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomPlayerPhotoUpload } from '@/components/shared/CustomPlayerPhotoUpload';
import { CreateCustomPlayerRequest } from '@/lib/types/coach';

interface CreateCustomPlayerFormProps {
  teamId: string;
  onPlayerCreated: (player: any) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * CreateCustomPlayerForm - Form for team-specific player creation
 * 
 * Features:
 * - Custom player creation (name, jersey, position)
 * - Validation for required fields
 * - Integration with player selection flow
 * 
 * Note: Currently placeholder - custom players need dedicated table
 * Follows .cursorrules: <200 lines, single responsibility
 */
export function CreateCustomPlayerForm({ 
  teamId, 
  onPlayerCreated, 
  onCancel, 
  className = '' 
}: CreateCustomPlayerFormProps) {
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPlayerId, setCustomPlayerId] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [posePhotoUrl, setPosePhotoUrl] = useState<string | null>(null);
  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);
  const [pendingPoseFile, setPendingPoseFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '' as string, // Store as string to preserve leading zeros (00, 001, etc.)
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

      // Create custom player
      // Convert jersey_number string to number (empty string becomes undefined)
      const jerseyNumber = formData.jersey_number.trim() === '' 
        ? undefined 
        : parseInt(formData.jersey_number, 10);
      
      const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
      
      // Step 1: Create custom player (without photos first)
      const response = await CoachPlayerService.createCustomPlayer({
        team_id: teamId,
        name: formData.name.trim(),
        jersey_number: jerseyNumber,
        position: formData.position,
        profile_photo_url: null, // Will be updated after photo upload
        pose_photo_url: null
      });
      
      if (!response.success || !response.player) {
        setError(response.message || 'Failed to create player');
        return;
      }

      // Step 2: Set custom player ID (enables photo upload)
      setCustomPlayerId(response.player.id);

      // Step 3: Upload pending photos if any were selected before creation
      const photoUpdates: { profile_photo_url?: string | null; pose_photo_url?: string | null } = {};
      
      if (pendingProfileFile || pendingPoseFile) {
        const { uploadCustomPlayerPhoto } = await import('@/lib/services/imageUploadService');
        
        // Upload profile photo if pending
        if (pendingProfileFile) {
          try {
            const profileUrl = await uploadCustomPlayerPhoto(
              pendingProfileFile,
              response.player.id,
              'profile'
            );
            // Only use uploaded URL (not blob URL)
            if (profileUrl.publicUrl && !profileUrl.publicUrl.startsWith('blob:')) {
              photoUpdates.profile_photo_url = profileUrl.publicUrl;
              setProfilePhotoUrl(profileUrl.publicUrl);
            }
            setPendingProfileFile(null);
          } catch (err) {
            console.error('❌ Failed to upload profile photo:', err);
            // Clear blob URL on error
            setProfilePhotoUrl(null);
          }
        }
        
        // Upload pose photo if pending
        if (pendingPoseFile) {
          try {
            const poseUrl = await uploadCustomPlayerPhoto(
              pendingPoseFile,
              response.player.id,
              'pose'
            );
            // Only use uploaded URL (not blob URL)
            if (poseUrl.publicUrl && !poseUrl.publicUrl.startsWith('blob:')) {
              photoUpdates.pose_photo_url = poseUrl.publicUrl;
              setPosePhotoUrl(poseUrl.publicUrl);
            }
            setPendingPoseFile(null);
          } catch (err) {
            console.error('❌ Failed to upload pose photo:', err);
            // Clear blob URL on error
            setPosePhotoUrl(null);
          }
        }
        
        // Update player with photo URLs (only if uploads succeeded)
        if (Object.keys(photoUpdates).length > 0) {
          const updateResponse = await CoachPlayerService.updateCustomPlayer(response.player.id, photoUpdates);
          if (updateResponse.success && updateResponse.player) {
            response.player = updateResponse.player;
          } else {
            console.warn('⚠️ Player created but photos not saved:', updateResponse.message);
          }
        }
      }
      
      // Step 4: If photos were uploaded via callbacks (after player creation), use those
      // Only update if URLs are actual Supabase URLs (not blob URLs)
      const uploadedProfileUrl = profilePhotoUrl && !profilePhotoUrl.startsWith('blob:') ? profilePhotoUrl : null;
      const uploadedPoseUrl = posePhotoUrl && !posePhotoUrl.startsWith('blob:') ? posePhotoUrl : null;
      
      if (uploadedProfileUrl || uploadedPoseUrl) {
        const callbackUpdates: { profile_photo_url?: string | null; pose_photo_url?: string | null } = {};
        if (uploadedProfileUrl) callbackUpdates.profile_photo_url = uploadedProfileUrl;
        if (uploadedPoseUrl) callbackUpdates.pose_photo_url = uploadedPoseUrl;
        
        const updateResponse = await CoachPlayerService.updateCustomPlayer(response.player.id, callbackUpdates);
        if (updateResponse.success && updateResponse.player) {
          response.player = updateResponse.player;
        } else {
          console.warn('⚠️ Player created but callback photos not saved:', updateResponse.message);
        }
      }

      // Step 5: Return created player (with photos if uploaded)
      onPlayerCreated(response.player);
      
    } catch (error) {
      console.error('❌ Error creating custom player:', error);
      setError(error instanceof Error ? error.message : 'Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className} max-h-full overflow-y-auto`}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b flex-shrink-0">
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
            type="text"
            value={formData.jersey_number}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty or numeric values with leading zeros (00, 000, 001, etc.)
              if (value === '') {
                updateFormData({ jersey_number: '' });
              } else if (/^\d+$/.test(value) && value.length <= 3) {
                const num = parseInt(value, 10);
                // Validate range 0-999, but preserve string format (00, 000, 001, etc.)
                if (num >= 0 && num <= 999) {
                  updateFormData({ jersey_number: value });
                }
              }
            }}
            placeholder="e.g., 0, 00, 000, 001, 23, 999"
            maxLength={3}
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

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos (Optional)</Label>
          <CustomPlayerPhotoUpload
            customPlayerId={customPlayerId}
            profilePhotoUrl={profilePhotoUrl}
            posePhotoUrl={posePhotoUrl}
            onProfilePhotoChange={async (url) => {
              setProfilePhotoUrl(url);
              // If player already exists, update immediately
              if (customPlayerId && url) {
                const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
                CoachPlayerService.updateCustomPlayer(customPlayerId, { profile_photo_url: url }).catch(console.error);
              }
            }}
            onPosePhotoChange={async (url) => {
              setPosePhotoUrl(url);
              // If player already exists, update immediately
              if (customPlayerId && url) {
                const { CoachPlayerService } = await import('@/lib/services/coachPlayerService');
                CoachPlayerService.updateCustomPlayer(customPlayerId, { pose_photo_url: url }).catch(console.error);
              }
            }}
            onProfileFileSelect={(file) => {
              // Store file for upload after player creation
              setPendingProfileFile(file);
              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setProfilePhotoUrl(previewUrl);
            }}
            onPoseFileSelect={(file) => {
              // Store file for upload after player creation
              setPendingPoseFile(file);
              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setPosePhotoUrl(previewUrl);
            }}
            disabled={loading}
            allowFileSelectionBeforeCreation={true}
          />
          {!customPlayerId && (pendingProfileFile || pendingPoseFile) && (
            <p className="text-xs text-muted-foreground">
              Photos selected. They will be uploaded automatically after creating the player.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={loading}
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
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md flex-shrink-0">
        <strong>Note:</strong> Custom players are team-specific and won't have StatJam profiles or premium features. 
        They can still participate in games and stat tracking. For full features, invite players to create StatJam accounts.
      </div>
    </div>
  );
}
