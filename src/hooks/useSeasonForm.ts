// ============================================================================
// USE SEASON FORM - Form state management (<100 lines)
// Purpose: Manage season creation/edit form state
// Follows .cursorrules: Custom hook, <100 lines, state management only
// ============================================================================

import { useState, useCallback } from 'react';
import { SeasonFormState, SeasonCreateRequest, Season } from '@/lib/types/season';

const getInitialState = (teamId: string, existingSeason?: Season): SeasonFormState => ({
  data: existingSeason ? {
    name: existingSeason.name,
    team_id: teamId,
    description: existingSeason.description || '',
    logo: existingSeason.logo || '',
    league_name: existingSeason.league_name || '',
    season_type: existingSeason.season_type,
    season_year: existingSeason.season_year || '',
    conference: existingSeason.conference || '',
    home_venue: existingSeason.home_venue || '',
    primary_color: existingSeason.primary_color || '#FF6B00',
    secondary_color: existingSeason.secondary_color || '#1A1A1A',
    start_date: existingSeason.start_date || '',
    end_date: existingSeason.end_date || '',
    is_public: existingSeason.is_public,
    game_ids: [], // Will be populated separately
  } : {
    name: '', team_id: teamId, description: '', season_type: 'regular',
    season_year: '', league_name: '', conference: '', home_venue: '',
    primary_color: '#FF6B00', secondary_color: '#1A1A1A', is_public: false, game_ids: [],
  },
  errors: {},
  loading: false,
  currentStep: 1,
});

export function useSeasonForm(teamId: string, existingSeason?: Season) {
  const [state, setState] = useState<SeasonFormState>(getInitialState(teamId, existingSeason));

  const updateField = useCallback(<K extends keyof SeasonCreateRequest>(
    field: K,
    value: SeasonCreateRequest[K]
  ) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: '' },
    }));
  }, []);

  const validateStep = useCallback((step: number): boolean => {
    const errors: Record<string, string> = {};
    const { data } = state;
    
    if (step === 1) {
      if (!data.name?.trim()) errors.name = 'Season name is required';
      if (!data.season_type) errors.season_type = 'Season type is required';
    }
    
    // Steps 2 and 3 (Dates and Branding) have no required fields
    
    if (step === 4) {
      if (!data.game_ids?.length) errors.game_ids = 'Select at least one game';
    }
    
    setState(prev => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }, [state]);

  const nextStep = useCallback(() => {
    if (validateStep(state.currentStep)) {
      setState(prev => ({ ...prev, currentStep: Math.min(4, prev.currentStep + 1) }));
      return true;
    }
    return false;
  }, [state.currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step, errors: {} }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((field: string, message: string) => {
    setState(prev => ({ ...prev, errors: { ...prev.errors, [field]: message } }));
  }, []);

  const reset = useCallback(() => {
    setState(getInitialState(teamId, existingSeason));
  }, [teamId, existingSeason]);

  return {
    data: state.data,
    errors: state.errors,
    loading: state.loading,
    currentStep: state.currentStep,
    updateField,
    validateStep,
    nextStep,
    prevStep,
    goToStep,
    setLoading,
    setError,
    reset,
  };
}

