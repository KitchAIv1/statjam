/**
 * StatEditTeamTab - Lazy-loaded Team Stats Tab Component
 * 
 * PURPOSE: Extract team tab rendering to keep StatEditModalV2 under 200 lines
 * 
 * Follows .cursorrules: <200 lines component
 */

'use client';

import React, { lazy, Suspense } from 'react';
import { TeamStatsTabLight } from './TeamStatsTabLight';

interface StatEditTeamTabProps {
  gameId: string;
  teamId: string;
  teamName: string;
  isActive: boolean;
}

export function StatEditTeamTab({ gameId, teamId, teamName, isActive }: StatEditTeamTabProps) {
  if (!isActive) return null;

  return (
    <TeamStatsTabLight gameId={gameId} teamId={teamId} teamName={teamName} />
  );
}

