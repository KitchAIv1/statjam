'use client';

import React from 'react';
import { Tournament } from '@/lib/types/tournament';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TournamentBasicInfoCardProps {
  tournament: Tournament;
  onUpdate: (updates: Partial<Tournament>) => void;
}

export function TournamentBasicInfoCard({ tournament, onUpdate }: TournamentBasicInfoCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-4 h-4 text-primary" />
          Basic Information
        </CardTitle>
        <CardDescription className="text-xs">Name, description, and status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="space-y-1.5">
          <Label className="text-sm">Tournament Name</Label>
          <Input
            value={tournament.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="Enter tournament name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Description</Label>
          <Textarea
            value={tournament.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe your tournament"
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Status</Label>
          <Select value={tournament.status} onValueChange={(status: Tournament['status']) => onUpdate({ status })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft"><StatusDot color="gray" /> Draft</SelectItem>
              <SelectItem value="active"><StatusDot color="green" /> Active</SelectItem>
              <SelectItem value="completed"><StatusDot color="blue" /> Completed</SelectItem>
              <SelectItem value="cancelled"><StatusDot color="red" /> Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusDot({ color }: { color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-400',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 ${colors[color]}`} />;
}
