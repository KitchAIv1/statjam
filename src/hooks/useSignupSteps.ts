/**
 * useSignupSteps Hook
 * 
 * Purpose: Manage multi-step signup UI state
 * Pure UI state management - no auth logic
 * Follows .cursorrules: <100 lines, single responsibility
 */

import { useState, useCallback } from 'react';

export type SignupStep = 'identity' | 'role' | 'location' | 'security';

interface UseSignupStepsReturn {
  currentStep: SignupStep;
  stepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
  canContinue: boolean;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: SignupStep) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

const STEP_ORDER: SignupStep[] = ['identity', 'role', 'location', 'security'];

/**
 * Hook to manage signup step navigation
 * Pure UI state - no business logic
 */
export function useSignupSteps(): UseSignupStepsReturn {
  const [currentStep, setCurrentStep] = useState<SignupStep>('identity');

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const totalSteps = STEP_ORDER.length;

  const goToNextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < totalSteps) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  }, [stepIndex, totalSteps]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  }, [stepIndex]);

  const goToStep = useCallback((step: SignupStep) => {
    if (STEP_ORDER.includes(step)) {
      setCurrentStep(step);
    }
  }, []);

  return {
    currentStep,
    stepIndex,
    totalSteps,
    canGoBack: stepIndex > 0,
    canContinue: stepIndex < totalSteps - 1,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === totalSteps - 1
  };
}

