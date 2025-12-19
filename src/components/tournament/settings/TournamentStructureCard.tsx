'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TournamentStructureCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
}

export function TournamentStructureCard({ tournament, onUpdate }: TournamentStructureCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-primary" />
          Tournament Structure
        </CardTitle>
        <CardDescription className="text-xs">Format and team capacity</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Tournament Format</Label>
            <Select 
              value={tournament.tournamentType} 
              onValueChange={(tournamentType) => onUpdate({ tournamentType: tournamentType as Tournament['tournamentType'] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
                <SelectItem value="round_robin">Round Robin</SelectItem>
                <SelectItem value="swiss_system">Swiss System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Maximum Teams</Label>
            <Select 
              value={tournament.maxTeams.toString()} 
              onValueChange={(v) => onUpdate({ maxTeams: parseInt(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 18, 24, 32].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num} Teams</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
