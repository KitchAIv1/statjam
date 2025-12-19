'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableCountrySelect } from '@/components/shared/SearchableCountrySelect';

interface TournamentLocationCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
}

export function TournamentLocationCard({ tournament, onUpdate }: TournamentLocationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4 text-primary" />
          Location
        </CardTitle>
        <CardDescription className="text-xs">Venue and country</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Venue</Label>
            <Input
              value={tournament.venue || ''}
              onChange={(e) => onUpdate({ venue: e.target.value })}
              placeholder="Enter venue name or address"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Country</Label>
            <SearchableCountrySelect
              value={tournament.country || 'US'}
              onChange={(country) => onUpdate({ country })}
              placeholder="Select country"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
