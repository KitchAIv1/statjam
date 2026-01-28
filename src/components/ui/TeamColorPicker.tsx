// ============================================================================
// TEAM COLOR PICKER - Reusable UI component (<100 lines)
// Purpose: Color selection for teams (used by Coach & Organizer team creation)
// Follows .cursorrules: UI only, <100 lines, single responsibility
// ============================================================================

'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette } from 'lucide-react';

interface TeamColorPickerProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  showAccentColor?: boolean;
  onChange: (field: 'primary_color' | 'secondary_color' | 'accent_color', value: string) => void;
  className?: string;
}

/**
 * TeamColorPicker - Reusable color picker for team branding
 * 
 * Used by:
 * - Coach team creation (CreateCoachTeamModal)
 * - Organizer team creation (TeamCreationModal)
 * - Season branding (can replace SeasonFormBranding color section)
 * 
 * Colors are used for:
 * - NBA-style overlay color banding
 * - Team branding on public pages
 * - Player cards
 */
export function TeamColorPicker({
  primaryColor,
  secondaryColor,
  accentColor = '#F5D36C',
  showAccentColor = false,
  onChange,
  className = '',
}: TeamColorPickerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Palette className="w-4 h-4" />
        <span>Team colors for overlay &amp; branding</span>
      </div>

      <div className={`grid ${showAccentColor ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="team-primary-color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              id="team-primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => onChange('primary_color', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={primaryColor}
              onChange={(e) => onChange('primary_color', e.target.value)}
              placeholder="#111827"
              className="flex-1"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div className="space-y-2">
          <Label htmlFor="team-secondary-color">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              id="team-secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => onChange('secondary_color', e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => onChange('secondary_color', e.target.value)}
              placeholder="#999999"
              className="flex-1"
            />
          </div>
        </div>

        {/* Accent Color (Optional) */}
        {showAccentColor && (
          <div className="space-y-2">
            <Label htmlFor="team-accent-color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="team-accent-color"
                type="color"
                value={accentColor}
                onChange={(e) => onChange('accent_color', e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={accentColor}
                onChange={(e) => onChange('accent_color', e.target.value)}
                placeholder="#F5D36C"
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
