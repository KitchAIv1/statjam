import { useState } from 'react';
import { TournamentCreateRequest, TournamentFormState } from '@/lib/types/tournament';
import { TournamentService } from '@/lib/services/tournamentService';

// Hook for Tournament Creation Form Management
export function useTournamentForm() {
  const [state, setState] = useState<TournamentFormState>({
    data: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      venue: '',
      maxTeams: 8,
      tournamentType: 'single_elimination',
      isPublic: true,
      entryFee: 0,
      prizePool: 0,
      country: 'US',
      logo: '', // Tournament logo URL
      ruleset: 'NBA', // ✅ PHASE 1: Default to NBA ruleset
      has_divisions: false, // Default: no divisions
      division_count: undefined,
      division_names: undefined,
    },
    errors: {},
    loading: false,
    currentStep: 1,
  });

  // Update form data
  const updateData = (field: keyof TournamentCreateRequest, value: any) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' }, // Clear error when field is updated
    }));
  };

  // Update multiple fields at once
  const updateFields = (fields: Partial<TournamentCreateRequest>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...fields },
      errors: {},
    }));
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Info
        if (!state.data.name?.trim()) {
          errors.name = 'Tournament name is required';
        } else if (state.data.name.length < 3) {
          errors.name = 'Tournament name must be at least 3 characters';
        }

        if (!state.data.description?.trim()) {
          errors.description = 'Tournament description is required';
        }

        if (!state.data.venue?.trim()) {
          errors.venue = 'Venue is required';
        }

        if (!state.data.country?.trim()) {
          errors.country = 'Country is required';
        }
        break;

      case 2: // Tournament Type & Settings
        if (!state.data.tournamentType) {
          errors.tournamentType = 'Tournament type is required';
        }

        if (!state.data.maxTeams || state.data.maxTeams < 2) {
          errors.maxTeams = 'At least 2 teams required';
        } else if (state.data.maxTeams > 64) {
          errors.maxTeams = 'Maximum 64 teams allowed';
        }

        // Validate division settings if divisions are enabled
        if (state.data.has_divisions) {
          if (!state.data.division_count || state.data.division_count < 2) {
            errors.division_count = 'At least 2 divisions required';
          } else if (state.data.division_count > 8) {
            errors.division_count = 'Maximum 8 divisions allowed';
          }
        }
        break;

      case 3: // Schedule & Finances
        if (!state.data.startDate) {
          errors.startDate = 'Start date is required';
        }

        if (!state.data.endDate) {
          errors.endDate = 'End date is required';
        }

        if (state.data.startDate && state.data.endDate && new Date(state.data.startDate) >= new Date(state.data.endDate)) {
          errors.endDate = 'End date must be after start date';
        }

        if (state.data.entryFee && state.data.entryFee < 0) {
          errors.entryFee = 'Entry fee cannot be negative';
        }

        if (state.data.prizePool && state.data.prizePool < 0) {
          errors.prizePool = 'Prize pool cannot be negative';
        }
        break;
    }

    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Navigate between steps
  const nextStep = () => {
    if (validateStep(state.currentStep)) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      return true;
    }
    return false;
  };

  const prevStep = () => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.max(1, prev.currentStep - 1),
      errors: {} 
    }));
  };

  const goToStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step, errors: {} }));
  };

  // Submit tournament
  const submitTournament = async (organizerId: string): Promise<boolean> => {
    console.log('🏆 Starting tournament submission...', { organizerId, data: state.data });
    
    // Import notification service
    const { notify } = await import('@/lib/services/notificationService');
    
    // Validate all data
    const allErrors = TournamentService.validateTournamentData(state.data);
    if (Object.keys(allErrors).length > 0) {
      console.error('❌ Validation errors:', allErrors);
      setState(prev => ({ ...prev, errors: allErrors }));
      
      // Show error toast
      const errorCount = Object.keys(allErrors).length;
      notify.error(
        'Validation failed',
        `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before creating the tournament`
      );
      return false;
    }

    setState(prev => ({ ...prev, loading: true, errors: {} }));

    // Show loading toast
    const loadingToastId = notify.loading('Creating tournament...');

    try {
      const tournamentData = state.data as TournamentCreateRequest;
      console.log('📝 Creating tournament with data:', tournamentData);
      
      const result = await TournamentService.createTournament(tournamentData, organizerId);
      console.log('✅ Tournament created successfully:', result);
      
      // Dismiss loading toast and show success
      notify.dismiss(loadingToastId);
      notify.success(
        'Tournament created!',
        `${result.name} has been created successfully`
      );
      
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error) {
      console.error('❌ Tournament creation failed:', error);
      
      // Dismiss loading toast and show error
      notify.dismiss(loadingToastId);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tournament';
      notify.error('Failed to create tournament', errorMessage);
      
      setState(prev => ({
        ...prev,
        loading: false,
        errors: { 
          submit: errorMessage
        }
      }));
      return false;
    }
  };

  // Reset form
  const resetForm = () => {
    setState({
      data: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        venue: '',
        maxTeams: 8,
        tournamentType: 'single_elimination',
        isPublic: true,
        entryFee: 0,
        prizePool: 0,
        country: 'US',
        has_divisions: false,
        division_count: undefined,
        division_names: undefined,
      },
      errors: {},
      loading: false,
      currentStep: 1,
    });
  };

  return {
    data: state.data,
    errors: state.errors,
    loading: state.loading,
    currentStep: state.currentStep,
    updateData,
    updateFields,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    submitTournament,
    resetForm,
  };
}