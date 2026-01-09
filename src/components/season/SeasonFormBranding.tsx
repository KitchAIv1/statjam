// ============================================================================
// SEASON FORM BRANDING - UI only (<100 lines)
// Purpose: Render branding/visibility fields for season creation
// Follows .cursorrules: UI component, <100 lines, single responsibility
// ============================================================================

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PhotoUploadField } from '@/components/ui/PhotoUploadField';
import { Palette, Eye, EyeOff } from 'lucide-react';

interface SeasonFormBrandingProps {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  isPublic: boolean;
  logoPreview: string | null;
  logoUploading: boolean;
  logoProgress: number;
  logoError: string | null;
  onChange: (field: string, value: string | boolean) => void;
  onLogoSelect: (file: File) => void;
  onLogoRemove: () => void;
  onLogoClearError: () => void;
}

export function SeasonFormBranding({
  logo,
  primaryColor,
  secondaryColor,
  isPublic,
  logoPreview,
  logoUploading,
  logoProgress,
  logoError,
  onChange,
  onLogoSelect,
  onLogoRemove,
  onLogoClearError,
}: SeasonFormBrandingProps) {
  return (
    <div className="space-y-5">
      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Season Logo</Label>
        <PhotoUploadField
          label="Upload Season Logo"
          value={logo || null}
          previewUrl={logoPreview || logo}
          uploading={logoUploading}
          progress={logoProgress}
          error={logoError}
          onFileSelect={onLogoSelect}
          onRemove={onLogoRemove}
          onClearError={onLogoClearError}
        />
      </div>

      {/* Colors */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Palette className="w-4 h-4" />
          <span>Team colors for season page</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={primaryColor}
                onChange={(e) => onChange('primary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => onChange('primary_color', e.target.value)}
                placeholder="#FF6B00"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary-color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary-color"
                type="color"
                value={secondaryColor}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => onChange('secondary_color', e.target.value)}
                placeholder="#1A1A1A"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPublic ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            <div>
              <Label className="text-base">Public Season</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Anyone can view this season page' : 'Only you can see this season'}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={(checked) => onChange('is_public', checked)}
          />
        </div>
      </div>
    </div>
  );
}

