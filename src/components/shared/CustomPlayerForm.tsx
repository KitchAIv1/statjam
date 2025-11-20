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

import React, { useState, useRef, useCallback } from 'react';
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
  // ✅ FIX: Use refs to avoid closure issues
  const pendingProfileFileRef = useRef<File | null>(null);
  const pendingPoseFileRef = useRef<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    jersey_number: '' as string, // Store as string to preserve leading zeros (00, 001, etc.)
    position: undefined as string | undefined
  });

  // Handle form updates
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // ✅ FIX: Stabilize callbacks with useCallback
  const handleProfileFileSelect = useCallback((file: File) => {
    setPendingProfileFile(file);
    pendingProfileFileRef.current = file;
    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoUrl(previewUrl);
  }, []);

  const handlePoseFileSelect = useCallback((file: File) => {
    setPendingPoseFile(file);
    pendingPoseFileRef.current = file;
    const previewUrl = URL.createObjectURL(file);
    setPosePhotoUrl(previewUrl);
  }, []);

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
      
      // ✅ FIX: CoachPlayerService returns response.player, not response.data
      const createdPlayer = response.player || (response as any).data;
      
      if (!response.success || !createdPlayer) {
        setError(response.message || (response as any).error || 'Failed to create player');
        return;
      }

      // Step 2: Set custom player ID (enables photo upload)
      setCustomPlayerId(createdPlayer.id);

      // Step 3: Upload pending photos if any were selected before creation
      // ✅ FIX: Use refs to get files (avoids closure/stale state issues)
      const profileFileToUpload = pendingProfileFileRef.current || pendingProfileFile;
      const poseFileToUpload = pendingPoseFileRef.current || pendingPoseFile;
      
      const photoUpdates: { profile_photo_url?: string | null; pose_photo_url?: string | null } = {};
      
      if (profileFileToUpload || poseFileToUpload) {
        const { uploadCustomPlayerPhoto } = await import('@/lib/services/imageUploadService');
        
        // Upload profile photo if pending
        if (profileFileToUpload) {
          try {
            const profileUrl = await uploadCustomPlayerPhoto(
              profileFileToUpload,
              createdPlayer.id,
              'profile'
            );
            // Only use uploaded URL (not blob URL) and verify it's a valid Supabase URL
            if (profileUrl?.publicUrl && 
                !profileUrl.publicUrl.startsWith('blob:') &&
                profileUrl.publicUrl.includes('supabase.co/storage')) {
              console.log('✅ Profile photo uploaded successfully:', profileUrl.publicUrl);
              photoUpdates.profile_photo_url = profileUrl.publicUrl;
              setProfilePhotoUrl(profileUrl.publicUrl);
            } else {
              console.error('❌ Invalid profile photo URL returned:', profileUrl);
              throw new Error('Invalid photo URL returned from upload');
            }
            setPendingProfileFile(null);
            pendingProfileFileRef.current = null;
          } catch (err) {
            console.error('❌ Failed to upload profile photo:', err);
            console.error('❌ Error details:', {
              message: err instanceof Error ? err.message : 'Unknown error',
              stack: err instanceof Error ? err.stack : undefined
            });
            // Clear blob URL on error and DON'T save URL to database
            setProfilePhotoUrl(null);
            // Don't add to photoUpdates - upload failed
          }
        }

        // Upload pose photo if pending
        if (poseFileToUpload) {
          try {
            const poseUrl = await uploadCustomPlayerPhoto(
              poseFileToUpload,
              createdPlayer.id,
              'pose'
            );
            // Only use uploaded URL (not blob URL) and verify it's a valid Supabase URL
            if (poseUrl?.publicUrl && 
                !poseUrl.publicUrl.startsWith('blob:') &&
                poseUrl.publicUrl.includes('supabase.co/storage')) {
              console.log('✅ Pose photo uploaded successfully:', poseUrl.publicUrl);
              photoUpdates.pose_photo_url = poseUrl.publicUrl;
              setPosePhotoUrl(poseUrl.publicUrl);
            } else {
              console.error('❌ Invalid pose photo URL returned:', poseUrl);
              throw new Error('Invalid photo URL returned from upload');
            }
            setPendingPoseFile(null);
            pendingPoseFileRef.current = null;
          } catch (err) {
            console.error('❌ Failed to upload pose photo:', err);
            console.error('❌ Error details:', {
              message: err instanceof Error ? err.message : 'Unknown error',
              stack: err instanceof Error ? err.stack : undefined
            });
            // Clear blob URL on error and DON'T save URL to database
            setPosePhotoUrl(null);
            // Don't add to photoUpdates - upload failed
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
          
          const { data: updatedData, error: updateError } = await supabase
            .from('custom_players')
            .update(updateData)
            .eq('id', createdPlayer.id)
            .select('profile_photo_url, pose_photo_url')
            .single();
          
          if (updateError) {
            console.error('❌ Player created but photos not saved to database:', updateError.message);
            console.error('❌ Update error details:', {
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint
            });
            console.error('❌ Photo updates attempted:', updateData);
          } else {
            // Update createdPlayer with the saved URLs
            if (updatedData) {
              createdPlayer.profile_photo_url = updatedData.profile_photo_url;
              (createdPlayer as any).pose_photo_url = updatedData.pose_photo_url;
            }
          }
        } catch (err) {
          console.error('❌ Failed to update player with photo URLs:', err);
          console.error('❌ Error details:', err);
        }
      }
      
      // Step 5: Return final player with photo URLs
      const finalPlayer: GenericPlayer = {
        ...createdPlayer,
        profile_photo_url: finalProfileUrl || createdPlayer.profile_photo_url || null,
        pose_photo_url: finalPoseUrl || (createdPlayer as any).pose_photo_url || null
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
            onProfileFileSelect={handleProfileFileSelect}
            onPoseFileSelect={handlePoseFileSelect}
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

