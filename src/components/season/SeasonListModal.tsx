// ============================================================================
// SEASON LIST MODAL (<150 lines)
// Purpose: Display list of seasons for a team, allow navigation to detail
// Follows .cursorrules: Single responsibility, <200 lines
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { SeasonService } from '@/lib/services/seasonService';
import { Season } from '@/lib/types/season';
import { CoachTeam } from '@/lib/types/coach';
import { SeasonCard } from './SeasonCard';
import { Calendar, Plus, Loader2 } from 'lucide-react';

interface SeasonListModalProps {
  team: CoachTeam;
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onEdit: (season: Season) => void;
}

export function SeasonListModal({ team, isOpen, onClose, onCreateNew, onEdit }: SeasonListModalProps) {
  const router = useRouter();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch seasons for team
  useEffect(() => {
    const fetchSeasons = async () => {
      if (!isOpen || !team.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await SeasonService.getSeasonsByTeam(team.id);
        setSeasons(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load seasons');
      } finally {
        setLoading(false);
      }
    };

    fetchSeasons();
  }, [isOpen, team.id]);

  const handleSeasonClick = (season: Season) => {
    router.push(`/dashboard/coach/season/${season.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            {team.name} Seasons
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-2 -mx-6 px-6">
          {loading && (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading seasons...</p>
            </div>
          )}

          {error && (
            <div className="py-12 text-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && seasons.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No seasons yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Create a season to group and analyze your games
              </p>
              <Button onClick={onCreateNew} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Create First Season
              </Button>
            </div>
          )}

          {!loading && !error && seasons.length > 0 && (
            <div className="space-y-3">
              {seasons.map((season) => (
                <SeasonCard
                  key={season.id}
                  season={season}
                  onClick={() => handleSeasonClick(season)}
                  onEdit={() => onEdit(season)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && seasons.length > 0 && (
          <div className="pt-4 border-t flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="w-4 h-4" />
              New Season
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

