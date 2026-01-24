/**
 * BroadcastReadinessIndicator Component
 * 
 * Visual indicator showing broadcast readiness status.
 * Displays green checkmark when ready, yellow alert when not ready.
 * Shows missing requirements in tooltip.
 * Limits: < 200 lines
 */

'use client';

import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BroadcastReadinessResult } from '@/hooks/useBroadcastReadiness';

interface BroadcastReadinessIndicatorProps {
  readiness: BroadcastReadinessResult;
  isBroadcasting: boolean;
}

export function BroadcastReadinessIndicator({
  readiness,
  isBroadcasting,
}: BroadcastReadinessIndicatorProps) {
  if (isBroadcasting) {
    return null;
  }

  return (
    <Card className="p-2.5 flex-shrink-0">
      <div className="flex items-center gap-2">
        {readiness.isReady ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-600">Ready to broadcast</p>
              <p className="text-[10px] text-muted-foreground">All requirements met</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-yellow-600">Not ready</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[10px] text-muted-foreground cursor-help truncate">
                    Missing: {readiness.missing.join(', ')}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-semibold mb-1">Requirements to broadcast:</p>
                  <ul className="text-xs space-y-0.5">
                    <li className={readiness.requirements.game ? 'text-green-600' : 'text-muted-foreground'}>
                      {readiness.requirements.game ? '✓' : '○'} Select a game
                    </li>
                    <li className={readiness.requirements.video ? 'text-green-600' : 'text-muted-foreground'}>
                      {readiness.requirements.video ? '✓' : '○'} Connect video source
                    </li>
                    <li className={readiness.requirements.composition ? 'text-green-600' : 'text-muted-foreground'}>
                      {readiness.requirements.composition ? '✓' : '○'} Start composition
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
