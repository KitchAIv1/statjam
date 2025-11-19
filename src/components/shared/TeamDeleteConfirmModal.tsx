'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2, Loader2, Unlink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TeamAction = 'delete' | 'disconnect';

interface TeamDeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  teamId: string;
  teamName: string;
  action: TeamAction;
  isCoachTeam: boolean;
}

interface GameInfo {
  id: string;
  status: string;
  start_time: string | null;
  team_a_id: string;
  team_b_id: string;
}

/**
 * TeamDeleteConfirmModal - Confirmation dialog for team deletion/disconnect
 * 
 * Features:
 * - Handles both DELETE (organizer teams) and DISCONNECT (coach teams)
 * - Shows warning for teams with completed games
 * - Prevents action if active/scheduled games exist
 * - Displays game count and status
 * 
 * Follows .cursorrules: <200 lines, UI component only
 */
export function TeamDeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  teamId,
  teamName,
  action,
  isCoachTeam,
}: TeamDeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingGames, setCheckingGames] = useState(true);
  const [gameInfo, setGameInfo] = useState<{
    active: number;
    scheduled: number;
    completed: number;
  }>({ active: 0, scheduled: 0, completed: 0 });
  const [canDelete, setCanDelete] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && teamId) {
      checkTeamGames();
    } else {
      setGameInfo({ active: 0, scheduled: 0, completed: 0 });
      setCanDelete(true);
      setError(null);
    }
  }, [open, teamId]);

  const checkTeamGames = async () => {
    setCheckingGames(true);
    setError(null);

    try {
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, status, start_time, team_a_id, team_b_id')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

      if (gamesError) {
        console.error('❌ Error checking games:', gamesError);
        setError('Failed to check team games');
        setCheckingGames(false);
        return;
      }

      const gameList = (games || []) as GameInfo[];
      const active = gameList.filter(g => g.status === 'in_progress').length;
      const scheduled = gameList.filter(g => g.status === 'scheduled').length;
      const completed = gameList.filter(g => g.status === 'completed').length;

      setGameInfo({ active, scheduled, completed });
      setCanDelete(active === 0 && scheduled === 0);
    } catch (err) {
      console.error('❌ Error in checkTeamGames:', err);
      setError('Failed to check team games');
    } finally {
      setCheckingGames(false);
    }
  };

  const handleConfirm = async () => {
    if (!canDelete) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('❌ Error deleting team:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${action === 'delete' ? 'text-destructive' : 'text-orange-600'}`}>
            {action === 'delete' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <Unlink className="w-5 h-5" />
            )}
            {action === 'delete' ? 'Delete Team' : 'Disconnect Team'}
          </DialogTitle>
          <DialogDescription>
            {action === 'delete' ? (
              <>Are you sure you want to delete <span className="font-semibold text-foreground">{teamName}</span>?</>
            ) : (
              <>Are you sure you want to disconnect <span className="font-semibold text-foreground">{teamName}</span> from this tournament?</>
            )}
          </DialogDescription>
        </DialogHeader>

        {checkingGames ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Checking team games...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {!canDelete && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive mb-1">
                      Cannot {action === 'delete' ? 'Delete' : 'Disconnect'} Team
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      This team has active or scheduled games that must be cancelled or completed first.
                    </p>
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                      {gameInfo.active > 0 && (
                        <li>• {gameInfo.active} active game(s)</li>
                      )}
                      {gameInfo.scheduled > 0 && (
                        <li>• {gameInfo.scheduled} scheduled game(s)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {canDelete && gameInfo.completed > 0 && action === 'delete' && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-600 mb-1">Warning</h4>
                    <p className="text-sm text-muted-foreground">
                      This team has {gameInfo.completed} completed game(s). Deleting the team will permanently remove all game data and statistics.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canDelete && action === 'disconnect' && (
              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Unlink className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-600 mb-1">Disconnect Team</h4>
                    <p className="text-sm text-muted-foreground">
                      This will remove the team from the tournament. The team will remain accessible to the coach and can be re-added later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {canDelete && gameInfo.completed === 0 && action === 'delete' && (
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  This team has no games. Deleting will remove all team data, including player rosters.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {action === 'delete' ? (
                  <>
                    <li>Permanently delete the team</li>
                    <li>Remove all players from the team roster</li>
                    {gameInfo.completed > 0 && <li>Delete all game data and statistics</li>}
                  </>
                ) : (
                  <>
                    <li>Remove team from this tournament</li>
                    <li>Team will remain accessible to the coach</li>
                    <li>Team can be re-added to tournaments later</li>
                    {gameInfo.completed > 0 && <li>Game data will remain but team won't appear in tournament</li>}
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || checkingGames}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'delete' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading || checkingGames || !canDelete}
            className={action === 'disconnect' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {action === 'delete' ? 'Deleting...' : 'Disconnecting...'}
              </>
            ) : (
              <>
                {action === 'delete' ? (
                  <Trash2 className="w-4 h-4 mr-2" />
                ) : (
                  <Unlink className="w-4 h-4 mr-2" />
                )}
                {action === 'delete' ? 'Delete Team' : 'Disconnect Team'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

