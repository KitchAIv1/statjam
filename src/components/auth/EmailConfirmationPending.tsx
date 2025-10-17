'use client';

import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { authServiceV2 } from '@/lib/services/authServiceV2';

interface EmailConfirmationPendingProps {
  email: string;
  onBack: () => void;
}

const EmailConfirmationPending = ({ email, onBack }: EmailConfirmationPendingProps) => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    setResending(true);
    setError('');
    
    try {
      const { error } = await authServiceV2.resendConfirmationEmail(email);
      if (error) {
        throw error;
      }
      setResent(true);
      setTimeout(() => setResent(false), 3000); // Reset after 3 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef7ed 0%, #fff7ed 50%, #fef2f2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      border: '1px solid rgba(251, 146, 60, 0.2)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      textAlign: 'center' as const,
    },
    iconContainer: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(239, 68, 68, 0.1))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      background: 'linear-gradient(to right, #fb923c, #ef4444)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '12px',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '16px',
      lineHeight: '1.5',
      marginBottom: '24px',
    },
    emailHighlight: {
      color: '#f97316',
      fontWeight: '600',
      background: 'rgba(251, 146, 60, 0.1)',
      padding: '2px 8px',
      borderRadius: '6px',
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(to right, #fb923c, #ef4444)',
      color: 'white',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    secondaryButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '12px',
      border: '2px solid rgba(251, 146, 60, 0.2)',
      background: 'transparent',
      color: '#6b7280',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    successMessage: {
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.2)',
      color: '#059669',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    errorMessage: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      color: '#dc2626',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
    },
    instructions: {
      background: 'rgba(251, 146, 60, 0.05)',
      border: '1px solid rgba(251, 146, 60, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      textAlign: 'left' as const,
    },
    instructionTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
    },
    instructionList: {
      fontSize: '14px',
      color: '#6b7280',
      lineHeight: '1.5',
      paddingLeft: '16px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <Mail size={40} color="#f97316" />
        </div>

        <h1 style={styles.title}>Check Your Email</h1>
        
        <p style={styles.subtitle}>
          We've sent a confirmation link to<br />
          <span style={styles.emailHighlight}>{email}</span>
        </p>

        <div style={styles.instructions}>
          <div style={styles.instructionTitle}>Next Steps:</div>
          <ol style={styles.instructionList}>
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the confirmation link in the email</li>
            <li>Return here and sign in to access your dashboard</li>
          </ol>
        </div>

        {resent && (
          <div style={styles.successMessage}>
            <CheckCircle size={16} />
            Email sent successfully! Check your inbox.
          </div>
        )}

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={resending}
          style={{
            ...styles.button,
            opacity: resending ? 0.7 : 1,
            cursor: resending ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!resending) {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'linear-gradient(to right, #ea580c, #dc2626)';
              target.style.transform = 'translateY(-2px)';
              target.style.boxShadow = '0 8px 25px rgba(251, 146, 60, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!resending) {
              const target = e.target as HTMLButtonElement;
              target.style.background = 'linear-gradient(to right, #fb923c, #ef4444)';
              target.style.transform = 'translateY(0px)';
              target.style.boxShadow = 'none';
            }
          }}
        >
          {resending ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Resend Email
            </>
          )}
        </button>

        <button
          onClick={onBack}
          style={styles.secondaryButton}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.borderColor = '#f97316';
            target.style.color = '#f97316';
            target.style.background = 'rgba(251, 146, 60, 0.05)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.borderColor = 'rgba(251, 146, 60, 0.2)';
            target.style.color = '#6b7280';
            target.style.background = 'transparent';
          }}
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmationPending;
