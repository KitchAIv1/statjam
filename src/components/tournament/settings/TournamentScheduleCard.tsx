'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TournamentScheduleCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
}

export function TournamentScheduleCard({ tournament, onUpdate }: TournamentScheduleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4 text-primary" />
          Schedule
        </CardTitle>
        <CardDescription className="text-xs">Tournament start and end dates</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Start Date</Label>
            <Input
              type="date"
              value={tournament.startDate}
              onChange={(e) => onUpdate({ startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">End Date</Label>
            <Input
              type="date"
              value={tournament.endDate}
              onChange={(e) => onUpdate({ endDate: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
