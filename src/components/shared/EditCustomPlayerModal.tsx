/**
 * Edit Custom Player Modal Component
 * 
 * Purpose: Modal for editing custom player details and photos
 * Follows .cursorrules: <200 lines, single responsibility (modal orchestration)
 * 
 * @module EditCustomPlayerModal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { EditCustomPlayerForm } from './EditCustomPlayerForm';
import { CustomPlayerPhotoUpload } from './CustomPlayerPhotoUpload';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';
import { UpdateCustomPlayerRequest } from '@/lib/types/coach';

interface EditCustomPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPlayer: {
    id: string;
    name: string;
    jersey_number?: number;
    position?: string;
    profile_photo_url?: string | null;
    pose_photo_url?: string | null;
  };
  onSave: (updatedPlayer: any) => void;
}

/**
 * EditCustomPlayerModal - Modal for editing custom player
 * 
 * Features:
 * - Edit name, jersey, position
 * - Upload/edit profile and pose photos
 * - Save/Cancel actions
 * - Error handling
 */
export function EditCustomPlayerModal({
  isOpen,
  onClose,
  customPlayer,
  onSave
}: EditCustomPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState(customPlayer.name);
  const [jerseyNumber, setJerseyNumber] = useState(
    customPlayer.jersey_number !== undefined && customPlayer.jersey_number !== null
      ? customPlayer.jersey_number.toString()
      : ''
  );
  const [position, setPosition] = useState(customPlayer.position);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(customPlayer.profile_photo_url || null);
  const [posePhotoUrl, setPosePhotoUrl] = useState<string | null>(customPlayer.pose_photo_url || null);

  // Reset form when customPlayer changes
  useEffect(() => {
    if (isOpen) {
      setName(customPlayer.name);
      setJerseyNumber(
        customPlayer.jersey_number !== undefined && customPlayer.jersey_number !== null
          ? customPlayer.jersey_number.toString()
          : ''
      );
      setPosition(customPlayer.position);
      setProfilePhotoUrl(customPlayer.profile_photo_url || null);
      setPosePhotoUrl(customPlayer.pose_photo_url || null);
      setError(null);
    }
  }, [customPlayer, isOpen]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!name.trim()) {
        setError('Player name is required');
        return;
      }

      // Convert jersey_number string to number (empty string becomes undefined)
      const jerseyNumberValue = jerseyNumber.trim() === '' 
        ? undefined 
        : parseInt(jerseyNumber, 10);

      // Prepare update data
      const updates: UpdateCustomPlayerRequest = {
        name: name.trim(),
        jersey_number: jerseyNumberValue,
        position: position,
        profile_photo_url: profilePhotoUrl,
        pose_photo_url: posePhotoUrl
      };

      // Update custom player
      const response = await CoachPlayerService.updateCustomPlayer(customPlayer.id, updates);

      if (!response.success || !response.player) {
        setError(response.message || 'Failed to update player');
        return;
      }

      // Call onSave callback
      onSave(response.player);
      onClose();

    } catch (error) {
      console.error('❌ Error updating custom player:', error);
      setError(error instanceof Error ? error.message : 'Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    setName(customPlayer.name);
    setJerseyNumber(
      customPlayer.jersey_number !== undefined && customPlayer.jersey_number !== null
        ? customPlayer.jersey_number.toString()
        : ''
    );
    setPosition(customPlayer.position);
    setProfilePhotoUrl(customPlayer.profile_photo_url || null);
    setPosePhotoUrl(customPlayer.pose_photo_url || null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="glass-modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="glass-modal-header p-6 -m-6 mb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Edit Custom Player
          </DialogTitle>
          <DialogDescription>
            Update player information and photos.
            <br />
            <span className="text-destructive">*</span> Required fields
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-2">
          {/* Form Fields */}
          <EditCustomPlayerForm
            name={name}
            jerseyNumber={jerseyNumber}
            position={position}
            onNameChange={setName}
            onJerseyNumberChange={setJerseyNumber}
            onPositionChange={setPosition}
            disabled={loading}
          />

          {/* Photo Upload Section */}
          <div className="space-y-2">
            <CustomPlayerPhotoUpload
              customPlayerId={customPlayer.id}
              profilePhotoUrl={profilePhotoUrl}
              posePhotoUrl={posePhotoUrl}
              onProfilePhotoChange={setProfilePhotoUrl}
              onPosePhotoChange={setPosePhotoUrl}
              enableCrop={true} // ✅ Enable image cropping before upload
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="gap-2"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

