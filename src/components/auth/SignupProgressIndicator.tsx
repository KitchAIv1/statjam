/**
 * SignupProgressIndicator Component
 * 
 * Purpose: Visual progress indicator for multi-step signup
 * Follows .cursorrules: <100 lines, single responsibility
 */

import React from 'react';

interface SignupProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const SignupProgressIndicator: React.FC<SignupProgressIndicatorProps> = ({
  currentStep,
  totalSteps
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '32px',
      padding: '0 20px'
    }}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <React.Fragment key={index}>
            {/* Step Circle */}
            <div
              style={{
                width: isActive ? '12px' : '10px',
                height: isActive ? '12px' : '10px',
                borderRadius: '50%',
                backgroundColor: isCompleted || isActive ? '#f97316' : 'rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : 'none',
                position: 'relative'
              }}
            >
              {isCompleted && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#fff',
                  fontSize: '8px',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: isCompleted ? '#f97316' : 'rgba(255, 255, 255, 0.1)',
                  transition: 'background-color 0.3s ease',
                  maxWidth: '60px'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
      
      {/* Step Counter */}
      <div style={{
        marginLeft: '12px',
        color: '#9CA3AF',
        fontSize: '12px',
        fontWeight: '500',
        minWidth: '40px',
        textAlign: 'right'
      }}>
        {currentStep + 1}/{totalSteps}
      </div>
    </div>
  );
};

