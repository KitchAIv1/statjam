/**
 * Custom Player Photo Upload Component
 * 
 * Purpose: Reusable photo upload component for custom players (profile + pose)
 * Follows .cursorrules: <200 lines, single responsibility (photo upload UI only)
 * 
 * @module CustomPlayerPhotoUpload
 */

'use client';

import React from 'react';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

interface CustomPlayerPhotoUploadProps {
  customPlayerId: string | null; // null during creation, set after creation
  profilePhotoUrl?: string | null;
  posePhotoUrl?: string | null;
  onProfilePhotoChange: (url: string | null) => void;
  onPosePhotoChange: (url: string | null) => void;
  onProfileFileSelect?: (file: File) => void; // Optional: for file selection before creation
  onPoseFileSelect?: (file: File) => void; // Optional: for file selection before creation
  disabled?: boolean;
  allowFileSelectionBeforeCreation?: boolean; // Allow file selection even when customPlayerId is null
}

/**
 * CustomPlayerPhotoUpload - Photo upload component for custom players
 * 
 * Features:
 * - Profile photo upload (square aspect ratio)
 * - Pose photo upload (portrait aspect ratio)
 * - Uses existing usePhotoUpload hook
 * - Handles upload state and errors
 * - Callbacks for parent form integration
 * 
 * Note: Photo uploads happen after custom player creation (need custom_player_id for storage path)
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
  allowFileSelectionBeforeCreation = false
}: CustomPlayerPhotoUploadProps) {
  // Profile photo upload hook (only active if customPlayerId exists)
  const profilePhotoUpload = usePhotoUpload({
    customPlayerId: customPlayerId || undefined,
    photoType: 'profile',
    currentPhotoUrl: profilePhotoUrl || undefined,
    onSuccess: (url) => onProfilePhotoChange(url),
    onError: (error) => console.error('Profile photo upload error:', error)
  });

  // Pose photo upload hook (only active if customPlayerId exists)
  const posePhotoUpload = usePhotoUpload({
    customPlayerId: customPlayerId || undefined,
    photoType: 'pose',
    currentPhotoUrl: posePhotoUrl || undefined,
    onSuccess: (url) => onPosePhotoChange(url),
    onError: (error) => console.error('Pose photo upload error:', error)
  });

  // Handle file selection - use callback if provided (before creation), otherwise use upload hook
  const handleProfileFileSelect = async (file: File) => {
    if (allowFileSelectionBeforeCreation && !customPlayerId && onProfileFileSelect) {
      // File selection before creation - store file and create preview
      onProfileFileSelect(file);
    } else if (customPlayerId) {
      // Normal upload flow after creation
      await profilePhotoUpload.handleFileSelect(file);
    }
  };

  const handlePoseFileSelect = async (file: File) => {
    if (allowFileSelectionBeforeCreation && !customPlayerId && onPoseFileSelect) {
      // File selection before creation - store file and create preview
      onPoseFileSelect(file);
    } else if (customPlayerId) {
      // Normal upload flow after creation
      await posePhotoUpload.handleFileSelect(file);
    }
  };

  // Determine if upload fields should be disabled
  const isDisabled = disabled || (!customPlayerId && !allowFileSelectionBeforeCreation);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Profile Photo */}
      <PhotoUploadField
        label="Profile Photo"
        value={profilePhotoUrl || null}
        previewUrl={profilePhotoUpload.previewUrl}
        uploading={profilePhotoUpload.uploading}
        error={profilePhotoUpload.error}
        aspectRatio="square"
        disabled={isDisabled}
        onFileSelect={handleProfileFileSelect}
        onRemove={() => {
          profilePhotoUpload.clearPreview();
          onProfilePhotoChange(null);
        }}
      />

      {/* Pose Photo */}
      <PhotoUploadField
        label="Action/Pose Photo"
        value={posePhotoUrl || null}
        previewUrl={posePhotoUpload.previewUrl}
        uploading={posePhotoUpload.uploading}
        error={posePhotoUpload.error}
        aspectRatio="portrait"
        disabled={isDisabled}
        onFileSelect={handlePoseFileSelect}
        onRemove={() => {
          posePhotoUpload.clearPreview();
          onPosePhotoChange(null);
        }}
      />
    </div>
  );
}

