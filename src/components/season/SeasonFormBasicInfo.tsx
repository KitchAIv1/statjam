// ============================================================================
// SEASON FORM BASIC INFO - UI only (<100 lines)
// Purpose: Render basic info form fields for season creation
// Follows .cursorrules: UI component, <100 lines, single responsibility
// ============================================================================

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SeasonType } from '@/lib/types/season';

interface SeasonFormBasicInfoProps {
  name: string;
  description: string;
  leagueName: string;
  seasonType: SeasonType;
  seasonYear: string;
  conference: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function SeasonFormBasicInfo({
  name,
  description,
  leagueName,
  seasonType,
  seasonYear,
  conference,
  errors,
  onChange,
}: SeasonFormBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="season-name">Season Name *</Label>
        <Input
          id="season-name"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., 2024-25 Winter League"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Brief description of this season..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="league-name">League / Association</Label>
        <Input
          id="league-name"
          value={leagueName}
          onChange={(e) => onChange('league_name', e.target.value)}
          placeholder="e.g., South Jersey Youth Basketball League"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Season Type *</Label>
          <Select value={seasonType} onValueChange={(v) => onChange('season_type', v)}>
            <SelectTrigger className={errors.season_type ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular Season</SelectItem>
              <SelectItem value="playoffs">Playoffs</SelectItem>
              <SelectItem value="preseason">Preseason</SelectItem>
              <SelectItem value="summer">Summer League</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
            </SelectContent>
          </Select>
          {errors.season_type && <p className="text-xs text-red-500">{errors.season_type}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="season-year">Year / Term</Label>
          <Input
            id="season-year"
            value={seasonYear}
            onChange={(e) => onChange('season_year', e.target.value)}
            placeholder="e.g., 2024-25"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="conference">Conference / Division</Label>
        <Input
          id="conference"
          value={conference}
          onChange={(e) => onChange('conference', e.target.value)}
          placeholder="e.g., East Division (optional)"
        />
      </div>
    </div>
  );
}

