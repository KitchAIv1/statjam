'use client';

import React from 'react';
import { Trophy, Settings, Users, Check, ArrowLeft, ArrowRight, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useTournamentForm } from '@/lib/hooks/useTournamentForm';
import { useAuthV2 } from '@/hooks/useAuthV2';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getRulesetDisplayName, getRulesetDescription } from '@/lib/types/ruleset';

const CreateTournamentV2 = () => {
  const { user, loading } = useAuthV2();
  const userRole = user?.role;
  const router = useRouter();
  const {
    data,
    errors,
    loading: formLoading,
    currentStep,
    updateData,
    nextStep,
    prevStep,
    submitTournament,
    resetForm,
  } = useTournamentForm();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'organizer')) {
      router.push('/auth');
    }
  }, [user, userRole, loading, router]);

  if (loading || !user || userRole !== 'organizer') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--dashboard-bg)',
        color: 'var(--dashboard-text-primary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '18px',
          fontWeight: '500'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--dashboard-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Basic Info', icon: <Trophy style={{ width: '20px', height: '20px' }} /> },
    { id: 2, title: 'Tournament Setup', icon: <Settings style={{ width: '20px', height: '20px' }} /> },
    { id: 3, title: 'Schedule & Budget', icon: <Calendar style={{ width: '20px', height: '20px' }} /> },
    { id: 4, title: 'Review & Create', icon: <Check style={{ width: '20px', height: '20px' }} /> },
  ];

  const handleSubmit = async () => {
    console.log('🚀 Tournament submission initiated...');
    const success = await submitTournament(user.id);
    if (success) {
      console.log('✅ Tournament created successfully, redirecting to dashboard...');
      // Add a small delay to show success state
      setTimeout(() => {
        router.push('/dashboard?created=true');
      }, 1000);
    } else {
      console.log('❌ Tournament creation failed');
    }
  };

  // CLEAN SLATE STYLING - AUTH V2 BRANDING CONSISTENCY
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'var(--dashboard-bg)',
      paddingTop: '100px',
      paddingBottom: '60px',
    },
    content: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '0 24px',
    },
    header: {
      marginBottom: '48px',
      textAlign: 'center',
    },
    backButton: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      borderRadius: '10px',
      padding: '12px 16px',
      color: 'var(--dashboard-primary)',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
    },
    backButtonHover: {
      background: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'var(--dashboard-primary)',
    },
    title: {
      fontSize: '42px',
      fontWeight: '700',
      background: 'var(--dashboard-gradient)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: "'Anton', system-ui, sans-serif",
      marginBottom: '16px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '16px',
      color: 'var(--dashboard-text-secondary)',
      fontWeight: '400',
      lineHeight: '1.6',
    },
    progressContainer: {
      marginBottom: '48px',
    },
    progressBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      marginBottom: '32px',
    },
    step: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      position: 'relative',
    },
    stepIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      borderWidth: '2px',
      borderStyle: 'solid',
    },
    stepIconActive: {
      background: 'var(--dashboard-gradient)',
      borderColor: 'var(--dashboard-primary)',
      color: 'white',
      boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)',
    },
    stepIconCompleted: {
      background: 'var(--dashboard-gradient)',
      borderColor: 'var(--dashboard-primary)',
      color: 'white',
    },
    stepIconInactive: {
      background: 'var(--dashboard-card)',
      borderColor: 'var(--dashboard-border)',
      color: 'var(--dashboard-text-secondary)',
    },
    stepTitle: {
      fontSize: '14px',
      fontWeight: '600',
      textAlign: 'center',
    },
    stepTitleActive: {
      color: 'var(--dashboard-primary)',
    },
    stepTitleInactive: {
      color: 'var(--dashboard-text-secondary)',
    },
    formCard: {
      background: 'var(--dashboard-card)',
      borderRadius: '20px',
      padding: '40px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      backdropFilter: 'blur(20px)',
      marginBottom: '32px',
    },
    formGrid: {
      display: 'grid',
      gap: '24px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
    },
    input: {
      padding: '16px',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      background: 'var(--input-background)',
      color: 'var(--dashboard-text-primary)',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
    },
    inputFocus: {
      borderColor: 'var(--dashboard-primary)',
      boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
    },
    inputError: {
      borderColor: '#ff4444',
    },
    textarea: {
      padding: '16px',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      background: 'var(--input-background)',
      color: 'var(--dashboard-text-primary)',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
      resize: 'vertical',
      minHeight: '120px',
    },
    select: {
      padding: '16px',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      outline: 'none',
    },
    errorText: {
      fontSize: '12px',
      color: '#ff4444',
      marginTop: '4px',
    },
    typeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
    },
    typeOption: {
      padding: '20px',
      borderRadius: '12px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(255, 215, 0, 0.2)',
      background: 'rgba(255, 255, 255, 0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
    },
    typeOptionSelected: {
      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
      borderColor: '#FFD700',
      color: '#1a1a1a',
    },
    typeOptionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
    },
    typeOptionDesc: {
      fontSize: '14px',
      opacity: 0.8,
    },
    reviewSection: {
      marginBottom: '24px',
    },
    reviewTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: 'var(--dashboard-text-primary)',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    reviewGrid: {
      display: 'grid',
      gap: '12px',
    },
    reviewItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--dashboard-border)',
    },
    reviewLabel: {
      fontSize: '14px',
      color: 'var(--dashboard-text-secondary)',
    },
    reviewValue: {
      fontSize: '14px',
      color: 'var(--dashboard-text-primary)',
      fontWeight: '500',
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
    },
    button: {
      padding: '16px 32px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'none',
    },
    buttonSecondary: {
      background: 'transparent',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--dashboard-border)',
      color: 'var(--dashboard-primary)',
    },
    buttonSecondaryHover: {
      background: 'rgba(249, 115, 22, 0.1)',
      borderColor: 'var(--dashboard-primary)',
    },
    buttonPrimary: {
      background: 'var(--dashboard-gradient)',
      color: 'white',
    },
    buttonPrimaryHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tournament Name *</label>
              <input
                type="text"
                value={data.name || ''}
                onChange={(e) => updateData('name', e.target.value)}
                placeholder="Enter tournament name"
                style={{
                  ...styles.input,
                  ...(errors.name ? styles.inputError : {})
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
              />
              {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Describe your tournament"
                style={{
                  ...styles.textarea,
                  ...(errors.description ? styles.inputError : {})
                }}
                onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                onBlur={(e) => Object.assign(e.currentTarget.style, styles.textarea)}
              />
              {errors.description && <span style={styles.errorText}>{errors.description}</span>}
            </div>

            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Venue *</label>
                <input
                  type="text"
                  value={data.venue || ''}
                  onChange={(e) => updateData('venue', e.target.value)}
                  placeholder="Tournament venue"
                  style={{
                    ...styles.input,
                    ...(errors.venue ? styles.inputError : {})
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
                />
                {errors.venue && <span style={styles.errorText}>{errors.venue}</span>}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Country *</label>
                <select
                  value={data.country || 'US'}
                  onChange={(e) => updateData('country', e.target.value)}
                  style={{
                    ...styles.select,
                    ...(errors.country ? styles.inputError : {})
                  }}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                  <option value="JP">Japan</option>
                  <option value="BR">Brazil</option>
                </select>
                {errors.country && <span style={styles.errorText}>{errors.country}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={styles.formGrid}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tournament Format *</label>
              <div style={styles.typeGrid}>
                {[
                  { value: 'single_elimination', title: 'Single Elimination', desc: 'One loss and you\'re out' },
                  { value: 'double_elimination', title: 'Double Elimination', desc: 'Two chances to compete' },
                  { value: 'round_robin', title: 'Round Robin', desc: 'Everyone plays everyone' },
                ].map((type) => (
                  <div
                    key={type.value}
                    style={{
                      ...styles.typeOption,
                      ...(data.tournamentType === type.value ? styles.typeOptionSelected : {})
                    }}
                    onClick={() => updateData('tournamentType', type.value)}
                  >
                    <div style={styles.typeOptionTitle}>{type.title}</div>
                    <div style={styles.typeOptionDesc}>{type.desc}</div>
                  </div>
                ))}
              </div>
              {errors.tournamentType && <span style={styles.errorText}>{errors.tournamentType}</span>}
            </div>

            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Maximum Teams *</label>
                <select
                  value={data.maxTeams || 8}
                  onChange={(e) => updateData('maxTeams', parseInt(e.target.value))}
                  style={{
                    ...styles.select,
                    ...(errors.maxTeams ? styles.inputError : {})
                  }}
                >
                  {[4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 18, 24, 32].map(num => (
                    <option key={num} value={num}>{num} Teams</option>
                  ))}
                </select>
                {errors.maxTeams && <span style={styles.errorText}>{errors.maxTeams}</span>}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Visibility</label>
                <select
                  value={data.isPublic ? 'true' : 'false'}
                  onChange={(e) => updateData('isPublic', e.target.value === 'true')}
                  style={styles.select}
                >
                  <option value="true">Public (discoverable)</option>
                  <option value="false">Private (invite only)</option>
                </select>
              </div>
            </div>

            {/* ✅ PHASE 1: Ruleset Selector */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Game Rules</label>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--dashboard-text-secondary)' }}>
                Choose the official ruleset for your tournament
              </div>
              <div style={styles.typeGrid}>
                {[
                  { value: 'NBA', title: 'NBA', desc: '12 min quarters, 24s shot clock' },
                  { value: 'FIBA', title: 'FIBA', desc: '10 min quarters, 24s shot clock' },
                  { value: 'NCAA', title: 'NCAA', desc: '20 min halves, 30s shot clock' },
                ].map((ruleset) => (
                  <div
                    key={ruleset.value}
                    style={{
                      ...styles.typeOption,
                      ...(data.ruleset === ruleset.value ? styles.typeOptionSelected : {}),
                      minHeight: '80px'
                    }}
                    onClick={() => updateData('ruleset', ruleset.value)}
                  >
                    <div style={styles.typeOptionTitle}>{ruleset.title}</div>
                    <div style={styles.typeOptionDesc}>{ruleset.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--dashboard-text-tertiary)' }}>
                💡 All automation features are OFF by default. You can enable them later in tournament settings.
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={styles.formGrid}>
            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Start Date *</label>
                <input
                  type="date"
                  value={data.startDate || ''}
                  onChange={(e) => updateData('startDate', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.startDate ? styles.inputError : {})
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
                />
                {errors.startDate && <span style={styles.errorText}>{errors.startDate}</span>}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>End Date *</label>
                <input
                  type="date"
                  value={data.endDate || ''}
                  onChange={(e) => updateData('endDate', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.endDate ? styles.inputError : {})
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
                />
                {errors.endDate && <span style={styles.errorText}>{errors.endDate}</span>}
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Entry Fee ($)</label>
                <input
                  type="number"
                  value={data.entryFee || 0}
                  onChange={(e) => updateData('entryFee', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  style={{
                    ...styles.input,
                    ...(errors.entryFee ? styles.inputError : {})
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
                />
                {errors.entryFee && <span style={styles.errorText}>{errors.entryFee}</span>}
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Prize Pool ($)</label>
                <input
                  type="number"
                  value={data.prizePool || 0}
                  onChange={(e) => updateData('prizePool', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  style={{
                    ...styles.input,
                    ...(errors.prizePool ? styles.inputError : {})
                  }}
                  onFocus={(e) => Object.assign(e.currentTarget.style, styles.inputFocus)}
                  onBlur={(e) => Object.assign(e.currentTarget.style, styles.input)}
                />
                {errors.prizePool && <span style={styles.errorText}>{errors.prizePool}</span>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={styles.formGrid}>
            <div style={styles.reviewSection}>
              <div style={styles.reviewTitle}>
                <Trophy style={{ width: '20px', height: '20px' }} />
                Tournament Information
              </div>
              <div style={styles.reviewGrid}>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Name</span>
                  <span style={styles.reviewValue}>{data.name}</span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Description</span>
                  <span style={styles.reviewValue}>{data.description}</span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Venue</span>
                  <span style={styles.reviewValue}>{data.venue}</span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Country</span>
                  <span style={styles.reviewValue}>{data.country}</span>
                </div>
              </div>
            </div>

            <div style={styles.reviewSection}>
              <div style={styles.reviewTitle}>
                <Settings style={{ width: '20px', height: '20px' }} />
                Tournament Setup
              </div>
              <div style={styles.reviewGrid}>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Format</span>
                  <span style={styles.reviewValue}>
                    {data.tournamentType?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Game Rules</span>
                  <span style={styles.reviewValue}>
                    {data.ruleset || 'NBA'} ({getRulesetDescription(data.ruleset || 'NBA')})
                  </span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Maximum Teams</span>
                  <span style={styles.reviewValue}>{data.maxTeams}</span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Visibility</span>
                  <span style={styles.reviewValue}>{data.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </div>

            <div style={styles.reviewSection}>
              <div style={styles.reviewTitle}>
                <Calendar style={{ width: '20px', height: '20px' }} />
                Schedule & Budget
              </div>
              <div style={styles.reviewGrid}>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Start Date</span>
                  <span style={styles.reviewValue}>
                    {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>End Date</span>
                  <span style={styles.reviewValue}>
                    {data.endDate ? new Date(data.endDate).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Entry Fee</span>
                  <span style={styles.reviewValue}>${data.entryFee || 0}</span>
                </div>
                <div style={styles.reviewItem}>
                  <span style={styles.reviewLabel}>Prize Pool</span>
                  <span style={styles.reviewValue}>${data.prizePool || 0}</span>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff4444',
                fontSize: '14px',
              }}>
                {errors.submit}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
        <button
          onClick={() => router.push('/dashboard?section=tournaments')}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tournaments
        </button>
          <h1 style={styles.title}>CREATE TOURNAMENT</h1>
          <p style={styles.subtitle}>
            Set up your professional tournament in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            {steps.map((step, index) => (
              <div key={step.id} style={styles.step}>
                <div
                  style={{
                    ...styles.stepIcon,
                    ...(step.id === currentStep ? styles.stepIconActive :
                        step.id < currentStep ? styles.stepIconCompleted :
                        styles.stepIconInactive)
                  }}
                >
                  {step.id < currentStep ? (
                    <Check style={{ width: '20px', height: '20px' }} />
                  ) : (
                    step.icon
                  )}
                </div>
                <div
                  style={{
                    ...styles.stepTitle,
                    ...(step.id <= currentStep ? styles.stepTitleActive : styles.stepTitleInactive)
                  }}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div style={styles.formCard}>
          {/* Error Display */}
          {errors.submit && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              color: '#ff4444'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>Error Creating Tournament</div>
              <div style={{ fontSize: '14px' }}>{errors.submit}</div>
            </div>
          )}
          
          {renderStepContent()}
          
          {/* Success Message */}
          {formLoading && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '20px',
              padding: '32px',
              textAlign: 'center',
              zIndex: 1000,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <Trophy style={{ width: '32px', height: '32px', color: '#1a1a1a' }} />
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#FFD700',
                marginBottom: '12px'
              }}>
                Creating Tournament...
              </h3>
              <p style={{
                fontSize: '16px',
                color: '#b3b3b3',
                marginBottom: '24px'
              }}>
                Please wait while we save your tournament to the database.
              </p>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid rgba(255, 215, 0, 0.3)',
                borderTopColor: '#FFD700',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            style={{
              ...styles.button,
              ...styles.buttonSecondary,
              ...(currentStep === 1 ? styles.buttonDisabled : {})
            }}
            onClick={prevStep}
            disabled={currentStep === 1}
            onMouseEnter={(e) => {
              if (currentStep > 1) {
                Object.assign(e.currentTarget.style, styles.buttonSecondaryHover);
              }
            }}
            onMouseLeave={(e) => {
              if (currentStep > 1) {
                Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonSecondary });
              }
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              style={{
                ...styles.button,
                ...styles.buttonPrimary
              }}
              onClick={nextStep}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonPrimaryHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonPrimary })}
            >
              Next Step
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
          ) : (
            <button
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(formLoading ? styles.buttonDisabled : {})
              }}
              onClick={handleSubmit}
              disabled={formLoading}
              onMouseEnter={(e) => {
                if (!formLoading) {
                  Object.assign(e.currentTarget.style, styles.buttonPrimaryHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!formLoading) {
                  Object.assign(e.currentTarget.style, { ...styles.button, ...styles.buttonPrimary });
                }
              }}
            >
              {formLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #1a1a1a',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  <Trophy style={{ width: '16px', height: '16px' }} />
                  Create Tournament
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentV2;