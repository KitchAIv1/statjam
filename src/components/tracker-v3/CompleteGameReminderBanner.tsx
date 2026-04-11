'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CompleteGameReminderBannerProps {
  onCompleteGame: () => Promise<void>;
  onDismiss: () => void;
}

/**
 * Dismissible nudge when regulation/OT period clock has hit 0:00 but the game
 * is still marked in progress — prompts stat keeper to run the normal completion flow.
 */
export function CompleteGameReminderBanner({
  onCompleteGame,
  onDismiss,
}: CompleteGameReminderBannerProps) {
  const [busy, setBusy] = useState(false);

  const handleComplete = async () => {
    setBusy(true);
    try {
      await onCompleteGame();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mb-3 flex flex-col gap-3 rounded-lg border border-amber-400/80 bg-amber-500/15 px-3 py-3 shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      role="region"
      aria-label="Complete game reminder"
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden />
        <p className="text-sm font-medium text-amber-100">
          Game has ended — mark this game as complete to save the final stats and update the
          leaderboard.
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2 sm:justify-start">
        <Button
          type="button"
          onClick={handleComplete}
          disabled={busy}
          className="bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening…
            </>
          ) : (
            'Complete Game'
          )}
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="rounded-md p-2 text-amber-200/90 transition hover:bg-amber-500/20 hover:text-amber-50 disabled:opacity-50"
          aria-label="Dismiss reminder"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
