/**
 * Custom Player Photo Upload Component
 * 
 * Purpose: Reusable photo upload component for custom players (profile + pose)
 * Follows .cursorrules: <200 lines, single responsibility (photo upload UI only)
 * 
 * @module CustomPlayerPhotoUpload
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { deleteCustomPlayerPhoto } from '@/lib/services/imageUploadService';
import { CoachPlayerService } from '@/lib/services/coachPlayerService';

interface CustomPlayerPhotoUploadProps {
  customPlayerId: string | null;
  profilePhotoUrl?: string | null;
  posePhotoUrl?: string | null;
  onProfilePhotoChange: (url: string | null) => void;
  onPosePhotoChange: (url: string | null) => void;
  onProfileFileSelect?: (file: File) => void;
  onPoseFileSelect?: (file: File) => void;
  disabled?: boolean;
  allowFileSelectionBeforeCreation?: boolean;
  enableCrop?: boolean;
}

/**
 * CustomPlayerPhotoUpload - Photo upload component for custom players
 * 
 * Features:
 * - Profile photo upload (square aspect ratio)
 * - Pose photo upload (portrait aspect ratio)
 * - Immediate DB update after successful upload
 * - Handles upload state and errors
 */
export function CustomPlayerPhotoUpload({
  customPlayerId,
  profilePhotoUrl,
  posePhotoUrl,
  onProfilePhotoChange,
  onPosePhotoChange,
  onProfileFileSelect,
  onPoseFileSelect,
  disabled = false,
  allowFileSelectionBeforeCreation = false,
  enableCrop = false
}: CustomPlayerPhotoUploadProps) {
  // Profile photo success handler - updates DB immediately
  const handleProfilePhotoSuccess = useCallback(async (url: string) => {
    onProfilePhotoChange(url);
    
    // Immediately update database with new photo URL
    if (customPlayerId) {
      try {
        await CoachPlayerService.updateCustomPlayer(customPlayerId, {
          profile_photo_url: url
        });
      } catch (error) {
        console.error('Failed to update database:', error);
      }
    }
  }, [customPlayerId, onProfilePhotoChange]);

  const handleProfilePhotoError = useCallback((error: string) => {
    console.error('Profile photo upload error:', error);
  }, []);

  // Pose photo success handler - updates DB immediately
  const handlePosePhotoSuccess = useCallback(async (url: string) => {
    onPosePhotoChange(url);
    
    // Immediately update database with new photo URL
    if (customPlayerId) {
      try {
        await CoachPlayerService.updateCustomPlayer(customPlayerId, {
          pose_photo_url: url
        });
      } catch (error) {
        console.error('Failed to update database:', error);
      }
    }
  }, [customPlayerId, onPosePhotoChange]);

  const handlePosePhotoError = useCallback((error: string) => {
    console.error('Pose photo upload error:', error);
  }, []);

  // Memoize hook options
  const profilePhotoUploadOptions = useMemo(() => ({
    customPlayerId: customPlayerId || undefined,
    photoType: 'profile' as const,
    currentPhotoUrl: profilePhotoUrl || undefined,
    onSuccess: handleProfilePhotoSuccess,
    onError: handleProfilePhotoError
  }), [customPlayerId, profilePhotoUrl, handleProfilePhotoSuccess, handleProfilePhotoError]);

  const posePhotoUploadOptions = useMemo(() => ({
    customPlayerId: customPlayerId || undefined,
    photoType: 'pose' as const,
    currentPhotoUrl: posePhotoUrl || undefined,
    onSuccess: handlePosePhotoSuccess,
    onError: handlePosePhotoError
  }), [customPlayerId, posePhotoUrl, handlePosePhotoSuccess, handlePosePhotoError]);

  const profilePhotoUpload = usePhotoUpload(profilePhotoUploadOptions);
  const posePhotoUpload = usePhotoUpload(posePhotoUploadOptions);

  // Handle file selection
  const handleProfileFileSelect = async (file: File) => {
    if (allowFileSelectionBeforeCreation && !customPlayerId && onProfileFileSelect) {
      onProfileFileSelect(file);
    } else if (customPlayerId) {
      await profilePhotoUpload.handleFileSelect(file);
    }
  };

  const handlePoseFileSelect = async (file: File) => {
    if (allowFileSelectionBeforeCreation && !customPlayerId && onPoseFileSelect) {
      onPoseFileSelect(file);
    } else if (customPlayerId) {
      await posePhotoUpload.handleFileSelect(file);
    }
  };

  const isDisabled = disabled || (!customPlayerId && !allowFileSelectionBeforeCreation);

  // Handle photo removal
  const handleProfilePhotoRemove = async () => {
    if (profilePhotoUpload.uploading) return;
    
    if (profilePhotoUrl && customPlayerId) {
      try {
        await deleteCustomPlayerPhoto(profilePhotoUrl);
        await CoachPlayerService.updateCustomPlayer(customPlayerId, {
          profile_photo_url: null
        });
      } catch (error) {
        console.error('Failed to remove profile photo:', error);
      }
    }
    
    profilePhotoUpload.clearPreview();
    onProfilePhotoChange(null);
  };

  const handlePosePhotoRemove = async () => {
    if (posePhotoUpload.uploading) return;
    
    if (posePhotoUrl && customPlayerId) {
      try {
        await deleteCustomPlayerPhoto(posePhotoUrl);
        await CoachPlayerService.updateCustomPlayer(customPlayerId, {
          pose_photo_url: null
        });
      } catch (error) {
        console.error('Failed to remove pose photo:', error);
      }
    }
    
    posePhotoUpload.clearPreview();
    onPosePhotoChange(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PhotoUploadField
        label="Profile Photo"
        value={profilePhotoUrl || null}
        previewUrl={profilePhotoUpload.previewUrl}
        uploading={profilePhotoUpload.uploading}
        error={profilePhotoUpload.error}
        aspectRatio="square"
        disabled={isDisabled}
        enableCrop={enableCrop}
        cropAspectRatio="square"
        onFileSelect={handleProfileFileSelect}
        onRemove={handleProfilePhotoRemove}
      />

      <PhotoUploadField
        label="Action/Pose Photo"
        value={posePhotoUrl || null}
        previewUrl={posePhotoUpload.previewUrl}
        uploading={posePhotoUpload.uploading}
        error={posePhotoUpload.error}
        aspectRatio="portrait"
        disabled={isDisabled}
        enableCrop={enableCrop}
        cropAspectRatio="portrait"
        onFileSelect={handlePoseFileSelect}
        onRemove={handlePosePhotoRemove}
      />
    </div>
  );
}
