// ============================================================================
// SEASON FORM DATES - UI only (<80 lines)
// Purpose: Render date picker fields for season creation
// Follows .cursorrules: UI component, <100 lines, single responsibility
// ============================================================================

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin } from 'lucide-react';

interface SeasonFormDatesProps {
  startDate: string;
  endDate: string;
  homeVenue: string;
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export function SeasonFormDates({
  startDate,
  endDate,
  homeVenue,
  errors,
  onChange,
}: SeasonFormDatesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Calendar className="w-4 h-4" />
        <span>Set the season date range (optional)</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onChange('start_date', e.target.value)}
            className={errors.start_date ? 'border-red-500' : ''}
          />
          {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onChange('end_date', e.target.value)}
            className={errors.end_date ? 'border-red-500' : ''}
          />
          {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>Home venue for this season</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="home-venue">Home Venue</Label>
          <Input
            id="home-venue"
            value={homeVenue}
            onChange={(e) => onChange('home_venue', e.target.value)}
            placeholder="e.g., Winslow Township HS Gym"
          />
        </div>
      </div>
    </div>
  );
}

