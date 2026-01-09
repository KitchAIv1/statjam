// ============================================================================
// SEASON CREATE MODAL - Modal shell (<200 lines)
// Purpose: Multi-step modal for creating a new season
// Follows .cursorrules: UI component, <200 lines, orchestration only
// ============================================================================

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Calendar, Palette, List, Check, Loader2 } from 'lucide-react';
import { CoachTeam } from '@/lib/types/coach';
import { useSeasonForm } from '@/hooks/useSeasonForm';
import { useSeasonGames } from '@/hooks/useSeasonGames';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { SeasonService } from '@/lib/services/seasonService';
import { SeasonFormBasicInfo } from './SeasonFormBasicInfo';
import { SeasonFormDates } from './SeasonFormDates';
import { SeasonFormBranding } from './SeasonFormBranding';
import { SeasonGamePicker } from './SeasonGamePicker';

interface SeasonCreateModalProps {
  team: CoachTeam;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Calendar },
  { id: 2, label: 'Dates', icon: Calendar },
  { id: 3, label: 'Branding', icon: Palette },
  { id: 4, label: 'Games', icon: List },
];

export function SeasonCreateModal({ team, isOpen, onClose, onCreated }: SeasonCreateModalProps) {
  const { user } = useAuthV2();
  const form = useSeasonForm(team.id);
  const gamesPicker = useSeasonGames({ teamId: team.id });

  // Logo upload
  const logoUpload = usePhotoUpload({
    userId: user?.id || '',
    photoType: 'season_logo',
    currentPhotoUrl: form.data.logo || null,
    onSuccess: (url) => form.updateField('logo', url),
    onError: (err) => console.error('Logo upload error:', err),
  });

  // Sync selected games to form
  React.useEffect(() => {
    form.updateField('game_ids', gamesPicker.selectedIds);
  }, [gamesPicker.selectedIds]);

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!form.validateStep(4)) return;

    form.setLoading(true);
    try {
      await SeasonService.createSeason(form.data as any, user.id);
      onCreated();
      onClose();
      form.reset();
      gamesPicker.deselectAll();
    } catch (err) {
      form.setError('submit', err instanceof Error ? err.message : 'Failed to create season');
    } finally {
      form.setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (form.currentStep) {
      case 1:
        return (
          <SeasonFormBasicInfo
            name={form.data.name || ''}
            description={form.data.description || ''}
            leagueName={form.data.league_name || ''}
            seasonType={form.data.season_type || 'regular'}
            seasonYear={form.data.season_year || ''}
            conference={form.data.conference || ''}
            errors={form.errors}
            onChange={(field, value) => form.updateField(field as any, value)}
          />
        );
      case 2:
        return (
          <SeasonFormDates
            startDate={form.data.start_date || ''}
            endDate={form.data.end_date || ''}
            homeVenue={form.data.home_venue || ''}
            errors={form.errors}
            onChange={(field, value) => form.updateField(field as any, value)}
          />
        );
      case 3:
        return (
          <SeasonFormBranding
            logo={form.data.logo || ''}
            primaryColor={form.data.primary_color || '#FF6B00'}
            secondaryColor={form.data.secondary_color || '#1A1A1A'}
            isPublic={form.data.is_public || false}
            logoPreview={logoUpload.previewUrl}
            logoUploading={logoUpload.uploading}
            logoProgress={logoUpload.progress}
            logoError={logoUpload.error}
            onChange={(field, value) => form.updateField(field as any, value)}
            onLogoSelect={logoUpload.handleFileSelect}
            onLogoRemove={logoUpload.clearPreview}
            onLogoClearError={logoUpload.clearError}
          />
        );
      case 4:
        return (
          <SeasonGamePicker
            games={gamesPicker.games}
            selectedIds={gamesPicker.selectedIds}
            selectedStats={gamesPicker.selectedStats}
            loading={gamesPicker.loading}
            error={gamesPicker.error}
            onToggle={gamesPicker.toggleGame}
            onSelectAll={gamesPicker.selectAll}
            onDeselectAll={gamesPicker.deselectAll}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Create Season
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 px-2">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => form.goToStep(step.id)}
                className={`flex flex-col items-center gap-1 ${
                  form.currentStep === step.id
                    ? 'text-orange-600'
                    : form.currentStep > step.id
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  form.currentStep === step.id
                    ? 'border-orange-500 bg-orange-50'
                    : form.currentStep > step.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                }`}>
                  {form.currentStep > step.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  form.currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-2">{renderStepContent()}</div>

        {/* Error */}
        {form.errors.submit && (
          <p className="text-sm text-red-500 text-center">{form.errors.submit}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          {form.currentStep > 1 ? (
            <Button variant="outline" onClick={form.prevStep} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}

          {form.currentStep < 4 ? (
            <Button onClick={() => form.nextStep()} className="flex-1 gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={form.loading || gamesPicker.selectedIds.length === 0}
              className="flex-1 gap-1"
            >
              {form.loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Season</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

