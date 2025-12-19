'use client';

import React from 'react';
import { Shield, UserX, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchableStatAdminSelect } from '@/components/shared/SearchableStatAdminSelect';

interface StatAdmin {
  id: string;
  name: string;
  email: string;
}

interface TournamentStatAdminSettingsProps {
  statAdmins: StatAdmin[];
  assignedStatAdmins: string[];
  loadingStatAdmins: boolean;
  onToggleStatAdmin: (adminId: string) => void;
}

export function TournamentStatAdminSettings({
  statAdmins,
  assignedStatAdmins,
  loadingStatAdmins,
  onToggleStatAdmin,
}: TournamentStatAdminSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Stat Admin Management
        </CardTitle>
        <CardDescription>
          Assign stat admins who can track live games for this tournament
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingStatAdmins ? (
          <LoadingSkeleton />
        ) : statAdmins.length === 0 ? (
          <EmptyState />
        ) : (
          <StatAdminSelector
            statAdmins={statAdmins}
            assignedStatAdmins={assignedStatAdmins}
            onToggleStatAdmin={onToggleStatAdmin}
            loadingStatAdmins={loadingStatAdmins}
          />
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
          <div className="w-8 h-8 bg-muted rounded-full" />
          <div className="flex-1">
            <div className="h-3 bg-muted rounded w-32 mb-2" />
            <div className="h-3 bg-muted rounded w-24" />
          </div>
          <div className="h-8 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Stat Admins Available</h3>
      <p className="text-muted-foreground">
        No users with stat admin role found in the system.
      </p>
    </div>
  );
}

interface StatAdminSelectorProps {
  statAdmins: StatAdmin[];
  assignedStatAdmins: string[];
  onToggleStatAdmin: (adminId: string) => void;
  loadingStatAdmins: boolean;
}

function StatAdminSelector({
  statAdmins,
  assignedStatAdmins,
  onToggleStatAdmin,
  loadingStatAdmins,
}: StatAdminSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Stat Admins</Label>
        <Badge variant="secondary" className="text-xs">
          {assignedStatAdmins.length} of {statAdmins.length} assigned
        </Badge>
      </div>
      
      <SearchableStatAdminSelect
        statAdmins={statAdmins}
        selectedIds={assignedStatAdmins}
        onToggle={onToggleStatAdmin}
        loading={loadingStatAdmins}
        placeholder="Search and select stat admins..."
      />
      
      {assignedStatAdmins.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <Bell className="w-4 h-4 inline mr-1" />
            Assigned stat admins can access live game tracking for this tournament.
          </p>
        </div>
      )}
    </div>
  );
}
