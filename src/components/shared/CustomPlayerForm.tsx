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
import { Label } from "@/components/ui/label";
import { CustomPlayerPhotoUpload } from '@/components/shared/CustomPlayerPhotoUpload';
import { CustomPlayerFormFields } from '@/components/shared/CustomPlayerFormFields';
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

      // Convert jersey_number string to number (empty string becomes undefined)
      const jerseyNumber = formData.jersey_number.trim() === '' 
        ? undefined 
        : parseInt(formData.jersey_number, 10);
      
      // Step 1: Create custom player (without photos first)
      const response = await service.createCustomPlayer({
        team_id: teamId,
        name: formData.name.trim(),
        jersey_number: jerseyNumber,
        position: formData.position,
        profile_photo_url: null, // Will be updated after photo upload
        pose_photo_url: null
      });
      
      if (!response.success || !response.data) {
        setError(response.message || response.error || 'Failed to create player');
        return;
      }

      // Step 2: Set custom player ID (enables photo upload)
      setCustomPlayerId(response.data.id);

      // Step 3: Upload pending photos if any were selected before creation
      const photoUpdates: { profile_photo_url?: string | null; pose_photo_url?: string | null } = {};
      
      if (pendingProfileFile || pendingPoseFile) {
        const { uploadCustomPlayerPhoto } = await import('@/lib/services/imageUploadService');
        
        // Upload profile photo if pending
        if (pendingProfileFile) {
          try {
            const profileUrl = await uploadCustomPlayerPhoto(
              pendingProfileFile,
              response.data.id,
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
              response.data.id,
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
      }

      // Step 4: Update player record with photo URLs if photos were uploaded
      const finalProfileUrl = photoUpdates.profile_photo_url || 
                             (profilePhotoUrl && !profilePhotoUrl.startsWith('blob:') ? profilePhotoUrl : null);
      const finalPoseUrl = photoUpdates.pose_photo_url || 
                          (posePhotoUrl && !posePhotoUrl.startsWith('blob:') ? posePhotoUrl : null);
      
      if (finalProfileUrl || finalPoseUrl) {
        // Update player record with photo URLs
        try {
          const { supabase } = await import('@/lib/supabase');
          const updateData: { profile_photo_url?: string | null; pose_photo_url?: string | null } = {};
          if (finalProfileUrl) updateData.profile_photo_url = finalProfileUrl;
          if (finalPoseUrl) updateData.pose_photo_url = finalPoseUrl;
          
          const { error: updateError } = await supabase
            .from('custom_players')
            .update(updateData)
            .eq('id', response.data.id);
          
          if (updateError) {
            console.warn('⚠️ Player created but photos not saved to database:', updateError.message);
          }
        } catch (err) {
          console.warn('⚠️ Failed to update player with photo URLs:', err);
        }
      }
      
      // Step 5: Return final player with photo URLs
      const finalPlayer: GenericPlayer = {
        ...response.data,
        profile_photo_url: finalProfileUrl || response.data.profile_photo_url || null,
        pose_photo_url: finalPoseUrl || (response.data as any).pose_photo_url || null
      };
      
      onPlayerCreated(finalPlayer);
      
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
        {/* Form Fields */}
        <CustomPlayerFormFields
          formData={formData}
          onFormDataChange={updateFormData}
        />

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label>Photos (Optional)</Label>
          <CustomPlayerPhotoUpload
            customPlayerId={customPlayerId}
            profilePhotoUrl={profilePhotoUrl}
            posePhotoUrl={posePhotoUrl}
            onProfilePhotoChange={setProfilePhotoUrl}
            onPosePhotoChange={setPosePhotoUrl}
            onProfileFileSelect={(file) => {
              setPendingProfileFile(file);
              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setProfilePhotoUrl(previewUrl);
            }}
            onPoseFileSelect={(file) => {
              setPendingPoseFile(file);
              // Create preview URL
              const previewUrl = URL.createObjectURL(file);
              setPosePhotoUrl(previewUrl);
            }}
            allowFileSelectionBeforeCreation={true}
            disabled={loading}
          />
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

