// ============================================================================
// PROFILE EDIT MODAL COMPONENT
// ============================================================================
// Purpose: Modal for editing profile with photo upload
// Follows .cursorrules: <200 lines, UI only
// ============================================================================

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Upload, X } from 'lucide-react';
import { OrganizerProfile, CoachProfile, ProfileUpdateRequest, SocialLinks } from '@/lib/types/profile';
import { supabase } from '@/lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: OrganizerProfile | CoachProfile;
  onSave: (updates: ProfileUpdateRequest) => Promise<boolean>;
}

/**
 * ProfileEditModal - Edit profile information
 * 
 * Features:
 * - Photo upload (reuses Supabase storage)
 * - Name, bio, location editing
 * - Social links (Twitter, Instagram, Website)
 * - Save/Cancel actions
 * 
 * Follows .cursorrules: <200 lines, UI only
 */
export function ProfileEditModal({ isOpen, onClose, profileData, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    name: profileData.name,
    bio: profileData.bio || '',
    location: profileData.location || '',
    socialLinks: profileData.socialLinks || {}
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profileData.profilePhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload photo to Supabase storage
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      setUploading(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${profileData.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profileData.id}/${fileName}`; // Store in user-specific folder

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload photo if changed
      let photoUrl = profileData.profilePhotoUrl;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // Prepare update request
      const updates: ProfileUpdateRequest = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        socialLinks: formData.socialLinks,
        profilePhotoUrl: photoUrl
      };

      const success = await onSave(updates);
      if (success) {
        onClose();
      } else {
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32 border-4 border-primary/20">
              <AvatarImage src={photoPreview || undefined} alt={formData.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-3xl font-bold">
                {formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {photoFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links</Label>
            <div className="space-y-3">
              <Input
                placeholder="Facebook page URL or username"
                value={formData.socialLinks.facebook || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                })}
              />
              <Input
                placeholder="Twitter username (without @)"
                value={formData.socialLinks.twitter || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                })}
              />
              <Input
                placeholder="Instagram username (without @)"
                value={formData.socialLinks.instagram || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
              />
              <Input
                placeholder="Website URL"
                value={formData.socialLinks.website || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialLinks: { ...formData.socialLinks, website: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || uploading || !formData.name.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

